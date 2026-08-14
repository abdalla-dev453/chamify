from app.extensions import ma
from app.models.wallet import Wallet


class WalletSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Wallet
        load_instance = False


wallet_schema = WalletSchema()
wallets_schema = WalletSchema(many=True)
