import { useEffect, useState } from "react";
import { getLoan, addGuarantor, disburseLoan } from "./api.js";
import { formatKes } from "../../lib/formatters.js";
import { useAuth } from "../auth/AuthContext.jsx";

const CAN_DISBURSE_ROLES = ["treasurer", "branch_leader", "group_admin", "system_admin"];

export default function LoanDetailPanel({ loanId, onClose, onChanged }) {
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGuarantorId, setNewGuarantorId] = useState("");
  const [newGuarantorAmount, setNewGuarantorAmount] = useState("");
  const [actionError, setActionError] = useState("");

  const refresh = () => {
    setLoading(true);
    getLoan(loanId)
      .then(({ data }) => setLoan(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [loanId]);

  const handleAddGuarantor = async (e) => {
    e.preventDefault();
    setActionError("");
    try {
      await addGuarantor(loanId, { guarantor_user_id: newGuarantorId, amount_guaranteed: newGuarantorAmount });
      setNewGuarantorId("");
      setNewGuarantorAmount("");
      refresh();
      onChanged?.();
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not add guarantor.");
    }
  };

  const handleDisburse = async () => {
    setActionError("");
    try {
      await disburseLoan(loanId);
      refresh();
      onChanged?.();
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not disburse this loan.");
    }
  };

  const canDisburse = user && CAN_DISBURSE_ROLES.includes(user.role) && loan?.status === "approved";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="glass-panel w-full max-w-md p-6 bg-brand-slate-800 max-h-[85vh] overflow-y-auto">
        {loading || !loan ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-medium">{formatKes(loan.principal)}</p>
                <p className="text-slate-400 text-xs capitalize">{loan.status.replace("_", " ")} · {loan.term_months} months</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Close</button>
            </div>

            <h3 className="text-white text-sm font-medium mb-2">
              Guarantors ({loan.guarantors.length}/{loan.required_guarantor_count ?? "—"})
            </h3>
            <div className="space-y-2 mb-4">
              {loan.guarantors.length === 0 ? (
                <p className="text-slate-500 text-xs">No guarantors added yet.</p>
              ) : (
                loan.guarantors.map((g) => (
                  <div key={g.guarantor_user_id} className="flex justify-between text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-2">
                    <span>{formatKes(g.amount_guaranteed)}</span>
                    <span className="capitalize">{g.status}</span>
                  </div>
                ))
              )}
            </div>

            {loan.status === "pending_guarantors" && (
              <form onSubmit={handleAddGuarantor} className="space-y-2 mb-4">
                <input
                  className="input-field text-sm" placeholder="Guarantor user ID"
                  value={newGuarantorId} onChange={(e) => setNewGuarantorId(e.target.value)} required
                />
                <input
                  className="input-field text-sm" type="number" placeholder="Amount guaranteed (KES)"
                  value={newGuarantorAmount} onChange={(e) => setNewGuarantorAmount(e.target.value)} required
                />
                <button type="submit" className="btn-primary w-full text-sm">Invite guarantor</button>
              </form>
            )}

            {actionError && <p className="text-orange-400 text-sm mb-3">{actionError}</p>}

            {canDisburse && (
              <button onClick={handleDisburse} className="btn-accent w-full text-sm">
                Disburse loan
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}