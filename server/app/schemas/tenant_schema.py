from marshmallow import fields, validate
from app.extensions import ma
from app.models.tenant import Tenant, TENANT_TIERS


class TenantSchema(ma.SQAlchemyAutoSchema):
    class Meta:
        model = Tenant
        load_instance = False
        


class CreateTenantSchema(ma.Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    tier = fields.String(required=True, validate=validate.OneOf(TENANT_TIERS))
    chairperson_id_number = fields.String(required=False)



tenant_schema = TenantSchema()
tenants_schema = TenantSchema(many=True)
create_tenant_schema = CreateTenantSchema()