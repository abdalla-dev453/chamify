"""
Single source of truth for every Flask extension instance.
Imported by app/__init__.py (to bind to the app) and by every model/blueprint
that needs `db`, `jwt`, `ma`, etc. — never instantiate a second copy elsewhere.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from celery import Celery

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()
cors = CORS()
# NOTE: storage_uri is deliberately NOT set here. Passing it to the
# constructor freezes it at import time (before app.config exists) and
# permanently overrides whatever RATELIMIT_STORAGE_URI init_app() would
# otherwise pick up from the Flask app's config — which is what happened
# before this fix: every environment, including Render, was hardcoded to
# redis://localhost:6379/0. Since Render doesn't run a local Redis, every
# rate-limited route (all of /auth/*) raised a connection error and 500'd,
# instead of falling back to app.config["RATELIMIT_STORAGE_URI"] (set in
# config.py from REDIS_URL). Leaving storage_uri unset here lets init_app()
# resolve it correctly per-environment.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per hour"],
)
# Bare Celery instance — broker/backend/context are bound onto this SAME
# object inside create_app() (see app/__init__.py). Task modules import
# `celery` from here, never from celery_worker.py, which is what breaks
# the app-factory <-> tasks <-> worker-entrypoint circular import.
celery = Celery(__name__)
