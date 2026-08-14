"""
Application factory. Keeps app creation testable (create_app("testing"))
and avoids circular imports by registering blueprints/models here, last.
"""
import os
from flask import Flask

from app.config import config_by_name
from app.extensions import db, migrate, jwt, ma, cors, limiter, celery


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    _init_extensions(app)
    _init_celery(app)
    _register_blueprints(app)
    _register_error_handlers(app)

    return app


def _init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}},
        supports_credentials=True,
    )


def _init_celery(app):
    """
    Binds broker/backend config onto the SAME celery instance every task
    module imports from app.extensions, and makes every task run inside a
    Flask app context (so current_app / db.session work exactly like a
    request would). This is what makes celery_worker.py a pure entrypoint
    with zero risk of circular imports back into the blueprints.
    """
    celery.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask

    # Import models AFTER db.init_app so they register on the same metadata,
    # but BEFORE migrations run.
    from app.models import (  # noqa: F401
        tenant, user, wallet, savings, loan, guarantor,
        ledger, mpesa, dividend, welfare, vote, subscription, audit_log,
    )


def _register_blueprints(app):
    from app.blueprints.auth.routes import auth_bp
    from app.blueprints.tenants.routes import tenants_bp
    from app.blueprints.wallets.routes import wallets_bp
    from app.blueprints.savings.routes import savings_bp
    from app.blueprints.loans.routes import loans_bp
    from app.blueprints.ledger.routes import ledger_bp
    from app.blueprints.mpesa.routes import mpesa_bp
    from app.blueprints.governance.routes import governance_bp
    from app.blueprints.compliance.routes import compliance_bp
    from app.blueprints.comms.routes import comms_bp
    from app.blueprints.ussd.routes import ussd_bp
    from app.blueprints.billing.routes import billing_bp
    from app.blueprints.admin.routes import admin_bp

    api_prefix = "/api/v1"
    app.register_blueprint(auth_bp, url_prefix=f"{api_prefix}/auth")
    app.register_blueprint(tenants_bp, url_prefix=f"{api_prefix}/tenants")
    app.register_blueprint(wallets_bp, url_prefix=f"{api_prefix}/wallets")
    app.register_blueprint(savings_bp, url_prefix=f"{api_prefix}/savings")
    app.register_blueprint(loans_bp, url_prefix=f"{api_prefix}/loans")
    app.register_blueprint(ledger_bp, url_prefix=f"{api_prefix}/ledger")
    app.register_blueprint(mpesa_bp, url_prefix=f"{api_prefix}/mpesa")
    app.register_blueprint(governance_bp, url_prefix=f"{api_prefix}/governance")
    app.register_blueprint(compliance_bp, url_prefix=f"{api_prefix}/compliance")
    app.register_blueprint(comms_bp, url_prefix=f"{api_prefix}/comms")
    app.register_blueprint(ussd_bp, url_prefix=f"{api_prefix}/ussd")
    app.register_blueprint(billing_bp, url_prefix=f"{api_prefix}/billing")
    app.register_blueprint(admin_bp, url_prefix=f"{api_prefix}/admin")


def _register_error_handlers(app):
    from app.utils.responses import error_response

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Resource not found", 404)

    @app.errorhandler(500)
    def server_error(e):
        return error_response("Internal server error", 500)

    @app.errorhandler(400)
    def bad_request(e):
        return error_response(str(e), 400)