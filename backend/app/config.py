from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Postgres connection (AWS RDS / Google Cloud SQL compatible — just swap the host)
    DATABASE_URL: str = "postgresql+psycopg2://hrms:hrms_pass@localhost:5432/hrms"
    JWT_SECRET: str = "change-me-in-prod"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8
    SEED_ON_START: bool = True

    # Password reset
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "http://localhost:5173"  # used to build the reset link

    # SMTP email (e.g. Gmail: smtp.gmail.com / 587 / your address / app password)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Cloud HRMS <no-reply@hrms.com>"

    class Config:
        env_file = ".env"


settings = Settings()
