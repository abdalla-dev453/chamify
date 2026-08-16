"""Tests for the governance blueprint (welfare requests + AGM voting).

Phase 5 has only shipped GET /welfare-requests and GET /votes so far
(see TODOs in app/blueprints/governance/routes.py) — these tests cover
that surface: tenant-scoped listing, auth requirements, and ordering.
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from app.extensions import db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.welfare import WelfareRequest
from app.models.vote import AgmVoteTopic
from app.utils.validators import normalize_kenyan_phone


def _seed_tenant_and_user(app, tenant_slug="test-chama", phone_number="0712345678"):
    """Creates a tenant + one active member user, returns (tenant_id, user_id)."""
    with app.app_context():
        tenant = Tenant(name="TestChama", slug=tenant_slug, tier="tier_1_informal")
        db.session.add(tenant)
        db.session.flush()

        user = User(
            tenant_id=tenant.id,
            full_name="Jane Wanjiru",
            phone_number=normalize_kenyan_phone(phone_number),
            role="member",
            is_active=True,
        )
        user.set_password("supersecret1")
        db.session.add(user)
        db.session.commit()
        return tenant.id, user.id


def _login(client, phone_number="0712345678", password="supersecret1", tenant_slug="test-chama"):
    resp = client.post("/api/v1/auth/login", json={
        "phone_number": phone_number,
        "password": password,
        "tenant_slug": tenant_slug,
    })
    assert resp.status_code == 200, resp.get_json()
    return resp.get_json()["data"]["access_token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_list_welfare_requests_requires_auth(app, client):
    _seed_tenant_and_user(app)
    resp = client.get("/api/v1/governance/welfare-requests")
    assert resp.status_code == 401


def test_list_welfare_requests_empty(app, client):
    _seed_tenant_and_user(app)
    token = _login(client)

    resp = client.get("/api/v1/governance/welfare-requests", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"] == []


def test_list_welfare_requests_returns_tenant_scoped_data(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)

    with app.app_context():
        req = WelfareRequest(
            tenant_id=tenant_id,
            requester_user_id=user_id,
            category="hospitalization",
            amount_requested=Decimal("5000.00"),
            description="Hospital bill support",
            status="submitted",
        )
        db.session.add(req)
        db.session.commit()

    resp = client.get("/api/v1/governance/welfare-requests", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.get_json()["data"]
    assert len(body) == 1
    assert body[0]["category"] == "hospitalization"
    assert body[0]["amount_requested"] == "5000.00"
    assert body[0]["status"] == "submitted"


def test_list_welfare_requests_excludes_other_tenants(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)

    # A second, unrelated tenant with its own welfare request.
    with app.app_context():
        other_tenant = Tenant(name="OtherChama", slug="other-chama", tier="tier_1_informal")
        db.session.add(other_tenant)
        db.session.flush()

        other_user = User(
            tenant_id=other_tenant.id,
            full_name="Peter Otieno",
            phone_number="0722334455",
            role="member",
            is_active=True,
        )
        other_user.set_password("supersecret1")
        db.session.add(other_user)
        db.session.flush()

        other_req = WelfareRequest(
            tenant_id=other_tenant.id,
            requester_user_id=other_user.id,
            category="bereavement",
            amount_requested=Decimal("2000.00"),
            status="submitted",
        )
        db.session.add(other_req)
        db.session.commit()

    resp = client.get("/api/v1/governance/welfare-requests", headers=_auth_headers(token))

    assert resp.status_code == 200
    # Only the logged-in user's own tenant has zero requests — the other
    # tenant's request must never leak across the tenant boundary.
    assert resp.get_json()["data"] == []


def test_list_open_votes_requires_auth(app, client):
    _seed_tenant_and_user(app)
    resp = client.get("/api/v1/governance/votes")
    assert resp.status_code == 401


def test_list_open_votes_returns_only_open_topics(app, client):
    tenant_id, _ = _seed_tenant_and_user(app)
    token = _login(client)

    now = datetime.now(timezone.utc)
    with app.app_context():
        open_topic = AgmVoteTopic(
            tenant_id=tenant_id,
            title="Approve 2026 budget",
            opens_at=now - timedelta(days=1),
            closes_at=now + timedelta(days=6),
            status="open",
        )
        closed_topic = AgmVoteTopic(
            tenant_id=tenant_id,
            title="Elect new treasurer",
            opens_at=now - timedelta(days=30),
            closes_at=now - timedelta(days=23),
            status="closed",
        )
        db.session.add_all([open_topic, closed_topic])
        db.session.commit()

    resp = client.get("/api/v1/governance/votes", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.get_json()["data"]
    assert len(body) == 1
    assert body[0]["title"] == "Approve 2026 budget"
