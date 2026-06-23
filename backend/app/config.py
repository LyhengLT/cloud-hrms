from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Postgres connection (AWS RDS / Google Cloud SQL compatible — just swap the host)
    DATABASE_URL: str = "postgresql+psycopg2://hrms:hrms_pass@localhost:5432/hrms"
    JWT_SECRET: str = "change-me-in-prod"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8
    SEED_ON_START: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
