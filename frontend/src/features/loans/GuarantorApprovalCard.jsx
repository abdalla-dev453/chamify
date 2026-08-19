/**
 * One pending guarantee request. `respondToGuarantee` hits the real
 * POST /loans/<id>/guarantors/{approve,decline} endpoints — the backend
 * derives WHO is responding from the JWT, so the only thing this
 * component needs to pass is the decision.
 */
import { useState } from "react";
import { ShieldAlert, Check, X, RefreshCw } from "lucide-react";
import { respondToGuarantee } from "./api.js";
import { formatKes } from "../../lib/formatters.js";

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
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ShieldAlert size={16} />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {formatKes(loan?.principal || 0)} <span className="text-slate-400 font-medium">· {loan?.term_months || 0} months</span>
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Guaranteeing:</span>
            <span className="font-bold text-slate-700">{formatKes(guarantee?.amount_guaranteed || 0)}</span>
          </div>
          {error && <p className="text-[11px] font-semibold text-rose-600 mt-1.5">{error}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
        <button onClick={() => respond("approve")} disabled={submitting} className="btn-primary py-1.5 px-3 text-xs">
          {submitting ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
          Approve
        </button>
        <button onClick={() => respond("decline")} disabled={submitting} className="btn-muted py-1.5 px-3 text-xs">
          <X size={12} />
          Decline
        </button>
      </div>
    </div>
  );
}