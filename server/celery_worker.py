"""
Entry point for the Celery worker: celery -A celery_worker.celery_app worker -l info

This file's ONLY job is to build the Flask app (which binds broker config
onto app.extensions.celery and registers task modules) and expose that
same celery instance under the name Celery's CLI expects. It must never be
imported BY a task module — that's what caused a circular import in an
earlier draft of this scaffold; see app/extensions.py for the fix.
"""
from app import create_app
from app.extensions import celery as celery_app

flask_app = create_app()

# Import task modules so Celery registers them against the shared instance
from app.tasks import reconciliation_tasks, statement_tasks, alert_tasks  # noqa: F401,E402
