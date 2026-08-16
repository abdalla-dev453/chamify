import { useState } from "react";
import { respondToGuarantee } from "./api.js";
import { formatKes } from "../../lib/formatters.js";

/**
 * One pending guarantee request. `respondToGuarantee` hits the real
 * POST /loans/<id>/guarantors/{approve,decline} endpoints — the backend
 * derives WHO is responding from the JWT, so the only thing this
 * component needs to pass is the decision.
 */
export default function GuarantorApprovalCard({ loan, guarantee, onResponded }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const respond = async (decision) => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await respondToGuarantee(loan.id, decision);
      onResponded?.(data.data.loan_status);
    } catch (err) {
      setError(err.response?.data?.message || "Could not record your response.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-4 flex items-center justify-between">
      <div>
        <p className="text-white text-sm">{formatKes(loan.principal)} · {loan.term_months} months</p>
        <p className="text-slate-400 text-xs">You're guaranteeing {formatKes(guarantee.amount_guaranteed)}</p>
        {error && <p className="text-orange-400 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button disabled={submitting} onClick={() => respond("approve")} className="btn-primary text-xs px-3 py-1.5">
          Approve
        </button>
        <button disabled={submitting} onClick={() => respond("decline")} className="text-orange-400 text-xs px-3 py-1.5 hover:underline">
          Decline
        </button>
      </div>
    </div>
  );
}