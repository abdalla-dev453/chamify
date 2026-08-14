"""
Digital AGM voting (Section 4.3): audited, signed voting for elections
and constitutional changes.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

VOTE_TOPIC_STATUSES = ("open", "closed", "cancelled")


class AgmVoteTopic(TenantScopedModel):
    __tablename__ = "agm_vote_topics"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    opens_at = db.Column(db.DateTime, nullable=False)
    closes_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum(*VOTE_TOPIC_STATUSES, name="vote_topic_status"), default="open")

    ballots = db.relationship("AgmVoteBallot", backref="topic", lazy="dynamic", cascade="all, delete-orphan")


class AgmVoteBallot(TenantScopedModel):
    __tablename__ = "agm_vote_ballots"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    topic_id = db.Column(db.String(36), db.ForeignKey("agm_vote_topics.id"), nullable=False)
    voter_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    choice = db.Column(db.String(100), nullable=False)
    signature_hash = db.Column(db.String(255), nullable=False)  # tamper-evidence, not encryption

    __table_args__ = (
        db.UniqueConstraint("topic_id", "voter_user_id", name="uq_one_vote_per_member"),
    )