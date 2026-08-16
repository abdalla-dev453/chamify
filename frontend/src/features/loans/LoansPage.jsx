import { useEffect, useState } from "react";
import { Landmark, FileSpreadsheet, Plus, RefreshCw } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { listLoans } from "./api.js";
import { formatKes } from "../../lib/formatters.js";
import LoanApplicationModal from "./LoanApplicationModal.jsx";
import LoanDetailPanel from "./LoanDetailPanel.jsx";

// Purely non-vibe corporate status matrix formatting
const STATUS_STYLES = {
  pending_appraisal: "bg-slate-900 text-slate-400 border-slate-800",
  pending_guarantors: "bg-slate-900 text-orange-400 border-orange-500/10",
  approved: "bg-slate-100 text-slate-950 border-white",
  disbursed: "bg-slate-900 text-slate-200 border-slate-800",
  repaying: "bg-slate-900 text-slate-300 border-slate-800",
  closed: "bg-slate-950 text-slate-600 border-slate-900/60",
  defaulted: "bg-rose-950/20 text-rose-400 border-rose-500/10",
  rejected: "bg-slate-950 text-rose-500/60 border-slate-900",
};

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myWalletId, setMyWalletId] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const refresh = () => {
    setLoading(true);
    listLoans()
      .then(({ data }) => setLoans(data.data))
      .catch((err) => console.error("Database connection failure on metrics pull:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    apiClient.get("/wallets").then(({ data }) => {
      const memberWallet = data.data.find((w) => w.wallet_type === "member");
      if (memberWallet) setMyWalletId(memberWallet.id);
    });
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
            Credit Ledger Registers
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Target Segment:</span>
            <span className="font-mono text-orange-700">Debt Tranches & Amortization States</span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-slate-500">State:</span>
            <span className="text-orange-500 font-mono font-semibold">Live Audit</span>
          </div>
        </div>

        {/* Top Operational Placement Trigger */}
        <button
          disabled={!myWalletId}
          onClick={() => setShowApplyModal(true)}
          className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-slate-100 hover:bg-white text-xs font-bold text-slate-950 font-mono uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Plus size={14} className="text-slate-900 stroke-[3]" />
          Execute Credit Request
        </button>
      </div>

      {/* Main Structural Table List Panel Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        
        {/* Registry Table Action Bar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={14} className="text-orange-500" />
            <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
              Amortization Ledger Tranches
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Record Pool Count: {loading ? "0" : loans.length} Logged
          </span>
        </div>

        {/* Dynamic Condition Block Render Array */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-orange-500" />
            <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Re-indexing Credit Streams...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="py-12 border border-slate-900 border-dashed rounded-b-xl flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
            <Landmark size={20} className="text-slate-700 mb-2" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider block text-slate-400">Zero Asset Claims Filed</span>
            <span className="text-[11px] text-slate-600 mt-0.5">No live amortization requests match this credentials index query parameters.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 bg-slate-950">
            {loans.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLoanId(l.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition-colors duration-100 group gap-4"
              >
                {/* Metric Item Description Block */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-orange-500 group-hover:border-orange-500/20 group-hover:bg-orange-500/5 transition-all duration-150">
                    <Landmark size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-bold font-mono tracking-tight text-white select-all group-hover:text-orange-500 transition-colors">
                      {formatKes(l.principal || 0)}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase text-slate-500">
                      <span>{l.term_months || 0} Month Term</span>
                      <span>•</span>
                      <span className="tracking-wide">
                        Method: {l.interest_method ? l.interest_method.replace("_", " ") : "Standard Allocation"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Execution Badge Tag */}
                <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border tracking-wider shrink-0 transition-all duration-150 ${STATUS_STYLES[l.status] || "bg-slate-900 text-slate-400 border-slate-800"}`}>
                  {l.status ? l.status.replace("_", " ") : "Evaluation State"}
                </span>

              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer Overlay Gateway Controllers */}
      {showApplyModal && myWalletId && (
        <LoanApplicationModal
          walletId={myWalletId}
          onClose={() => setShowApplyModal(false)}
          onApplied={refresh}
        />
      )}

      {selectedLoanId && (
        <LoanDetailPanel
          loanId={selectedLoanId}
          onClose={() => setSelectedLoanId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
