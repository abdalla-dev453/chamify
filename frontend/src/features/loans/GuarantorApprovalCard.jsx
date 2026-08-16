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
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150 hover:border-slate-700">
      
      {/* Target Record Data Fields */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 text-orange-500">
          <ShieldAlert size={14} />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-slate-200 tracking-tight">
            Principal Request: <span className="font-mono text-white">{formatKes(loan?.principal || 0)}</span> · <span className="font-mono text-slate-300">{loan?.term_months || 0} months</span>
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] font-bold text-slate-500">Guarantee Liability Allocation:</span>
            <span className="font-mono text-orange-500 font-bold">{formatKes(guarantee?.amount_guaranteed || 0)}</span>
          </div>
          
          {/* Dynamic Error Registry Row */}
          {error && (
            <p className="text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wide mt-2 border-l-2 border-rose-500/40 pl-2">
              Pipeline Failure: {error}
            </p>
          )}
        </div>
      </div>

      {/* Structured Action Pipeline Controls */}
      <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
        
        {/* Verification Action: Authorize / Approve */}
        <button 
          disabled={submitting}
          onClick={() => respond("approve")} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 font-mono uppercase tracking-wider transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {submitting ? (
            <RefreshCw size={12} className="animate-spin text-orange-500" />
          ) : (
            <Check size={12} className="text-orange-500" />
          )}
          Authorize
        </button>

        {/* Verification Action: Reject / Decline */}
        <button 
          disabled={submitting}
          onClick={() => respond("decline")} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-800 bg-slate-900 hover:border-rose-950/40 hover:text-rose-400 text-xs font-bold text-slate-400 font-mono uppercase tracking-wider transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <X size={12} className="text-slate-600" />
          Decline
        </button>

      </div>
    </div>
  );
}
