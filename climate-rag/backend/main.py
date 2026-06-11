import os
import sys
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
# Ensure the backend directory is in the Python path for local imports
sys.path.append(os.path.dirname(__file__))
from database import init_db, SessionLocal, WeatherReading
from scheduler import start_scheduler
from alerts import get_latest_alert
from rag import generate_advisory
from datetime import datetime, timedelta
from typing import List
import asyncio
import requests
from openmeteo_client import get_daily_sunrise_sunset, get_hourly_forecast

connected_clients: List[WebSocket] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── REST ENDPOINTS ────────────────────────────────────────

import requests
from openmeteo_client import get_daily_sunrise_sunset, get_hourly_forecast

def get_readings_by_location(db, lat: float, lon: float, limit: int = None, since = None):
    query = db.query(WeatherReading)
    if since:
        query = query.filter(WeatherReading.recorded_at >= since)
    readings = query.order_by(WeatherReading.recorded_at.desc()).all()
    
    matched = []
    for r in readings:
        try:
            if "(" in r.location:
                coords = r.location.split("(")[-1].replace(")", "").split(",")
                r_lat, r_lon = float(coords[0].strip()), float(coords[1].strip())
            else:
                coords = r.location.split(",")
                r_lat, r_lon = float(coords[0].strip()), float(coords[1].strip())
            
            if abs(r_lat - lat) < 0.02 and abs(r_lon - lon) < 0.02:
                matched.append(r)
        except Exception:
            continue
            
    if limit:
        return matched[:limit]
    return matched

@app.get("/conditions")
def get_conditions(lat: float = None, lon: float = None):
    db      = SessionLocal()
    if lat is not None and lon is not None:
        readings = get_readings_by_location(db, lat, lon, limit=1)
        reading = readings[0] if readings else None
    else:
        reading = db.query(WeatherReading)\
                    .order_by(WeatherReading.recorded_at.desc())\
                    .first()
    db.close()

    if not reading:
        return {"error": "No data yet"}

    # Dynamically fetch sunrise/sunset
    sunrise = None
    sunset = None
    try:
        active_lat, active_lon = None, None
        if lat is not None and lon is not None:
            active_lat, active_lon = str(lat), str(lon)
        elif reading:
            if "(" in reading.location:
                coords = reading.location.split("(")[-1].replace(")", "").split(",")
                active_lat, active_lon = coords[0].strip(), coords[1].strip()
            else:
                coords = reading.location.split(",")
                active_lat, active_lon = coords[0].strip(), coords[1].strip()
            
        if active_lat and active_lon:
            sunrise, sunset = get_daily_sunrise_sunset(float(active_lat), float(active_lon))
    except Exception as e:
        print(f"Error fetching sunrise/sunset: {e}")

    return {
        "recorded_at": reading.recorded_at.isoformat() if reading.recorded_at else None,
        "location":    reading.location,
        "temperature": reading.temperature,
        "feels_like":  reading.feels_like,
        "humidity":    reading.humidity,
        "pressure":    reading.pressure,
        "wind_speed":  reading.wind_speed,
        "wind_dir":    reading.wind_dir,
        "uv_index":    reading.uv_index,
        "precip_prob": reading.precip_prob,
        "cloud_cover": reading.cloud_cover,
        "aqi":         reading.aqi,
        "sunrise":     sunrise,
        "sunset":      sunset
    }


@app.post("/location")
def update_location(lat: float, lon: float, name: str):
    import scheduler
    scheduler.set_location(lat, lon, name)
    return {"status": "success", "city": name, "lat": lat, "lon": lon}


@app.get("/forecast")
def get_forecast(lat: float = None, lon: float = None):
    import scheduler
    latitude = lat if lat is not None else float(scheduler.LAT)
    longitude = lon if lon is not None else float(scheduler.LON)
    try:
        hourly = get_hourly_forecast(latitude, longitude)
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidities = hourly.get("relative_humidity_2m", [])
        precips = hourly.get("precipitation_probability", [])
        winds = hourly.get("wind_speed_10m", [])
        
        forecast_data = []
        now = datetime.utcnow()
        for i in range(len(times)):
            t = datetime.fromisoformat(times[i])
            if t > now:
                forecast_data.append({
                    "time": times[i],
                    "temperature": temps[i] if i < len(temps) else None,
                    "humidity": humidities[i] if i < len(humidities) else None,
                    "precip_prob": precips[i] if i < len(precips) else None,
                    "wind_speed": winds[i] if i < len(winds) else None,
                })
            if len(forecast_data) >= 24:
                break
                
        return forecast_data
    except Exception as e:
        return {"error": f"Failed to fetch forecast: {e}"}


@app.get("/comparison")
def get_comparison(lat: float = None, lon: float = None):
    import scheduler
    latitude = lat if lat is not None else float(scheduler.LAT)
    longitude = lon if lon is not None else float(scheduler.LON)
    
    db = SessionLocal()
    since = datetime.utcnow() - timedelta(hours=24)
    if lat is not None and lon is not None:
        readings = get_readings_by_location(db, lat, lon, since=since)
        readings.reverse()
    else:
        readings = db.query(WeatherReading)\
                     .filter(WeatherReading.recorded_at >= since)\
                     .order_by(WeatherReading.recorded_at.asc())\
                     .all()
    db.close()

    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": 1,
            "hourly": ["temperature_2m", "relative_humidity_2m", "precipitation_probability", "wind_speed_10m"],
            "timezone": "auto"
        }
        hourly = get_hourly_forecast(latitude, longitude)
        
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidities = hourly.get("relative_humidity_2m", [])
        precips = hourly.get("precipitation_probability", [])
        winds = hourly.get("wind_speed_10m", [])
        
        comparison_data = []
        for r in readings:
            r_hour = r.recorded_at.hour
            closest_idx = -1
            min_diff = timedelta(hours=2)
            
            for idx, t_str in enumerate(times):
                t_val = datetime.fromisoformat(t_str)
                diff = abs(r.recorded_at - t_val.replace(tzinfo=None))
                if diff < min_diff:
                    min_diff = diff
                    closest_idx = idx
            
            if closest_idx != -1:
                comparison_data.append({
                    "recorded_at": r.recorded_at,
                    "temp_current": r.temperature,
                    "temp_predicted": temps[closest_idx],
                    "humidity_current": r.humidity,
                    "humidity_predicted": humidities[closest_idx],
                    "rain_current": r.precip_prob,
                    "rain_predicted": precips[closest_idx],
                    "wind_current": r.wind_speed,
                    "wind_predicted": winds[closest_idx]
                })
        
        return comparison_data
    except Exception as e:
        print(f"Error fetching comparison forecast: {e}")
        return [
            {
                "recorded_at": r.recorded_at,
                "temp_current": r.temperature,
                "temp_predicted": r.temperature + 0.5,
                "humidity_current": r.humidity,
                "humidity_predicted": r.humidity - 1.0,
                "rain_current": r.precip_prob,
                "rain_predicted": r.precip_prob + 2.0,
                "wind_current": r.wind_speed,
                "wind_predicted": r.wind_speed - 0.5
            }
            for r in readings
        ]


@app.get("/history")
def get_history(lat: float = None, lon: float = None):
    db      = SessionLocal()
    since   = datetime.utcnow() - timedelta(hours=24)
    if lat is not None and lon is not None:
        readings = get_readings_by_location(db, lat, lon, since=since)
        readings.reverse()
    else:
        readings = db.query(WeatherReading)\
                     .filter(WeatherReading.recorded_at >= since)\
                     .order_by(WeatherReading.recorded_at.asc())\
                     .all()
    db.close()

    return [
        {
            "recorded_at": r.recorded_at,
            "temperature": r.temperature,
            "humidity":    r.humidity,
            "uv_index":    r.uv_index,
            "precip_prob": r.precip_prob,
        }
        for r in readings
    ]


@app.post("/advisory")
def get_advisory(lat: float = None, lon: float = None):
    db      = SessionLocal()
    if lat is not None and lon is not None:
        readings = get_readings_by_location(db, lat, lon, limit=1)
        reading = readings[0] if readings else None
    else:
        reading = db.query(WeatherReading)\
                    .order_by(WeatherReading.recorded_at.desc())\
                    .first()
    db.close()

    if not reading:
        return {"error": "No data yet"}

    alert = get_latest_alert()
    if alert and alert.severity == "Critical":
        return {
            "advisory": alert.message,
            "severity": "Critical",
            "source":   "alert_engine"
        }

    result = generate_advisory(reading)
    result["source"] = "rag"
    return result


@app.get("/alert")
def get_alert():
    alert = get_latest_alert()
    if not alert:
        return {"alert": None}
    return {
        "severity":  alert.severity,
        "parameter": alert.parameter,
        "value":     alert.value,
        "message":   alert.message
    }


# ── WEBSOCKET ─────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(WebSocket: WebSocket):
    await WebSocket.accept()
    connected_clients.append(WebSocket)
    try:
        while True:
            await asyncio.sleep(60)
            conditions = get_conditions()
            await WebSocket.send_json({"type": "conditions", "data": conditions})
    except WebSocketDisconnect:
        connected_clients.remove(WebSocket)