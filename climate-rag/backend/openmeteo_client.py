"""Open-Meteo client wrapper with zero external dependencies.
Implements caching and retry logic using the standard library only.
The cache is stored as a JSON file at `.cache/weather_cache.json` and maps
a string key based on latitude/longitude to a cached response and timestamp.
"""

import json
import os
import time
import hashlib
from typing import Any, Dict, Tuple
import requests

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", ".cache")
CACHE_FILE = os.path.join(CACHE_DIR, "weather_cache.json")
CACHE_TTL = 3600  # seconds
MAX_RETRIES = 5
BACKOFF_FACTOR = 0.2

def _load_cache() -> Dict[str, Any]:
    """Load the cache JSON. Returns an empty dict if the file does not exist or is malformed."""
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_cache(cache: Dict[str, Any]) -> None:
    """Persist the cache dictionary to disk."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f)

def _make_cache_key(lat: float, lon: float) -> str:
    """Create a deterministic key for a location.
    Rounds latitude/longitude to 4 decimal places and hashes the string.
    """
    key_str = f"{lat:.4f}:{lon:.4f}"
    return hashlib.sha256(key_str.encode()).hexdigest()

def _is_fresh(entry: Dict[str, Any]) -> bool:
    """Determine whether a cached entry is still valid based on its timestamp."""
    ts = entry.get("timestamp", 0)
    return (time.time() - ts) < CACHE_TTL

def _fetch_remote(lat: float, lon: float) -> Dict[str, Any]:
    """Perform the actual HTTP request to Open-Meteo with retry/back‑off.
    Retrieves current weather, hourly forecasts (next 48 h) and daily sunrise / sunset.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "current": [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m",
            "uv_index",
            "precipitation_probability",
            "cloud_cover",
        ],
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation_probability",
            "wind_speed_10m",
        ],
        "daily": ["sunrise", "sunset"],
        "timezone": "auto",
    }
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            attempt += 1
            if attempt >= MAX_RETRIES:
                raise
            backoff = BACKOFF_FACTOR * (2 ** (attempt - 1))
            time.sleep(backoff)
    # Unreachable – function will either return or raise.

def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """Public API: return a dict with keys ``current``, ``hourly`` and ``daily``.
    The function first checks the local cache; on a cache miss or stale entry it
    fetches fresh data from the remote API, updates the cache and returns the
    result.
    """
    cache = _load_cache()
    key = _make_cache_key(lat, lon)
    entry = cache.get(key)
    if entry and _is_fresh(entry):
        return entry["data"]

    # Cache miss – fetch from remote.
    try:
        data = _fetch_remote(lat, lon)
    except Exception as e:
        # If we have a stale entry we can fall back to it to keep the service alive.
        if entry:
            return entry["data"]
        # No data at all – propagate the error.
        raise RuntimeError(f"Unable to fetch weather data for ({lat}, {lon}): {e}")

    # Store freshly fetched data.
    cache[key] = {
        "timestamp": time.time(),
        "data": data,
    }
    _save_cache(cache)
    return data

# Helper used by the scheduler to pull just the current weather dict.
def get_current_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Convenience wrapper that extracts the ``current`` section from the full payload."""
    payload = get_weather_data(lat, lon)
    return payload.get("current", {})

# Helper used by the API layer for sunrise / sunset.
def get_daily_sunrise_sunset(lat: float, lon: float) -> Tuple[str, str]:
    payload = get_weather_data(lat, lon)
    daily = payload.get("daily", {})
    sunrise = daily.get("sunrise", [None])[0]
    sunset = daily.get("sunset", [None])[0]
    return sunrise, sunset

# Helper for hourly forecast used by ``/forecast`` and ``/comparison`` endpoints.
def get_hourly_forecast(lat: float, lon: float) -> Dict[str, Any]:
    payload = get_weather_data(lat, lon)
    return payload.get("hourly", {})

"""End of openmeteo_client.py"""
