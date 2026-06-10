from dataclasses import dataclass
from typing import Optional

THRESHOLDS = {
    "temperature": 40.0,
    "feels_like":  42.0,
    "humidity":    90.0,
    "wind_speed":  60.0,
    "uv_index":     8.0,
    "precip_prob": 80.0,
    "aqi":        150.0,
}

@dataclass
class Alert:
    severity: str
    parameter: str
    value: float
    message: str

latest_alert: Optional[Alert] = None

def check_alerts(reading) -> Optional[Alert]:
    global latest_alert

    if reading.temperature and reading.temperature >= THRESHOLDS["temperature"]:
        latest_alert = Alert(
            severity  = "Critical",
            parameter = "temperature",
            value     = reading.temperature,
            message   = f"Extreme heat warning. Temperature at {reading.temperature}°C. Avoid outdoor exposure."
        )
        return latest_alert

    if reading.feels_like and reading.feels_like >= THRESHOLDS["feels_like"]:
        latest_alert = Alert(
            severity  = "Critical",
            parameter = "feels_like",
            value     = reading.feels_like,
            message   = f"Heat index at {reading.feels_like}°C. High risk of heat exhaustion. Stay indoors."
        )
        return latest_alert

    if reading.uv_index and reading.uv_index >= THRESHOLDS["uv_index"]:
        latest_alert = Alert(
            severity  = "Warning",
            parameter = "uv_index",
            value     = reading.uv_index,
            message   = f"UV index at {reading.uv_index}. Limit sun exposure. Use SPF 50+."
        )
        return latest_alert

    if reading.precip_prob and reading.precip_prob >= THRESHOLDS["precip_prob"]:
        latest_alert = Alert(
            severity  = "Warning",
            parameter = "precip_prob",
            value     = reading.precip_prob,
            message   = f"Rain probability at {reading.precip_prob}%. Carry an umbrella."
        )
        return latest_alert

    if reading.wind_speed and reading.wind_speed >= THRESHOLDS["wind_speed"]:
        latest_alert = Alert(
            severity  = "Warning",
            parameter = "wind_speed",
            value     = reading.wind_speed,
            message   = f"High winds at {reading.wind_speed} km/h. Avoid open areas."
        )
        return latest_alert

    if reading.humidity and reading.humidity >= THRESHOLDS["humidity"]:
        latest_alert = Alert(
            severity  = "Caution",
            parameter = "humidity",
            value     = reading.humidity,
            message   = f"Humidity at {reading.humidity}%. Heat feels more intense. Stay hydrated."
        )
        return latest_alert

    if reading.aqi and reading.aqi >= THRESHOLDS["aqi"]:
        latest_alert = Alert(
            severity  = "Warning",
            parameter = "aqi",
            value     = reading.aqi,
            message   = f"AQI at {reading.aqi}. Unhealthy air quality. Limit outdoor activity."
        )
        return latest_alert

    latest_alert = None
    return None

def get_latest_alert() -> Optional[Alert]:
    return latest_alert