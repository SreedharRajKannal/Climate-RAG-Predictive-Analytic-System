from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DB_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class WeatherReading(Base):
    __tablename__ = "weather_readings"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    location    = Column(String(100))
    temperature = Column(Float)
    feels_like  = Column(Float)
    humidity    = Column(Float)
    pressure    = Column(Float)
    wind_speed  = Column(Float)
    wind_dir    = Column(Float)
    uv_index    = Column(Float)
    precip_prob = Column(Float)
    cloud_cover = Column(Float)
    aqi         = Column(Float, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)