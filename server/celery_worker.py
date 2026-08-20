"""
Entry point for the Celery worker: celery -A celery_worker.celery_app worker -l info
"""
from app import create_app
from app.extensions import celery as celery_app

flask_app = create_app()

# Import task modules directly to bypass __init__.py circular loops
import app.tasks.reconciliation_tasks  # noqa: F401
import app.tasks.statement_tasks       # noqa: F401
import app.tasks.alert_tasks           # noqa: F401
