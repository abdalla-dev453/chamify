from marshmallow import fields, validate
from app.extensions import ma
from app.models.loan import Loan


class LoanSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Loan
        load_instance = False


class CreateLoanApplicationSchema(ma.Schema):
    wallet_id = fields.String(required=True)
    principal = fields.Decimal(required=True, validate=validate.Range(min=1))
    term_months = fields.Integer(required=True, validate=validate.Range(min=1, max=60))
    interest_method = fields.String(validate=validate.OneOf(["reducing_balance", "flat_rate"]), load_default="reducing_balance")


loan_schema = LoanSchema()
loans_schema = LoanSchema(many=True)
create_loan_schema = CreateLoanApplicationSchema()
