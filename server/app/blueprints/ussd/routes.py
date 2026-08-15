from flask import Blueprint, request, Response
from app.blueprints.ussd import controllers

ussd_bp = Blueprint("ussd", __name__)


@ussd_bp.route("/session", methods=["POST"])
def ussd_session():
    """Africa's Talking posts application/x-www-form-urlencoded, not JSON."""
    session_id = request.form.get("sessionId", "")
    phone_number = request.form.get("phoneNumber", "")
    text = request.form.get("text", "")
    reply = controllers.handle_ussd_session(session_id, phone_number, text)
    return Response(reply, mimetype="text/plain")
