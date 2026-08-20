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
limiter = Limiter(
    key_func=get_remote_address, 
    default_limits=["200 per hour"],
    storage_uri="redis://localhost:6379/0"
)
# Bare Celery instance — broker/backend/context are bound onto this SAME
# object inside create_app() (see app/__init__.py). Task modules import
# `celery` from here, never from celery_worker.py, which is what breaks
# the app-factory <-> tasks <-> worker-entrypoint circular import.
celery = Celery(__name__)
