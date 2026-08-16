import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { listLoans } from "./api.js";
import { formatKes } from "../../lib/formatters.js";
import LoanApplicationModal from "./LoanApplicationModal.jsx";
import LoanDetailPanel from "./LoanDetailPanel.jsx";

const STATUS_COLORS = {
  pending_appraisal: "text-slate-400",
  pending_guarantors: "text-brand-orange-400",
  approved: "text-brand-emerald-500",
  disbursed: "text-brand-emerald-500",
  repaying: "text-brand-emerald-500",
  closed: "text-slate-400",
  defaulted: "text-red-400",
  rejected: "text-red-400",
};

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myWalletId, setMyWalletId] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const refresh = () => {
    setLoading(true);
    listLoans().then(({ data }) => setLoans(data.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    apiClient.get("/wallets").then(({ data }) => {
      const memberWallet = data.data.find((w) => w.wallet_type === "member");
      if (memberWallet) setMyWalletId(memberWallet.id);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Loans</h1>
        <button
          className="btn-accent text-sm"
          disabled={!myWalletId}
          onClick={() => setShowApplyModal(true)}
        >
          Apply for a loan
        </button>
      </div>

      <div className="glass-panel divide-y divide-white/5">
        {loading ? (
          <p className="p-4 text-slate-400 text-sm">Loading…</p>
        ) : loans.length === 0 ? (
          <p className="p-4 text-slate-400 text-sm">No loans yet.</p>
        ) : (
          loans.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLoanId(l.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div>
                <p className="text-white">{formatKes(l.principal)}</p>
                <p className="text-slate-500 text-xs">{l.term_months} months · {l.interest_method.replace("_", " ")}</p>
              </div>
              <span className={`text-sm capitalize ${STATUS_COLORS[l.status] || "text-slate-400"}`}>
                {l.status.replace("_", " ")}
              </span>
            </button>
          ))
        )}
      </div>

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