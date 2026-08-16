import { useEffect, useState } from "react";
import { ShieldAlert, UserPlus, ClipboardList, Wallet, RefreshCw, X, Landmark } from "lucide-react";
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
      .catch((err) => console.error("Database lookup failure on credit query:", err))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [loanId]);

  const handleAddGuarantor = async (e) => {
    e.preventDefault();
    setActionError("");
    try {
      await addGuarantor(loanId, { 
        guarantor_user_id: newGuarantorId, 
        amount_guaranteed: Number(newGuarantorAmount) 
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      
      {/* Main Structural Detail Drawer Container */}
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Absolute Floating Close Trigger */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>

        {loading || !loan ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-orange-500" />
            <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Querying Record Schema...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Asset Allocation Header Block */}
            <div className="border-b border-slate-900 pb-4 pr-6">
              <p className="text-xl font-bold font-mono tracking-tight text-white select-all">
                {formatKes(loan.principal || 0)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold font-mono uppercase text-slate-400">
                <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-orange-500">
                  {loan.status ? loan.status.replace("_", " ") : "Pending evaluation"}
                </span>
                <span className="text-slate-700">•</span>
                <span className="tracking-wide text-slate-300">{loan.term_months || 0} Month Interval</span>
              </div>
            </div>

            {/* Sub Section: Guarantor Allocation Registry Matrix */}
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-slate-900 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <ClipboardList size={13} className="text-slate-500" />
                  <h3 className="text-[11px] font-bold tracking-wide text-slate-400 uppercase font-mono">
                    Guarantor Quorum Sign-off
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  Index: {loan.guarantors?.length || 0} / {loan.required_guarantor_count ?? "—"} Verified
                </span>
              </div>

              <div className="space-y-1.5">
                {(!loan.guarantors || loan.guarantors.length === 0) ? (
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600 bg-slate-900/40 border border-slate-900 border-dashed rounded-lg p-4 text-center">
                    Zero Guarantor Nodes Logged
                  </p>
                ) : (
                  loan.guarantors.map((g) => (
                    <div 
                      key={g.guarantor_user_id} 
                      className="flex items-center justify-between gap-4 text-xs font-mono bg-slate-900/60 border border-slate-900 rounded-lg px-3 py-2.5 hover:border-slate-800 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Allocation Bound</span>
                        <span className="font-bold text-slate-200 select-all">{formatKes(g.amount_guaranteed || 0)}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          g.status === "approved" 
                            ? "bg-slate-950 text-slate-300 border-slate-800" 
                            : "bg-slate-950 text-orange-400 border-orange-500/10"
                        }`}>
                          {g.status ? g.status.replace("_", " ") : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sub Section: Context-Driven Allocation Form Pipeline */}
            {loan.status === "pending_guarantors" && (
              <div className="border-t border-slate-900 pt-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <UserPlus size={13} className="text-orange-500" />
                  <h4 className="text-[11px] font-bold tracking-wide text-slate-400 uppercase font-mono">
                    Append Underwriter Authorization
                  </h4>
                </div>
                
                <form onSubmit={handleAddGuarantor} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Underwriter System UUID / User ID"
                    value={newGuarantorId}
                    onChange={(e) => setNewGuarantorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium font-mono text-white placeholder-slate-700 outline-none focus:border-orange-500/30"
                  />
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[10px] font-mono font-bold text-slate-600">KES</span>
                    <input
                      type="number"
                      placeholder="Indemnity Commitment Capital (KES)"
                      value={newGuarantorAmount}
                      onChange={(e) => setNewGuarantorAmount(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium font-mono text-white placeholder-slate-700 outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 font-mono uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Transmit Underwriter Invitation
                  </button>
                </form>
              </div>
            )}

            {/* Operational Logic Exception Handling Callout Block */}
            {actionError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 tracking-wide">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono uppercase text-[9px] font-bold text-rose-500">Pipeline Mitigation Error:</span>
                  <span className="text-[11px] font-medium leading-normal">{actionError}</span>
                </div>
              </div>
            )}

            {/* Sub Section: High-Privilege Institutional Disbursal Triggers */}
            {canDisburse && (
              <div className="border-t border-slate-900 pt-4">
                <button 
                  onClick={handleDisburse} 
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-white text-xs font-extrabold text-slate-950 font-mono uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer text-center"
                >
                  <Landmark size={13} />
                  Authorize Capital Settlement (Disburse)
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}