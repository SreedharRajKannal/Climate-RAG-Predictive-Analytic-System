from database import SessionLocal, HistoricalReading
import math

def estimate_uv(hour: int, cloud_cover: float) -> float:
    # Trivandrum is near equator, so UV is high during the day.
    if hour < 6 or hour > 18:
        base_uv = 0.0
    else:
        # Simple parabolic curve peaking at hour 12 with UV=11
        base_uv = 11.0 * (1.0 - ((hour - 12.0) ** 2) / 36.0)
        base_uv = max(0.0, base_uv)
    
    # Cloud cover reduction (clouds can reduce UV by up to 60%)
    if cloud_cover is not None:
        factor = 1.0 - (cloud_cover / 100.0) * 0.6
        base_uv *= factor
        
    return round(base_uv, 2)

if __name__ == "__main__":
    db = SessionLocal()
    readings = db.query(HistoricalReading).filter(HistoricalReading.uv_index.is_(None)).all()
    count = 0
    for r in readings:
        if r.recorded_at:
            hour = r.recorded_at.hour
            r.uv_index = estimate_uv(hour, r.cloud_cover)
            count += 1

    db.commit()
    db.close()
    print(f"Updated {count} rows with estimated UV index.")
