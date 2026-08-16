"""Example test — mirrors the pattern every blueprint's tests should follow."""
from app.models.tenant import Tenant
from app.extensions import db


def _seed_tenant(app):
    with app.app_context():
        tenant = Tenant(name="TestChama", slug="test-chama", tier="tier_1_informal")
        db.session.add(tenant)
        db.session.commit()


def _register(client, **overrides):
    payload = {
        "full_name": "Jane Wanjiru", "phone_number": "0712345678",
        "password": "supersecret1", "tenant_slug": "test-chama",
    }
    payload.update(overrides)
    return client.post("/api/v1/auth/register", json=payload)


def test_register_and_login(app, client):
    _seed_tenant(app)
    payload = {
        "full_name": "Jane Wanjiru", "phone_number": "0712345678",
        "password": "supersecret1", "tenant_slug": "test-chama",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    assert resp.get_json()["data"]["access_token"]

    login_resp = client.post("/api/v1/auth/login", json={
        "phone_number": "0712345678", "password": "supersecret1", "tenant_slug": "test-chama",
    })
    assert login_resp.status_code == 200


def test_login_success_returns_tokens_and_user(app, client):
    _seed_tenant(app)
    _register(client)

    resp = client.post("/api/v1/auth/login", json={
        "phone_number": "0712345678",
        "password": "supersecret1",
        "tenant_slug": "test-chama",
    })

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]
    assert body["data"]["user"]["full_name"] == "Jane Wanjiru"
    assert body["data"]["user"]["role"] == "member"


def test_login_wrong_password_fails(app, client):
    _seed_tenant(app)
    _register(client)

    resp = client.post("/api/v1/auth/login", json={
        "phone_number": "0712345678",
        "password": "wrong-password",
        "tenant_slug": "test-chama",
    })

    assert resp.status_code == 401
    assert resp.get_json()["success"] is False


def test_login_unknown_phone_number_fails(app, client):
    _seed_tenant(app)
    _register(client)

    resp = client.post("/api/v1/auth/login", json={
        "phone_number": "0799999999",
        "password": "supersecret1",
        "tenant_slug": "test-chama",
    })

    assert resp.status_code == 401


def test_login_unknown_tenant_fails(app, client):
    _seed_tenant(app)
    _register(client)

    resp = client.post("/api/v1/auth/login", json={
        "phone_number": "0712345678",
        "password": "supersecret1",
        "tenant_slug": "does-not-exist",
    })

    assert resp.status_code == 404


def test_register_duplicate_phone_number_fails(app, client):
    _seed_tenant(app)
    _register(client)

    resp = _register(client, full_name="Another Person")

    assert resp.status_code == 409


def test_register_unknown_tenant_fails(app, client):
    _seed_tenant(app)

    resp = _register(client, tenant_slug="not-a-real-tenant")

    assert resp.status_code == 404


def test_register_invalid_phone_number_fails(app, client):
    _seed_tenant(app)

    resp = _register(client, phone_number="12345")

    assert resp.status_code == 422
    assert "phone_number" in resp.get_json()["errors"]
