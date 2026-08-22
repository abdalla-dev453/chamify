from app.extensions import db
from app.models.wallet import Wallet
from app.middleware.tenant_scope import scoped_query
from app.schemas.wallet_schema import wallet_schema, wallets_schema
from app.utils.responses import success_response, error_response
from app.models.ledger import LedgerEntry
from app.schemas.ledger_schema import ledger_entries_schema


def list_wallets():
    wallets = scoped_query(Wallet).all()
    return success_response(wallets_schema.dump(wallets))


def get_wallet(wallet_id):
    wallet = scoped_query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        return error_response("Wallet not found", 404)
    return success_response(wallet_schema.dump(wallet))


def create_sub_wallet(data, tenant_id):
    wallet = Wallet(
        tenant_id=tenant_id,
        wallet_type="sub_purpose",
        sub_purpose=data["sub_purpose"],
        name=data["name"],
    )
    db.session.add(wallet)
    db.session.commit()
    return success_response(wallet_schema.dump(wallet), status=201, message="Sub-wallet created")


def wallet_statement(wallet_id):
    wallet = scoped_query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        return error_response("Wallet not found", 404)
    entries = scoped_query(LedgerEntry).filter_by(wallet_id=wallet_id).order_by(LedgerEntry.created_at.desc()).all()
    return success_response(ledger_entries_schema.dump(entries))

def request_statement(wallet_id):
    wallet = scoped_query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        return error_response("Wallet not found", 404)
    # TODO: hand off to an async statement-generation task, same pattern
    # as app/blueprints/compliance/controllers.py's request_statement, if
    # that's what this route was meant to trigger.
    return success_response({"wallet_id": wallet_id}, message="Statement request received")