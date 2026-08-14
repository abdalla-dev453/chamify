"""
Consistent JSON envelope for every API response, so the React client can
rely on one shape everywhere instead of guessing per-endpoint.
"""

from flask import jsonify


def success_response(data=None, message="OK", status=200, meta=None):
    payload = { "success": True, "message": message, "data": data }
    if meta is not None:
        payload["meta"] = meta

    return jsonify(payload), status


def error_response(message="An error occurred", status=400, errors=None):
    payload = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors

    return jsonify(payload), status