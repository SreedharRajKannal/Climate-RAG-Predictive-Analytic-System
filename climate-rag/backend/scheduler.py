import requests
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal, WeatherReading
from alerts import check_alerts

LAT = os.getenv("LOCATION_LAT", "9.9312")
LON = os.getenv("LOCATION_LON", "76.2673")

def fetch_and_store():
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": LAT,
            "longitude": LON,
            "current": [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "uv_index",
                "precipitation_probability",
                "cloud_cover"
            ],
            "timezone": "auto"
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()["current"]

        reading = WeatherReading(
            recorded_at = datetime.utcnow(),
            location    = f"{LAT},{LON}",
            temperature = data.get("temperature_2m"),
            feels_like  = data.get("apparent_temperature"),
            humidity    = data.get("relative_humidity_2m"),
            pressure    = data.get("surface_pressure"),
            wind_speed  = data.get("wind_speed_10m"),
            wind_dir    = data.get("wind_direction_10m"),
            uv_index    = data.get("uv_index"),
            precip_prob = data.get("precipitation_probability"),
            cloud_cover = data.get("cloud_cover")
        )

        db = SessionLocal()
        db.add(reading)
        db.commit()
        db.close()

        check_alerts(reading)
        print(f"[{datetime.utcnow()}] Reading stored: {data.get('temperature_2m')}°C")

    except Exception as e:
        print(f"Fetch error: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(fetch_and_store, "interval", minutes=15)
    scheduler.start()
    fetch_and_store()
    return scheduler