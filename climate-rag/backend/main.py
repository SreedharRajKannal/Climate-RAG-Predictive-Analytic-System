import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db, SessionLocal, WeatherReading
from scheduler import start_scheduler
from alerts import get_latest_alert
from rag import generate_advisory
from datetime import datetime, timedelta
from typing import List
import asyncio

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

@app.get("/conditions")
def get_conditions():
    db      = SessionLocal()
    reading = db.query(WeatherReading)\
                .order_by(WeatherReading.recorded_at.desc())\
                .first()
    db.close()

    if not reading:
        return {"error": "No data yet"}

    return {
        "recorded_at": reading.recorded_at,
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
    }


@app.get("/history")
def get_history():
    db      = SessionLocal()
    since   = datetime.utcnow() - timedelta(hours=24)
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
def get_advisory():
    db      = SessionLocal()
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