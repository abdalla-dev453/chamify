/**
 * Reusable card for a pending loan-guarantee request — used inside
 * LoansPage once Phase 3 (guarantor sign-off) is wired up on the backend.
 * Left as a presentational component so it can be dropped in without
 * waiting on the approve/decline endpoints.
 */
import { ShieldAlert, Check, X } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function GuarantorApprovalCard({ loan, guarantee, onResponded }) {
  const respond = async (decision) => {
    try {
      // Phase 3 backend implementation gateway pathing
      await apiClient.post(`/loans/${loan.id}/guarantors/${guarantee.guarantor_user_id}/${decision}`);
      onResponded?.();
    } catch (err) {
      console.error(`Guarantor mitigation failure during execution node [${decision}]:`, err);
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
            Principal Request: <span className="font-mono text-white">{formatKes(loan?.principal || 0)}</span> by {loan?.borrower_name || "Unknown Borrower"}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] font-bold text-slate-500">Guarantee Liability Allocation:</span>
            <span className="font-mono text-orange-500 font-bold">{formatKes(guarantee?.amount_guaranteed || 0)}</span>
          </div>
        </div>
      </div>

      {/* Structured Action Pipeline Controls */}
      <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
        
        {/* Verification Action: Authorize / Approve */}
        <button 
          onClick={() => respond("approve")} 
          className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 font-mono uppercase tracking-wider transition-colors duration-150 cursor-pointer"
        >
          <Check size={12} className="text-orange-500" />
          Authorize
        </button>

        {/* Verification Action: Reject / Decline */}
        <button 
          onClick={() => respond("decline")} 
          className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-800 bg-slate-900 hover:border-rose-950/40 hover:text-rose-400 text-xs font-bold text-slate-400 font-mono uppercase tracking-wider transition-colors duration-150 cursor-pointer"
        >
          <X size={12} className="text-slate-600" />
          Decline
        </button>

      </div>
    </div>
  );
}
