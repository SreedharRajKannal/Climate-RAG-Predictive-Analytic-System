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
from openmeteo_client import get_location_metadata, get_hourly_forecast, get_air_quality, get_daily_forecast, search_city

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
from openmeteo_client import get_location_metadata, get_hourly_forecast, get_air_quality, get_daily_forecast, search_city

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

    # Dynamically fetch sunrise/sunset and timezone
    sunrise = None
    sunset = None
    sunrise_tomorrow = None
    tz_abbr = "UTC"
    utc_offset = 0
    daily_high = None
    daily_low = None
    visibility = None
    dew_point = None
    weather_code = 0
    
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
            sunrise, sunset, sunrise_tomorrow, tz_abbr, utc_offset = get_location_metadata(float(active_lat), float(active_lon))
            
            # Get additional data from the raw payload
            from openmeteo_client import get_weather_data
            payload = get_weather_data(float(active_lat), float(active_lon))
            current = payload.get("current", {})
            daily = payload.get("daily", {})
            
            visibility = current.get("visibility")
            dew_point = current.get("dew_point_2m")
            weather_code = current.get("weather_code", 0)
            
            # daily[1] = today (past_days=1 shifts index)
            highs = daily.get("temperature_2m_max", [])
            lows = daily.get("temperature_2m_min", [])
            daily_high = highs[1] if len(highs) > 1 else None
            daily_low = lows[1] if len(lows) > 1 else None
    except Exception as e:
        print(f"Error fetching metadata: {e}")

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
        "sunset":      sunset,
        "sunrise_tomorrow": sunrise_tomorrow,
        "timezone_abbreviation": tz_abbr,
        "utc_offset_seconds": utc_offset,
        "daily_high":  daily_high,
        "daily_low":   daily_low,
        "visibility":  visibility,
        "dew_point":   dew_point,
        "weather_code": weather_code,
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
        wcodes = hourly.get("weather_code", [])
        is_days = hourly.get("is_day", [])
        pressures = hourly.get("surface_pressure", [])
        
        from openmeteo_client import get_air_quality
        air_quality_data = get_air_quality(latitude, longitude)
        hourly_aqi = air_quality_data.get("hourly_aqi", [])

        forecast_data = []
        for i in range(len(times)):
            forecast_data.append({
                "time": times[i],
                "temperature": temps[i] if i < len(temps) else None,
                "humidity": humidities[i] if i < len(humidities) else None,
                "precip_prob": precips[i] if i < len(precips) else None,
                "wind_speed": winds[i] if i < len(winds) else None,
                "weather_code": wcodes[i] if i < len(wcodes) else 0,
                "is_day": is_days[i] if i < len(is_days) else 1,
                "surface_pressure": pressures[i] if i < len(pressures) else None,
                "aqi": hourly_aqi[i] if i < len(hourly_aqi) else None,
            })
                
        return forecast_data
    except Exception as e:
        return {"error": f"Failed to fetch forecast: {e}"}


@app.get("/air-quality")
def get_air_quality_endpoint(lat: float = None, lon: float = None):
    import scheduler
    latitude = lat if lat is not None else float(scheduler.LAT)
    longitude = lon if lon is not None else float(scheduler.LON)
    try:
        return get_air_quality(latitude, longitude)
    except Exception as e:
        return {"error": f"Failed to fetch air quality: {e}"}


@app.get("/daily-forecast")
def get_daily_forecast_endpoint(lat: float = None, lon: float = None):
    import scheduler
    latitude = lat if lat is not None else float(scheduler.LAT)
    longitude = lon if lon is not None else float(scheduler.LON)
    try:
        return get_daily_forecast(latitude, longitude)
    except Exception as e:
        return {"error": f"Failed to fetch daily forecast: {e}"}

@app.get("/search-city")
def search_city_endpoint(q: str):
    try:
        return search_city(q)
    except Exception as e:
        return {"error": f"Failed to search city: {e}"}


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
            "source":   "alert_engine",
            "retrieved_chunks": []
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


# ── CLUSTERING ENDPOINTS ──────────────────────────────────

from clustering import get_cluster_results, get_elbow_results, get_scatter_data, load_saved_models, get_cluster_labels, CLUSTER_FEATURES
import numpy as np

# Load saved models at startup (None if not yet fitted)
_kmeans_model, _kmeans_scaler = load_saved_models()

@app.get("/clusters")
def get_clusters(k: int = None):
    """Return K-means cluster assignments, centers, and labels."""
    global _kmeans_model, _kmeans_scaler
    result = get_cluster_results()
    # Refresh cached models after fitting
    _kmeans_model, _kmeans_scaler = load_saved_models()
    return result

@app.get("/clusters/elbow")
def get_clusters_elbow():
    """Return inertia values for K=1..10 to render the elbow chart."""
    return get_elbow_results()

@app.get("/clusters/scatter")
def get_clusters_scatter(sample: int = None):
    """
    Return scatter-plot-ready data with cluster assignments.
    Use ?sample=500 to randomly sample rows for faster rendering.
    """
    return get_scatter_data(sample=sample)

@app.get("/clusters/current")
def get_current_cluster():
    """
    Predict which cluster the current weather belongs to.
    Uses the saved KMeans model + scaler. Calls Ollama for a one-line description.
    """
    global _kmeans_model, _kmeans_scaler

    # Try loading models if not cached
    if _kmeans_model is None or _kmeans_scaler is None:
        _kmeans_model, _kmeans_scaler = load_saved_models()

    if _kmeans_model is None or _kmeans_scaler is None:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"error": "Run historical_fetch.py first"}
        )

    # Get latest weather reading
    db = SessionLocal()
    reading = db.query(WeatherReading).order_by(WeatherReading.recorded_at.desc()).first()
    db.close()

    if not reading:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"error": "No weather data available"})

    # Extract features in the exact order the scaler/model expect
    temp = reading.temperature or 0
    humidity = reading.humidity or 0
    precip = reading.precip_prob or 0  # weather_readings uses precip_prob, not precipitation
    wind = reading.wind_speed or 0
    uv = reading.uv_index or 0
    apparent = reading.feels_like or temp

    features = np.array([[temp, humidity, precip, wind, uv, apparent]])
    scaled = _kmeans_scaler.transform(features)
    cluster_id = int(_kmeans_model.predict(scaled)[0])

    # Get cluster label
    labels = get_cluster_labels()
    cluster_label = labels.get(cluster_id, f"Cluster {cluster_id}")

    # Call Ollama for a one-line description
    description = ""
    try:
        from langchain_community.llms import Ollama
        import os
        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        llm = Ollama(model=ollama_model, base_url=ollama_host, temperature=0.1)

        prompt = (
            f"Current weather in Trivandrum belongs to the '{cluster_label}' weather pattern.\n"
            f"Conditions: Temperature {temp}\u00b0C, Humidity {humidity}%, "
            f"Rain probability {precip}%, Wind {wind} km/h.\n\n"
            f"Write exactly one sentence telling the user what weather pattern they are "
            f"currently in and what it means for their day. "
            f"Under 20 words. Direct. No fluff."
        )
        description = llm.invoke(prompt).strip()
    except Exception as e:
        print(f"[clusters/current] Ollama call failed: {e}")
        description = f"Currently in {cluster_label} pattern."

    return {
        "cluster_id": cluster_id,
        "cluster_label": cluster_label,
        "description": description,
        "conditions": {
            "temperature": temp,
            "humidity": humidity,
            "wind_speed": wind,
            "uv_index": uv,
            "apparent_temperature": apparent,
            "precip_prob": precip,
        }
    }

# In-memory cache for cluster descriptions (only regenerated on model retrain)
_cluster_descriptions_cache = None

@app.get("/clusters/descriptions")
async def get_cluster_descriptions():
    """
    Generate technical descriptions for all 4 clusters using Ollama.
    Calls are run in parallel via asyncio.gather. Results are cached in memory.
    """
    global _cluster_descriptions_cache

    if _cluster_descriptions_cache is not None:
        return _cluster_descriptions_cache

    # Get cluster data
    results = get_cluster_results()
    if "error" in results:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content={"error": results["error"]})

    clusters = results.get("clusters", [])
    if not clusters:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content={"error": "No clusters available"})

    # Build Ollama LLM
    from langchain_community.llms import Ollama
    import os
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
    llm = Ollama(model=ollama_model, base_url=ollama_host, temperature=0.3)

    async def describe_cluster(cluster):
        label = cluster["label"]
        center = cluster["center"]
        prompt = (
            f"Weather cluster '{label}' has these centroid values from K-means:\n"
            f"Temperature: {center['temperature']}\u00b0C, Humidity: {center['humidity']}%, "
            f"Precipitation: {center['precipitation']}mm, Wind: {center['wind_speed']} km/h, "
            f"UV Index: {center['uv_index']}, Apparent Temperature: {center['apparent_temperature']}\u00b0C.\n\n"
            f"In 1-2 sentences, explain technically what defines this cluster \u2014 "
            f"which parameter values separate it from the other clusters and "
            f"why those values justify the label '{label}'. "
            f"Reference specific feature values. Be precise and technical.\n"
            f"Maximum 2 sentences."
        )
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            description = await loop.run_in_executor(None, llm.invoke, prompt)
            return description.strip()
        except Exception as e:
            print(f"[clusters/descriptions] Ollama failed for '{label}': {e}")
            return f"Cluster '{label}' centroid: temp={center['temperature']}\u00b0C, humidity={center['humidity']}%."

    # Run all 4 Ollama calls in parallel
    import asyncio
    descriptions = await asyncio.gather(*[describe_cluster(c) for c in clusters])

    result = {
        "descriptions": [
            {
                "cluster_id": c["id"],
                "cluster_label": c["label"],
                "color": CLUSTER_COLORS[i % len(CLUSTER_COLORS)],
                "description": descriptions[i],
            }
            for i, c in enumerate(clusters)
        ]
    }

    # Cache the result
    _cluster_descriptions_cache = result
    return result

# Cluster colors matching frontend
CLUSTER_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]


@app.get("/clusters/pca")
def get_clusters_pca(sample: int = None):
    """
    Run PCA with 3 components on the clustered historical data.
    Returns PC1, PC2, PC3 per data point plus explained variance ratios.
    """
    from clustering import get_pca_data
    return get_pca_data(sample=sample)


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