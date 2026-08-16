"""
Per-environment configuration classes.
Never hardcode secrets here — everything sensitive is pulled from the environment.
"""
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://chamaledger:chamaledger@localhost:5432/chamaledger_dev"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}

    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", REDIS_URL)

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    # Kenyan integrations
    DARAJA_CONSUMER_KEY = os.environ.get("DARAJA_CONSUMER_KEY")
    DARAJA_CONSUMER_SECRET = os.environ.get("DARAJA_CONSUMER_SECRET")
    DARAJA_SHORTCODE = os.environ.get("DARAJA_SHORTCODE")
    DARAJA_PASSKEY = os.environ.get("DARAJA_PASSKEY")
    DARAJA_ENV = os.environ.get("DARAJA_ENV", "sandbox")
    DARAJA_CALLBACK_BASE_URL = os.environ.get("DARAJA_CALLBACK_BASE_URL")

    IPRS_API_URL = os.environ.get("IPRS_API_URL")
    IPRS_API_KEY = os.environ.get("IPRS_API_KEY")

    AT_USERNAME = os.environ.get("AT_USERNAME", "sandbox")
    AT_API_KEY = os.environ.get("AT_API_KEY")

    # Business rules — centralised so they're never magic numbers in a blueprint
    LOAN_SAVINGS_MULTIPLIER = 3
    LATE_PAYMENT_PENALTY_RATE = 0.05
    DEFAULT_LOAN_INTEREST_RATE = 0.12  # reducing balance, annualised


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class TestingConfig(BaseConfig):
    TESTING = True
    JWT_SECRET_KEY = "test-jwt-secret-not-for-production-use-only-in-ci"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(BaseConfig):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}