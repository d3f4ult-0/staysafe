"""Application configuration settings."""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Bengal Safety Map API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5433/bengal_safety_map",
    )

    # Pilot Configuration (Default: Greater Kolkata Metro)
    PILOT_AREA_CODE: str = "kolkata_metro"
    PILOT_AREA_NAME: str = "Greater Kolkata Pilot (KMC, Bidhannagar, Howrah, New Town)"
    PILOT_CENTER_LAT: float = 22.5726
    PILOT_CENTER_LON: float = 88.3639
    PILOT_DEFAULT_ZOOM: int = 12
    PILOT_BBOX_MIN_LON: float = 88.2000
    PILOT_BBOX_MIN_LAT: float = 22.4000
    PILOT_BBOX_MAX_LON: float = 88.5500
    PILOT_BBOX_MAX_LAT: float = 22.7000

    # Temporal Policy (Asia/Kolkata IST)
    TIMEZONE: str = "Asia/Kolkata"
    NIGHT_START_HOUR: int = 20  # 8:00 PM
    NIGHT_END_HOUR: int = 5    # 5:00 AM

    # Privacy and Aggregation Safeguards
    MIN_AGGREGATE_COUNT: int = 5
    DEFAULT_SPATIAL_PRECISION: str = "hex_500m"

    # Dataset Release Tag
    ACTIVE_RELEASE_VERSION: str = "synthetic_demo_v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
