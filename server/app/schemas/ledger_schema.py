from app.extensions import ma
from app.models.ledger import LedgerEntry


class LedgerEntrySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = LedgerEntry
        load_instance = False


ledger_entry_schema = LedgerEntrySchema()
ledger_entries_schema = LedgerEntrySchema(many=True)
