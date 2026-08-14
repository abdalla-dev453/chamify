from marshmallow import fields, validate, validates, ValidationError
from app.extensions import ma
from app.models.user import User, ROLES
from app.utils.validators import is_valid_kenyan_phone


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = False
        exclude = ("password_hash",)

    role = fields.String(validate=validate.OneOf(ROLES))


class RegisterUserSchema(ma.Schema):
    full_name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    phone_number = fields.String(required=True)
    email = fields.Email(required=False, allow_none=True)
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=8))
    tenant_slug = fields.String(required=True)


    @validates("phone_number")
    def validate_phone(self, value, **kwargs):
        if not is_valid_kenyan_phone(value):
            raise ValidationError("Enter a valid Kenyan phone number, e.g. 0712345678.")


class LoginSchema(ma.Schema):
    phone_number = fields.String(required=True)
    password = fields.String(required=True, load_only=True)
    tenant_slug = fields.String(required=True)


user_schema = UserSchema()
users_schema = UserSchema(many=True)
register_schema = RegisterUserSchema()
login_schema = LoginSchema()