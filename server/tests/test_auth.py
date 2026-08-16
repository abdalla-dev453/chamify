"""Example test — mirrors the pattern every blueprint's tests should follow."""
from app.models.tenant import Tenant
from app.extensions import db


def _seed_tenant(app):
    with app.app_context():
        tenant = Tenant(name="Test Chama", slug="test-chama", tier="tier_1_informal")
        db.session.add(tenant)
        db.session.commit()


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