
"""
Seed script for local dev database.

Run with:
    python seed.py

Wipes and recreates a sample tenant ("Baraka Chama Group") with:
  - 1 subscription plan + active subscription
  - 5 users across the role hierarchy (Section 4.3 RBAC)
  - 1 group_main wallet + 1 member wallet per user
  - a monthly savings schedule with sample contributions + matching ledger entries
  - 1 sample loan (pending_appraisal) with a guarantor
  - 1 sample welfare request
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from app import create_app
from app.extensions import db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.wallet import Wallet
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.savings import SavingsSchedule, SavingsContribution
from app.models.ledger import LedgerEntry
from app.models.loan import Loan
from app.models.guarantor import LoanGuarantor
from app.models.welfare import WelfareRequest


TENANT_SLUG = "baraka-chama"


def wipe_existing(tenant_slug):
    """
    This is a local dev seed script for a single-tenant sandbox database —
    there's no real data here worth preserving. Deleting the tenant row by
    row (users -> wallets -> loans -> ledger entries -> welfare requests ->
    ...) means every new model that references users/wallets becomes a new
    FK-ordering bug to chase one at a time. Since this script only ever
    targets a disposable local dev database, resetting the whole schema is
    simpler and won't need touching again as the schema grows.

    NOT safe to run against any database with real tenant data you want to
    keep — this wipes everything, not just `tenant_slug`.
    """
    print("Resetting local dev database schema...")
    db.drop_all()
    db.create_all()


def seed():
    wipe_existing(TENANT_SLUG)

    # --- Subscription plan + tenant ---------------------------------------
    plan = SubscriptionPlan(
        name="Tier 1 Chama - Monthly",
        billing_model="subscription",
        monthly_price=Decimal("1500.00"),
        transaction_fee_percent=None,
        max_active_members=50,
        features={"ussd": True, "sms_blast_packs": 500, "voting": True},
    )
    db.session.add(plan)
    db.session.flush()

    tenant = Tenant(
        name="Baraka Chama Group",
        slug=TENANT_SLUG,
        tier="tier_1_informal",
        isolation_mode="shared_schema",
        uses_shared_paybill=True,
        iprs_verified=False,
        is_active=True,
        locale="en",
    )
    db.session.add(tenant)
    db.session.flush()

    subscription = Subscription(
        tenant_id=tenant.id,
        plan_id=plan.id,
        is_active=True,
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.session.add(subscription)

    # --- Users across the RBAC hierarchy -----------------------------------
    users_data = [
        {"full_name": "Grace Njoki", "phone_number": "254712345601", "role": "group_admin"},
        {"full_name": "Peter Mwangi", "phone_number": "254712345602", "role": "branch_leader"},
        {"full_name": "Jane Wanjiru", "phone_number": "254712345603", "role": "treasurer"},
        {"full_name": "Samuel Otieno", "phone_number": "254712345604", "role": "member"},
        {"full_name": "Mary Achieng", "phone_number": "254712345605", "role": "member"},
    ]

    users = {}
    for u in users_data:
        user = User(
            tenant_id=tenant.id,
            full_name=u["full_name"],
            phone_number=u["phone_number"],
            role=u["role"],
            is_active=True,
            is_phone_verified=True,
            two_factor_enabled=True,
            preferred_locale="en",
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.flush()
        users[u["role"] if u["role"] not in users else u["full_name"]] = user
        users[u["full_name"]] = user

    db.session.flush()

    # --- Wallets -------------------------------------------------------------
    group_wallet = Wallet(
        tenant_id=tenant.id,
        owner_user_id=None,
        wallet_type="group_main",
        name="Baraka Chama Main Wallet",
        balance=Decimal("0.00"),
    )
    db.session.add(group_wallet)
    db.session.flush()

    member_wallets = {}
    for u in users_data:
        user = users[u["full_name"]]
        wallet = Wallet(
            tenant_id=tenant.id,
            owner_user_id=user.id,
            wallet_type="member",
            name=f"{user.full_name}'s Wallet",
            balance=Decimal("0.00"),
        )
        db.session.add(wallet)
        db.session.flush()
        member_wallets[u["full_name"]] = wallet

    # --- Savings schedule + contributions + ledger entries -------------------
    schedule = SavingsSchedule(
        tenant_id=tenant.id,
        name="Monthly Savings - KES 1000",
        frequency="monthly",
        expected_amount=Decimal("1000.00"),
        penalty_rate=Decimal("0.050"),
        grace_period_days=3,
        is_active=True,
    )
    db.session.add(schedule)
    db.session.flush()

    running_group_balance = Decimal("0.00")
    for u in users_data:
        wallet = member_wallets[u["full_name"]]
        amount = Decimal("1000.00")

        contribution = SavingsContribution(
            tenant_id=tenant.id,
            wallet_id=wallet.id,
            schedule_id=schedule.id,
            amount=amount,
            penalty_applied=Decimal("0.00"),
            is_late=False,
        )
        db.session.add(contribution)

        wallet.balance = (wallet.balance or Decimal("0.00")) + amount
        running_group_balance += amount

        member_entry = LedgerEntry(
            tenant_id=tenant.id,
            wallet_id=wallet.id,
            scope="member",
            entry_type="credit",
            source_type="savings_contribution",
            amount=amount,
            balance_after=wallet.balance,
            memo=f"Monthly savings contribution - {u['full_name']}",
        )
        db.session.add(member_entry)

    group_wallet.balance = running_group_balance
    group_entry = LedgerEntry(
        tenant_id=tenant.id,
        wallet_id=group_wallet.id,
        scope="group",
        entry_type="credit",
        source_type="savings_contribution",
        amount=running_group_balance,
        balance_after=group_wallet.balance,
        memo="Aggregate monthly savings collection",
    )
    db.session.add(group_entry)

    # --- Sample loan + guarantor ----------------------------------------------
    borrower = users["Samuel Otieno"]
    borrower_wallet = member_wallets["Samuel Otieno"]

    loan = Loan(
        tenant_id=tenant.id,
        wallet_id=borrower_wallet.id,
        borrower_user_id=borrower.id,
        principal=Decimal("3000.00"),
        interest_method="reducing_balance",
        interest_rate=Decimal("0.1200"),
        term_months=6,
        savings_multiplier_used=Decimal("3.0"),
        status="pending_appraisal",
    )
    db.session.add(loan)
    db.session.flush()

    guarantor_user = users["Mary Achieng"]
    guarantor = LoanGuarantor(
        tenant_id=tenant.id,
        loan_id=loan.id,
        guarantor_user_id=guarantor_user.id,
        status="pending",
        amount_guaranteed=Decimal("1500.00"),
    )
    db.session.add(guarantor)

    # --- Sample welfare request ------------------------------------------------
    welfare = WelfareRequest(
        tenant_id=tenant.id,
        requester_user_id=users["Mary Achieng"].id,
        category="hospitalization",
        amount_requested=Decimal("5000.00"),
        description="Hospital bill support following a family emergency.",
        status="submitted",
    )
    db.session.add(welfare)

    db.session.commit()

    print("\nSeed complete.")
    print(f"Tenant slug: {tenant.slug}")
    print("Login with any seeded user, e.g.:")
    print("  phone_number: 254712345603 (Jane Wanjiru, treasurer)")
    print("  password: password123")
    print(f"Group wallet balance: KES {group_wallet.balance}")


if __name__ == "__main__":
    app = create_app("development")
    with app.app_context():
        seed()