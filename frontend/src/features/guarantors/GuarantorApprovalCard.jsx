/**
 * Reusable card for a pending loan-guarantee request — used inside
 * LoansPage once Phase 3 (guarantor sign-off) is wired up on the backend.
 * Left as a presentational component so it can be dropped in without
 * waiting on the approve/decline endpoints.
 */
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function GuarantorApprovalCard({ loan, guarantee, onResponded }) {
  const respond = async (decision) => {
    // TODO(Phase 3 backend): wire once POST /loans/<id>/guarantors/<user_id>/approve exists
    await apiClient.post(`/loans/${loan.id}/guarantors/${guarantee.guarantor_user_id}/${decision}`);
    onResponded?.();
  };

  return (
    <div className="glass-panel p-4 flex items-center justify-between">
      <div>
        <p className="text-white text-sm">{formatKes(loan.principal)} requested by {loan.borrower_name}</p>
        <p className="text-slate-400 text-xs">You're guaranteeing {formatKes(guarantee.amount_guaranteed)}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => respond("approve")} className="btn-primary text-xs px-3 py-1.5">Approve</button>
        <button onClick={() => respond("decline")} className="text-orange-400 text-xs px-3 py-1.5 hover:underline">Decline</button>
      </div>
    </div>
  );
}