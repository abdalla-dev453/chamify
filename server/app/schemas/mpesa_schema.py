from app.extensions import ma
from app.models.mpesa import MpesaTransaction


class MpesaTransactionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = MpesaTransaction
        load_instance = False


mpesa_transaction_schema = MpesaTransactionSchema()
mpesa_transactions_schema = MpesaTransactionSchema(many=True)
