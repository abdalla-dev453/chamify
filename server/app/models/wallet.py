"""
Multi-tier wallets (Section 4.1): member wallets, one group main wallet,
and purpose-specific sub-wallets (land, welfare, project funds).
"""
from app.extensions import db
from app.models.base import TenantScopedModel

WALLET_TYPES = ("member", "group_main", "sub_purpose")
SUB_PURPOSES = ("land", "welfare", "project", "emergency", "other")


class Wallet(TenantScopedModel):
    __tablename__ = "wallets"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    owner_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)  # null for group_main

    wallet_type = db.Column(db.Enum(*WALLET_TYPES, name="wallet_type"), nullable=False)
    sub_purpose = db.Column(db.Enum(*SUB_PURPOSES, name="wallet_sub_purpose"), nullable=True)

    balance = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    name = db.Column(db.String(150), nullable=False, default="Wallet")

    owner = db.relationship("User", foreign_keys=[owner_user_id])
    savings_contributions = db.relationship("SavingsContribution", backref="wallet", lazy="dynamic", cascade="all, delete-orphan")
    loans = db.relationship("Loan", backref="wallet", lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Wallet {self.name} ({self.wallet_type}) bal={self.balance}>"