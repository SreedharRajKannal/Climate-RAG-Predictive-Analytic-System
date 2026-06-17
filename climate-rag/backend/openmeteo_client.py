"""Open-Meteo client wrapper with zero external dependencies.
Implements caching and retry logic using the standard library only.
The cache is stored as a JSON file at `.cache/weather_cache.json` and maps
a string key based on latitude/longitude to a cached response and timestamp.
"""

import json
import os
import time
import hashlib
from typing import Any, Dict, Tuple, List
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

def _make_cache_key(lat: float, lon: float, prefix: str = "") -> str:
    """Create a deterministic key for a location.
    Rounds latitude/longitude to 4 decimal places and hashes the string.
    """
    key_str = f"{prefix}:{lat:.4f}:{lon:.4f}"
    return hashlib.sha256(key_str.encode()).hexdigest()

def _is_fresh(entry: Dict[str, Any]) -> bool:
    """Determine whether a cached entry is still valid based on its timestamp."""
    ts = entry.get("timestamp", 0)
    return (time.time() - ts) < CACHE_TTL

def _fetch_remote(lat: float, lon: float) -> Dict[str, Any]:
    """Perform the actual HTTP request to Open-Meteo with retry/back‑off.
    Retrieves current weather, hourly forecasts and daily data for 7 days.
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
            "visibility",
            "dew_point_2m",
            "weather_code",
            "is_day",
        ],

        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation_probability",
            "wind_speed_10m",
            "wind_direction_10m",
            "uv_index",
            "weather_code",
            "apparent_temperature",
            "is_day",
            "surface_pressure"
        ],
        "daily": [
            "sunrise",
            "sunset",
            "temperature_2m_max",
            "temperature_2m_min",
            "weather_code",
            "precipitation_probability_max",
        ],
        "timezone": "auto",
        "past_hours": 48,
        "forecast_days": 7,
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
    key = _make_cache_key(lat, lon, "weather")
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

# Helper used by the API layer for sunrise / sunset and timezone metadata.
def get_location_metadata(lat: float, lon: float) -> Tuple[str, str, str, str, int]:
    payload = get_weather_data(lat, lon)
    daily = payload.get("daily", {})
    sunrises = daily.get("sunrise", [])
    sunsets = daily.get("sunset", [])
    
    # Need to account for past_days=1 shifting the array index! 
    # daily[0] is yesterday, daily[1] is today, daily[2] is tomorrow
    sunrise_today = sunrises[1] if len(sunrises) > 1 else None
    sunset_today = sunsets[1] if len(sunsets) > 1 else None
    sunrise_tomorrow = sunrises[2] if len(sunrises) > 2 else None
    
    tz_abbr = payload.get("timezone_abbreviation", "UTC")
    utc_offset = payload.get("utc_offset_seconds", 0)
    
    return sunrise_today, sunset_today, sunrise_tomorrow, tz_abbr, utc_offset

# Helper for hourly forecast used by ``/forecast`` and ``/comparison`` endpoints.
def get_hourly_forecast(lat: float, lon: float) -> Dict[str, Any]:
    payload = get_weather_data(lat, lon)
    return payload.get("hourly", {})

# Search city via Open-Meteo Geocoding API
def search_city(query: str) -> List[Dict[str, Any]]:
    """Proxy for Open-Meteo geocoding to avoid frontend CORS and rate limits."""
    if not query or len(query) < 2:
        return []
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": query, "count": 5, "format": "json"}
    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"Geocoding error: {e}")
        return []


# Daily forecast for the 7-day view.
def get_daily_forecast(lat: float, lon: float) -> List[Dict[str, Any]]:
    """Return 7-day daily forecast data."""
    payload = get_weather_data(lat, lon)
    daily = payload.get("daily", {})
    
    dates = daily.get("time", [])
    highs = daily.get("temperature_2m_max", [])
    lows = daily.get("temperature_2m_min", [])
    codes = daily.get("weather_code", [])
    precips = daily.get("precipitation_probability_max", [])
    
    result = []
    for i in range(len(dates)):
        # Skip the first entry (yesterday, due to past_days=1)
        if i == 0:
            continue
        result.append({
            "date": dates[i],
            "temp_max": highs[i] if i < len(highs) else None,
            "temp_min": lows[i] if i < len(lows) else None,
            "weather_code": codes[i] if i < len(codes) else 0,
            "precip_prob_max": precips[i] if i < len(precips) else 0,
        })
    
    return result

# Air quality endpoint.
def get_air_quality(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch air quality data from the Open-Meteo Air Quality API."""
    cache = _load_cache()
    key = _make_cache_key(lat, lon, "aqi")
    entry = cache.get(key)
    if entry and _is_fresh(entry):
        return entry["data"]
    
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "current": [
            "us_aqi",
            "pm2_5",
            "pm10",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "ozone",
        ],
        "hourly": ["us_aqi"],
        "timezone": "auto",
        "past_hours": 48,
        "forecast_days": 7,
    }
    
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            current = data.get("current", {})
            
            result = {
                "us_aqi": current.get("us_aqi"),
                "pm2_5": current.get("pm2_5"),
                "pm10": current.get("pm10"),
                "co": current.get("carbon_monoxide"),
                "no2": current.get("nitrogen_dioxide"),
                "o3": current.get("ozone"),
                "hourly_aqi": data.get("hourly", {}).get("us_aqi", [])
            }
            
            cache[key] = {"timestamp": time.time(), "data": result}
            _save_cache(cache)
            return result
        except Exception as e:
            attempt += 1
            if attempt >= MAX_RETRIES:
                if entry:
                    return entry["data"]
                return {"european_aqi": None, "pm2_5": None, "pm10": None, "co": None, "no2": None, "o3": None}
            backoff = BACKOFF_FACTOR * (2 ** (attempt - 1))
            time.sleep(backoff)
