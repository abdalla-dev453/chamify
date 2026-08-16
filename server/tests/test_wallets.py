"""Tests for the wallets blueprint: listing, retrieval, and treasurer-gated
sub-wallet creation.
"""
from decimal import Decimal

from app.extensions import db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.wallet import Wallet
from app.utils.validators import normalize_kenyan_phone


def _seed_tenant_and_user(app, role="member", tenant_slug="test-chama", phone_number="0712345678"):
    with app.app_context():
        tenant = Tenant(name="TestChama", slug=tenant_slug, tier="tier_1_informal")
        db.session.add(tenant)
        db.session.flush()

        user = User(
            tenant_id=tenant.id,
            full_name="Jane Wanjiru",
            phone_number=normalize_kenyan_phone(phone_number),
            role=role,
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


def test_list_wallets_requires_auth(app, client):
    _seed_tenant_and_user(app)
    resp = client.get("/api/v1/wallets")
    assert resp.status_code == 401


def test_list_wallets_returns_tenant_scoped_wallets(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)

    with app.app_context():
        w1 = Wallet(tenant_id=tenant_id, owner_user_id=user_id, wallet_type="member", name="Jane's Wallet")
        w2 = Wallet(tenant_id=tenant_id, wallet_type="group_main", name="Group Main Wallet")
        db.session.add_all([w1, w2])
        db.session.commit()

    resp = client.get("/api/v1/wallets", headers=_auth_headers(token))

    assert resp.status_code == 200
    names = {w["name"] for w in resp.get_json()["data"]}
    assert names == {"Jane's Wallet", "Group Main Wallet"}


def test_get_wallet_not_found(app, client):
    _seed_tenant_and_user(app)
    token = _login(client)

    resp = client.get("/api/v1/wallets/does-not-exist", headers=_auth_headers(token))

    assert resp.status_code == 404


def test_get_wallet_returns_correct_wallet(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)

    with app.app_context():
        wallet = Wallet(
            tenant_id=tenant_id, owner_user_id=user_id, wallet_type="member",
            name="Jane's Wallet", balance=Decimal("2500.00"),
        )
        db.session.add(wallet)
        db.session.commit()
        wallet_id = wallet.id

    resp = client.get(f"/api/v1/wallets/{wallet_id}", headers=_auth_headers(token))

    assert resp.status_code == 200
    assert resp.get_json()["data"]["name"] == "Jane's Wallet"
    assert resp.get_json()["data"]["balance"] == "2500.00"


def test_create_sub_wallet_forbidden_for_member(app, client):
    _seed_tenant_and_user(app, role="member")
    token = _login(client)

    resp = client.post(
        "/api/v1/wallets/sub-wallets",
        json={"name": "Land Fund", "sub_purpose": "land"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 403


def test_create_sub_wallet_succeeds_for_treasurer(app, client):
    _seed_tenant_and_user(app, role="treasurer")
    token = _login(client)

    resp = client.post(
        "/api/v1/wallets/sub-wallets",
        json={"name": "Land Fund", "sub_purpose": "land"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 201
    body = resp.get_json()["data"]
    assert body["name"] == "Land Fund"
    assert body["sub_purpose"] == "land"
    assert body["wallet_type"] == "sub_purpose"


def test_create_sub_wallet_succeeds_for_group_admin(app, client):
    """RBAC minimum_role('treasurer') should also admit ranks above treasurer."""
    _seed_tenant_and_user(app, role="group_admin")
    token = _login(client)

    resp = client.post(
        "/api/v1/wallets/sub-wallets",
        json={"name": "Emergency Fund", "sub_purpose": "emergency"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 201


def test_create_sub_wallet_invalid_sub_purpose_fails(app, client):
    _seed_tenant_and_user(app, role="treasurer")
    token = _login(client)

    resp = client.post(
        "/api/v1/wallets/sub-wallets",
        json={"name": "Bogus Fund", "sub_purpose": "not_a_real_purpose"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 422
