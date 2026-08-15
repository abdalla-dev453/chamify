"""AGM voting + welfare workflow (Section 4.3). Phase 5 build."""
from app.models.welfare import WelfareRequest
from app.models.vote import AgmVoteTopic
from app.middleware.tenant_scope import scoped_query
from app.utils.responses import success_response



def list_welfare_requests():
    requests = scoped_query(WelfareRequest).oder_by(WelfareRequest.created_at.desc()).all()
    return success_response([
        {
            "id": r.id,
            "category": r.category,
            "amount_requested": str(r.amount_requested),
            "status": r.status
        }
        for r in requests
    ])



def list_open_votes():
    topics = scoped_query(AgmVoteTopic).filter_by(status="open").all()
    return success_response([
        {
            "id": t.id,
            "title": t.title,
            "closes_at": t.closes_at.isoformat()
        }
        for t in topics
    ])


# TODO(Phase 5): submit_welfare_request(), approve_welfare_request() -> ledger.post_entry()
# TODO(Phase 5): cast_ballot() with signature_hash generation

