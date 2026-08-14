"""
Shared model mixins.

TenantScopedMixin is the load-bearing piece of the whole multi-tenant design
from Section 2.2 of the blueprint: every tenant-owned row carries tenant_id,
and app/middleware/tenant_scope.py injects a query filter from the JWT
claims on every request, so Tenant A's data can never leak into a request
authenticated as Tenant B.
"""
import uuid
from datetime import datetime
from app.extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class BaseModel(db.Model, TimestampMixin):
    __abstract__ = True
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)

    def save(self):
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        db.session.delete(self)
        db.session.commit()


class TenantScopedModel(BaseModel):
    """Abstract base for every table that must never cross tenant lines."""
    __abstract__ = True

    @classmethod
    def tenant_id_column(cls):
        return cls.tenant_id