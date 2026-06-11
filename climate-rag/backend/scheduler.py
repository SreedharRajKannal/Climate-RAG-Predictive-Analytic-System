import requests
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal, WeatherReading
from alerts import check_alerts

LAT = "8.5241"
LON = "76.9366"
CITY = "Trivandrum"

def set_location(lat: float, lon: float, name: str):
    global LAT, LON, CITY
    LAT = f"{lat:.4f}"
    LON = f"{lon:.4f}"
    CITY = name
    fetch_and_store()

def fetch_and_store():
    try:
        # Use the zero‑dependency client to fetch current weather and cache it.
        from openmeteo_client import get_current_weather, get_daily_sunrise_sunset
        lat = float(LAT)
        lon = float(LON)
        data = get_current_weather(lat, lon)

        # Fetch sunrise/sunset via the same wrapper (they are part of the daily payload).
        sunrise, sunset = get_daily_sunrise_sunset(lat, lon)
        # AQI fetch remains unchanged – external service may still fail.
        aqi_val = None
        try:
            aqi_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
            aqi_params = {"latitude": LAT, "longitude": LON, "current": "us_aqi"}
            aqi_res = requests.get(aqi_url, params=aqi_params, timeout=5)
            aqi_res.raise_for_status()
            aqi_val = aqi_res.json()["current"]["us_aqi"]
        except Exception as e:
            print(f"AQI fetch error: {e}")

        reading = WeatherReading(
            recorded_at = datetime.utcnow(),
            location    = f"{CITY} ({LAT},{LON})",
            temperature = data.get("temperature_2m"),
            feels_like  = data.get("apparent_temperature"),
            humidity    = data.get("relative_humidity_2m"),
            pressure    = data.get("surface_pressure"),
            wind_speed  = data.get("wind_speed_10m"),
            wind_dir    = data.get("wind_direction_10m"),
            uv_index    = data.get("uv_index"),
            precip_prob = data.get("precipitation_probability"),
            cloud_cover = data.get("cloud_cover"),
            aqi         = aqi_val
        )

        db = SessionLocal()
        db.add(reading)
        db.commit()
        check_alerts(reading)
        db.close()

        print(f"[{datetime.utcnow()}] Reading stored: {data.get('temperature_2m')}°C")
    except Exception as e:
        print(f"Fetch error: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(fetch_and_store, "interval", minutes=15)
    scheduler.start()
    fetch_and_store()
    return scheduler