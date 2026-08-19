import { useEffect, useState } from "react";
import { ShieldAlert, UserPlus, ClipboardList, RefreshCw, X, Landmark } from "lucide-react";
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
      .catch((err) => console.error("Loan lookup failed:", err))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [loanId]);

  const handleAddGuarantor = async (e) => {
    e.preventDefault();
    setActionError("");
    try {
      await addGuarantor(loanId, {
        guarantor_user_id: newGuarantorId,
        amount_guaranteed: Number(newGuarantorAmount),
      });
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-panel relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {loading || !loan ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-400">Loading loan details…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-brand-border pb-4 pr-6">
              <p className="text-xl font-bold tracking-tight text-slate-900">{formatKes(loan.principal || 0)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="badge-green">{loan.status ? loan.status.replace(/_/g, " ") : "Pending evaluation"}</span>
                <span className="text-slate-400 font-medium">{loan.term_months || 0} Month Term</span>
              </div>
            </div>

            {/* Guarantors */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Guarantors</h3>
                </div>
                <span className="badge-slate">
                  {loan.guarantors?.length || 0} / {loan.required_guarantor_count ?? "—"}
                </span>
              </div>

              <div className="space-y-2">
                {!loan.guarantors || loan.guarantors.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 bg-slate-50 border border-dashed border-brand-border rounded-lg p-4 text-center">
                    No guarantors added yet.
                  </p>
                ) : (
                  loan.guarantors.map((g) => (
                    <div
                      key={g.guarantor_user_id}
                      className="flex items-center justify-between gap-4 text-sm bg-slate-50 border border-brand-border rounded-lg px-3.5 py-2.5"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Amount Guaranteed</span>
                        <span className="font-bold text-slate-800">{formatKes(g.amount_guaranteed || 0)}</span>
                      </div>
                      <span className={g.status === "approved" ? "badge-green shrink-0" : "badge-amber shrink-0"}>
                        {g.status ? g.status.replace(/_/g, " ") : "Pending"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add guarantor form */}
            {loan.status === "pending_guarantors" && (
              <div className="border-t border-brand-border pt-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <UserPlus size={14} className="text-brand-green-600" />
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Add a Guarantor</h4>
                </div>

                <form onSubmit={handleAddGuarantor} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Guarantor member ID"
                    value={newGuarantorId}
                    onChange={(e) => setNewGuarantorId(e.target.value)}
                    required
                    className="input-field"
                  />
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-semibold text-slate-400">KES</span>
                    <input
                      type="number"
                      placeholder="Amount guaranteed"
                      value={newGuarantorAmount}
                      onChange={(e) => setNewGuarantorAmount(e.target.value)}
                      required
                      className="input-field pl-12"
                    />
                  </div>
                  <button type="submit" className="btn-outline w-full">
                    Send Guarantor Invitation
                  </button>
                </form>
              </div>
            )}

            {actionError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {canDisburse && (
              <div className="border-t border-brand-border pt-4">
                <button onClick={handleDisburse} className="btn-primary w-full">
                  <Landmark size={14} />
                  Disburse Loan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}