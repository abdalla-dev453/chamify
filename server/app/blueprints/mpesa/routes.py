from flask import Blueprint, request
from app.middleware.rate_limit import limiter, webhook_rate_limit, auth_rate_limit
from app.blueprints.mpesa import controllers
from app.utils.responses import error_response, success_response

mpesa_bp = Blueprint("mpesa", __name__)


@mpesa_bp.route("/callback/<string:tenant_id>", methods=["POST"])
@limiter.limit(webhook_rate_limit)
def c2b_callback(tenant_id):
    """
    Public webhook — Daraja calls this directly, so it's NOT behind @require_tenant.
    Validate the payload shape carefully; never trust it blindly in production
    (verify source IP / use a shared secret path segment at minimum).
    """
    payload = request.get_json(force=True, silent=True) or {}
    return controllers.handle_c2b_callback(tenant_id, payload)


@mpesa_bp.route("/disburse", methods=["POST"])
@limiter.limit(auth_rate_limit)
def disburse_loan_payout():
    """
    Internal Trigger — Disburse money to an end-user's wallet via M-Pesa B2C.
    Triggered internally by loan approval workflows or accounting control panels.
    """
    from app.tasks.alert_tasks import send_alert_task
    
    payload = request.get_json(force=True, silent=True) or {}
    
    required_fields = ["phone_number", "amount", "tenant_id"]
    missing_fields = [field for field in required_fields if field not in payload]
    
    if missing_fields:
        return error_response(
            message="Invalid payout definition", 
            code=422,  # type: ignore
            errors={"missing_parameters": missing_fields}
        )
        
    result, status_code = controllers.initiate_b2c_disbursement(payload)
    
    if status_code != 202:
        return error_response("Disbursement submission rejected by gatekeeper", status_code, errors=result)

    send_alert_task.delay(
        payload={"message": f"Disbursement of KES {payload['amount']} initiated successfully."},
        channel="SMS",
        recipient=payload["phone_number"]
    )
    
    return success_response(result, "Disbursement payload successfully submitted to queue", 202)


@mpesa_bp.route("/callback/b2c/<string:tenant_id>", methods=["POST"])
@limiter.limit(webhook_rate_limit)
def b2c_callback(tenant_id):
    """
    Public B2C Webhook — Handles timeout/success outcomes from Safaricom B2C transactions.
    Determines if the disbursed funds were securely delivered or reversed.
    """
    payload = request.get_json(force=True, silent=True) or {}
    
    if not payload:
        return error_response("Empty result payload from infrastructure broker", 400)
        
    return controllers.handle_b2c_callback(tenant_id, payload)
    
    # TODO: if disbursement is successful, create a SavingsContribution