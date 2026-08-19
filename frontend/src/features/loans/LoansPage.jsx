import { useEffect, useState } from "react";
import { Landmark, Download, Plus, RefreshCw, FolderOpen } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { listLoans } from "./api.js";
import { formatKes, formatDate } from "../../lib/formatters.js";
import LoanApplicationModal from "./LoanApplicationModal.jsx";
import LoanDetailPanel from "./LoanDetailPanel.jsx";

const PENDING_STATUSES = ["pending_appraisal", "pending_guarantors", "approved"];
const ACTIVE_STATUSES = ["disbursed", "repaying"];
const MULTIPLIER = 3; // mirrors server/app/utils/calculators.py::max_loan_amount default

const STATUS_BADGE = {
  pending_appraisal: "badge-slate",
  pending_guarantors: "badge-amber",
  approved: "badge-blue",
  disbursed: "badge-green",
  repaying: "badge-green",
  closed: "badge-slate",
  defaulted: "badge-rose",
  rejected: "badge-rose",
};

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myWalletId, setMyWalletId] = useState(null);
  const [mySavings, setMySavings] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const refresh = () => {
    setLoading(true);
    listLoans()
      .then(({ data }) => setLoans(data.data || []))
      .catch((err) => console.error("Loan list fetch failed:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    apiClient.get("/wallets").then(({ data }) => {
      const memberWallet = (data.data || []).find((w) => w.wallet_type === "member");
      if (memberWallet) {
        setMyWalletId(memberWallet.id);
        setMySavings(Number(memberWallet.balance || 0));
      }
    });
  }, []);

  const pendingLoans = loans.filter((l) => PENDING_STATUSES.includes(l.status));
  const myActiveLoan = loans.find((l) => l.wallet_id === myWalletId && ACTIVE_STATUSES.includes(l.status));
  const maxLoan = mySavings * MULTIPLIER;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loan Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Oversee active loans, approve new requests, and manage guarantors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <Download size={14} />
            Export Report
          </button>
          <button disabled={!myWalletId} onClick={() => setShowApplyModal(true)} className="btn-dark">
            <Plus size={14} />
            Apply for Loan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Pending approvals */}
          <div className="card overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-brand-border">
              <h2 className="text-base font-bold text-slate-900">Pending Approvals</h2>
              {pendingLoans.length > 0 && <span className="badge-rose">{pendingLoans.length} Action Required</span>}
            </div>

            {loading ? (
              <div className="py-14 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-brand-green-600" />
                <p className="text-xs text-slate-400">Loading loans…</p>
              </div>
            ) : pendingLoans.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center gap-2 text-center px-6">
                <FolderOpen size={20} className="text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">No loans awaiting action</p>
                <p className="text-xs text-slate-400">New applications and guarantor requests will show up here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3">Amount (KES)</th>
                    <th className="px-5 py-3">Term</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {pendingLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-800">{formatKes(l.principal || 0)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{l.term_months || 0} months</td>
                      <td className="px-5 py-3.5">
                        <span className={STATUS_BADGE[l.status] || "badge-slate"}>
                          {l.status ? l.status.replace(/_/g, " ") : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLoanId(l.id)}
                          className="text-xs font-semibold text-brand-green-700 hover:underline cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Active loan */}
          {myActiveLoan && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Active Loan{myActiveLoan.id ? ` #${String(myActiveLoan.id).slice(0, 8).toUpperCase()}` : ""}
                </h2>
                <span className={STATUS_BADGE[myActiveLoan.status] || "badge-slate"}>
                  {myActiveLoan.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Principal Amount</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{formatKes(myActiveLoan.principal || 0)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Term</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{myActiveLoan.term_months} months</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Disbursed</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{formatDate(myActiveLoan.disbursed_at)}</p>
                </div>
              </div>

              <button onClick={() => setSelectedLoanId(myActiveLoan.id)} className="btn-primary mt-5 w-full">
                View Repayment Schedule
              </button>
            </div>
          )}
        </div>

        {/* Right column — apply for a loan */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900">Apply for a Loan</h2>
          <p className="text-xs text-slate-400 mt-1">Your current savings limit your maximum eligible borrowing amount.</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-slate-50 border border-brand-border p-3.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Current Savings</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{formatKes(mySavings)}</p>
            </div>
            <div className="rounded-xl bg-brand-green-50 border border-brand-green-100 p-3.5">
              <p className="text-[10px] font-semibold text-brand-green-700 uppercase tracking-wide">Max Loan ({MULTIPLIER}x)</p>
              <p className="text-sm font-bold text-brand-green-700 mt-1">{formatKes(maxLoan)}</p>
            </div>
          </div>

          <button
            disabled={!myWalletId}
            onClick={() => setShowApplyModal(true)}
            className="btn-dark w-full mt-5"
          >
            <Landmark size={14} />
            Continue to Application
          </button>
        </div>
      </div>

      {showApplyModal && myWalletId && (
        <LoanApplicationModal walletId={myWalletId} onClose={() => setShowApplyModal(false)} onApplied={refresh} />
      )}

      {selectedLoanId && (
        <LoanDetailPanel loanId={selectedLoanId} onClose={() => setSelectedLoanId(null)} onChanged={refresh} />
      )}
    </div>
  );
}