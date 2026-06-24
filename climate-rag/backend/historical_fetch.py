"""
historical_fetch.py — One-time script to pull 3 months of hourly weather data
from Open-Meteo's Archive API and bulk-insert into the historical_readings table.

Usage:
    python historical_fetch.py
    python historical_fetch.py --lat 8.5241 --lon 76.9366 --start 2026-03-22 --end 2026-06-22
"""

import argparse
import requests
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(__file__))
from database import engine, SessionLocal, HistoricalReading, init_db


ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

HOURLY_PARAMS = [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "wind_speed_10m",
    "uv_index",
    "surface_pressure",
    "apparent_temperature",
    "cloud_cover",
]


def fetch_archive(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """Fetch hourly archive data from Open-Meteo."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ",".join(HOURLY_PARAMS),
        "timezone": "auto",
    }
    print(f"Fetching archive data: {start_date} -> {end_date} for ({lat}, {lon})...")
    resp = requests.get(ARCHIVE_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def insert_readings(data: dict, lat: float, lon: float, location_name: str):
    """Parse the Open-Meteo JSON and bulk-insert into historical_readings."""
    init_db()

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        print("ERROR: No hourly data returned from the API.")
        return

    temps = hourly.get("temperature_2m", [])
    humids = hourly.get("relative_humidity_2m", [])
    precips = hourly.get("precipitation", [])
    winds = hourly.get("wind_speed_10m", [])
    uvs = hourly.get("uv_index", [])
    pressures = hourly.get("surface_pressure", [])
    apparent = hourly.get("apparent_temperature", [])
    clouds = hourly.get("cloud_cover", [])

    db = SessionLocal()

    # Idempotency check — skip if data already exists for this location
    existing = db.query(HistoricalReading).filter(
        HistoricalReading.location == location_name
    ).count()

    if existing > 0:
        print(f"WARNING: {existing} rows already exist for '{location_name}'.")
        print("Skipping insert to prevent duplicates. Delete existing rows first if you want to re-import.")
        db.close()
        return

    readings = []
    for i, time_str in enumerate(times):
        recorded_at = datetime.fromisoformat(time_str)
        reading = HistoricalReading(
            recorded_at=recorded_at,
            location=location_name,
            temperature=temps[i] if i < len(temps) else None,
            humidity=humids[i] if i < len(humids) else None,
            precipitation=precips[i] if i < len(precips) else None,
            wind_speed=winds[i] if i < len(winds) else None,
            uv_index=uvs[i] if i < len(uvs) else None,
            pressure=pressures[i] if i < len(pressures) else None,
            apparent_temperature=apparent[i] if i < len(apparent) else None,
            cloud_cover=clouds[i] if i < len(clouds) else None,
        )
        readings.append(reading)

    # Bulk insert in batches of 500
    batch_size = 500
    total = len(readings)
    for start in range(0, total, batch_size):
        batch = readings[start : start + batch_size]
        db.add_all(batch)
        db.commit()
        print(f"  Inserted {min(start + batch_size, total)}/{total} rows...")

    db.close()
    print(f"SUCCESS: {total} historical readings inserted for '{location_name}'.")


def main():
    parser = argparse.ArgumentParser(description="Fetch historical weather data from Open-Meteo Archive API")
    parser.add_argument("--lat", type=float, default=8.5241, help="Latitude (default: Trivandrum)")
    parser.add_argument("--lon", type=float, default=76.9366, help="Longitude (default: Trivandrum)")
    parser.add_argument("--start", type=str, default="2026-03-22", help="Start date YYYY-MM-DD")
    parser.add_argument("--end", type=str, default="2026-06-22", help="End date YYYY-MM-DD")
    parser.add_argument("--name", type=str, default=None, help="Location name (default: auto-generated)")
    args = parser.parse_args()

    location_name = args.name or f"Archive ({args.lat},{args.lon})"

    data = fetch_archive(args.lat, args.lon, args.start, args.end)
    insert_readings(data, args.lat, args.lon, location_name)


if __name__ == "__main__":
    main()
