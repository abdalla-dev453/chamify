"""Tests for the loans blueprint: appraisal against the savings multiplier,
reducing-balance schedule math, and tenant scoping.
"""
from decimal import Decimal

from app.extensions import db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.wallet import Wallet
from app.models.savings import SavingsContribution
from app.models.loan import Loan
from app.utils.calculators import max_loan_amount, reducing_balance_schedule
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


def _make_wallet_with_savings(app, tenant_id, user_id, savings_amount):
    with app.app_context():
        wallet = Wallet(tenant_id=tenant_id, owner_user_id=user_id, wallet_type="member", name="Wallet")
        db.session.add(wallet)
        db.session.flush()

        contribution = SavingsContribution(
            tenant_id=tenant_id, wallet_id=wallet.id, amount=Decimal(savings_amount),
        )
        db.session.add(contribution)
        db.session.commit()
        return wallet.id


# --- Pure calculator unit tests (no HTTP, no DB) -----------------------------

def test_max_loan_amount_uses_3x_multiplier_by_default():
    assert max_loan_amount(Decimal("1000")) == Decimal("3000.00")


def test_max_loan_amount_respects_custom_multiplier():
    assert max_loan_amount(Decimal("1000"), multiplier=Decimal("2")) == Decimal("2000.00")


def test_reducing_balance_schedule_matches_expected_amortization():
    # principal=3000, annual_rate=12%, term=6 months -> straight-line principal
    # (500/month) with interest computed on the declining balance.
    schedule = reducing_balance_schedule(Decimal("3000"), Decimal("0.12"), 6)

    assert len(schedule) == 6
    assert schedule[0] == {
        "month": 1, "principal_component": "500.00", "interest_component": "30.00",
        "total_due": "530.00", "balance_after": "2500.00",
    }
    assert schedule[-1] == {
        "month": 6, "principal_component": "500.00", "interest_component": "5.00",
        "total_due": "505.00", "balance_after": "0.00",
    }
    # Balance must fully amortize to zero by the final month.
    assert schedule[-1]["balance_after"] == "0.00"


# --- Loan application (appraisal against savings multiplier) ----------------

def test_apply_for_loan_within_limit_succeeds(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)
    wallet_id = _make_wallet_with_savings(app, tenant_id, user_id, "1000.00")

    # limit = 1000 * 3 = 3000, so 3000 is exactly at the limit.
    resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": wallet_id, "principal": "3000.00", "term_months": 6,
    }, headers=_auth_headers(token))

    assert resp.status_code == 201
    body = resp.get_json()["data"]
    assert body["status"] == "pending_guarantors"
    assert body["principal"] == "3000.00"


def test_apply_for_loan_exceeds_limit_fails(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)
    wallet_id = _make_wallet_with_savings(app, tenant_id, user_id, "1000.00")

    # limit = 3000, requesting 3000.01 should be rejected.
    resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": wallet_id, "principal": "3000.01", "term_months": 6,
    }, headers=_auth_headers(token))

    assert resp.status_code == 422


def test_apply_for_loan_with_zero_savings_rejects_any_principal(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)

    with app.app_context():
        wallet = Wallet(tenant_id=tenant_id, owner_user_id=user_id, wallet_type="member", name="Wallet")
        db.session.add(wallet)
        db.session.commit()
        wallet_id = wallet.id

    resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": wallet_id, "principal": "100.00", "term_months": 6,
    }, headers=_auth_headers(token))

    assert resp.status_code == 422


def test_apply_for_loan_wallet_not_found(app, client):
    _seed_tenant_and_user(app)
    token = _login(client)

    resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": "does-not-exist", "principal": "100.00", "term_months": 6,
    }, headers=_auth_headers(token))

    assert resp.status_code == 404


def test_apply_for_loan_invalid_term_months_fails(app, client):
    _seed_tenant_and_user(app)
    token = _login(client)

    resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": "irrelevant", "principal": "100.00", "term_months": 0,
    }, headers=_auth_headers(token))

    assert resp.status_code == 422


def test_list_loans_returns_tenant_scoped_loans(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)
    wallet_id = _make_wallet_with_savings(app, tenant_id, user_id, "1000.00")

    client.post("/api/v1/loans/apply", json={
        "wallet_id": wallet_id, "principal": "1500.00", "term_months": 12,
    }, headers=_auth_headers(token))

    resp = client.get("/api/v1/loans", headers=_auth_headers(token))

    assert resp.status_code == 200
    assert len(resp.get_json()["data"]) == 1


# --- Repayment schedule preview ----------------------------------------------

def test_schedule_preview_returns_correct_math(app, client):
    tenant_id, user_id = _seed_tenant_and_user(app)
    token = _login(client)
    wallet_id = _make_wallet_with_savings(app, tenant_id, user_id, "1000.00")

    apply_resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": wallet_id, "principal": "3000.00", "term_months": 6,
    }, headers=_auth_headers(token))
    loan_id = apply_resp.get_json()["data"]["id"]

    resp = client.get(f"/api/v1/loans/{loan_id}/schedule-preview", headers=_auth_headers(token))

    assert resp.status_code == 200
    schedule = resp.get_json()["data"]
    assert len(schedule) == 6
    assert schedule[0]["total_due"] == "530.00"
    assert schedule[-1]["balance_after"] == "0.00"


def test_schedule_preview_not_found_for_missing_loan(app, client):
    _seed_tenant_and_user(app)
    token = _login(client)

    resp = client.get("/api/v1/loans/does-not-exist/schedule-preview", headers=_auth_headers(token))

    assert resp.status_code == 404


def test_schedule_preview_is_tenant_scoped(app, client):
    """
    NOTE: repayment_schedule_preview() currently queries with Loan.query.get(loan_id)
    instead of scoped_query(Loan), unlike every other loan/wallet lookup in this
    codebase. This test encodes the SECURE expected behavior (a loan belonging to
    tenant A must be invisible to an authenticated user from tenant B) and is
    expected to currently FAIL, exposing a cross-tenant data leak.
    """
    tenant_a_id, user_a_id = _seed_tenant_and_user(
        app, tenant_slug="tenant-a", phone_number="0712345678"
    )
    token_a = _login(client, phone_number="0712345678", tenant_slug="tenant-a")
    wallet_a_id = _make_wallet_with_savings(app, tenant_a_id, user_a_id, "1000.00")

    apply_resp = client.post("/api/v1/loans/apply", json={
        "wallet_id": wallet_a_id, "principal": "1000.00", "term_months": 3,
    }, headers=_auth_headers(token_a))
    loan_id = apply_resp.get_json()["data"]["id"]

    # A different user in a completely separate tenant.
    _seed_tenant_and_user(app, tenant_slug="tenant-b", phone_number="0722334455")
    token_b = _login(client, phone_number="0722334455", tenant_slug="tenant-b")

    resp = client.get(f"/api/v1/loans/{loan_id}/schedule-preview", headers=_auth_headers(token_b))

    assert resp.status_code == 404
