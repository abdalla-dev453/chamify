from flask import Blueprint
from server.app.middleware.rbac import roles_required
from flask_jwt_extended import jwt_required
from app.blueprints.admin import controllers


admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/overview", methods=["GET"])
@jwt_required()
@roles_required("system_admin")
def platform_overview():
    return controllers.platform_overview()



@admin_bp.route("/kyc-queue", methods=["GET"])
@jwt_required()
@roles_required("system_admin") 
def kyc_queue():
    return controllers.kyc_queue()


# TODO(Phase 8): POST /tenants/<id>/suspend, POST /tenants/<id>/activate
