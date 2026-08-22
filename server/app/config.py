"""
Per-environment configuration classes.
Never hardcode secrets here — everything sensitive is pulled from the environment.
"""
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


def _normalize_db_url(raw_url: str) -> str:
    """
    Render (and Heroku-style providers) hand out DATABASE_URL as a bare
    ``postgres://`` or ``postgresql://`` string. SQLAlchemy 2.x resolves a
    driverless ``postgresql://`` to the psycopg2 dialect by default — but
    this project only installs psycopg (v3) in requirements.txt. Left as-is,
    the very first query raises ``ModuleNotFoundError: No module named
    'psycopg2'`` in production, even though everything works locally if a
    dev happens to have psycopg2 installed globally.

    Rewriting the scheme to ``postgresql+psycopg://`` pins SQLAlchemy to the
    driver that's actually installed, regardless of what scheme the
    hosting provider hands back.
    """
    if raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://"):]
    if raw_url.startswith("postgresql://"):
        raw_url = "postgresql+psycopg://" + raw_url[len("postgresql://"):]
    return raw_url



class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]

    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.environ.get(
        "DATABASE_URL", "postgresql://chamaledger:chamaledger@localhost:5432/chamaledger_dev"
    )
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}

    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", REDIS_URL)

    # Flask-Limiter's storage backend.Previously hardcoded to redis://localohost:6379/0 inside extensions.py . which meant the rate limits tried to reach a redis instance that doesn't exist on render and raised on every rate-limited request.
    RATELIMIT_STORAGE_URI = REDIS_URL

    # Accept one origin or a common-separated list (e.g. Render preview URL plus the production frontend URL) so CORS doesn't read a redeploy every time a preview domain is added
    _frontend_origin_raw = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
    FRONTEND_ORIGIN = (
        [o.strip() for o in _frontend_origin_raw.split(",") 
         if o.strip()]
        if "," in _frontend_origin_raw
        else _frontend_origin_raw
    )


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
    RATELIMIT_ENABLED = False


class ProductionConfig(BaseConfig):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}