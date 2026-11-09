from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # Database
    DATABASE_URL: str = "postgresql+psycopg://facetrace:facetrace_password@localhost:5432/facetrace"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Face recognition
    FACE_RECOGNITION_THRESHOLD: float = 0.45
    FACE_DETECTION_MIN_SIZE: int = 60
    FACE_QUALITY_THRESHOLD: float = 100.0
    COOLDOWN_SECONDS: int = 60

    # Retention
    SNAPSHOT_RETENTION_DAYS: int = 30
    UNKNOWN_FACE_RETENTION_DAYS: int = 7

    # Working hours for attendance
    WORKING_HOUR_START: str = "09:00"
    WORKING_HOUR_END: str = "17:00"

    # Storage
    STORAGE_PATH: str = "./storage"
    SNAPSHOT_PATH: str = "./storage/snapshots"
    ENROLLMENT_PATH: str = "./storage/enrollments"

    # Alerts
    LOW_ATTENDANCE_THRESHOLD: float = 0.75
    UNUSUAL_TIME_Z_SCORE: float = 2.0

    # Email (SMTP)
    MAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USE_TLS: bool = True
    EMAIL_HOST_USER: str = ""
    EMAIL_HOST_PASSWORD: str = ""
    DEFAULT_FROM_EMAIL: str = ""
    ALERT_EMAIL_RECIPIENTS: str = ""  # comma-separated

    @property
    def alert_email_list(self) -> list[str]:
        return [e.strip() for e in self.ALERT_EMAIL_RECIPIENTS.split(",") if e.strip()]


settings = Settings()
