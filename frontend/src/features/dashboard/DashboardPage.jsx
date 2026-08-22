import { useEffect, useState } from "react";
import { 
  Landmark, 
  TrendingUp, 
  Users, 
  FileUp, 
  HandCoins, 
  MessageSquareText, 
  MoreVertical, 
  AlertTriangle,
  X,
  Send,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { listLoans } from "../loans/api.js";
import StatCard from "../../components/StatCard.jsx";
import MiniLineChart from "../../components/MiniLineChart.jsx";
import { formatKes } from "../../lib/formatters.js";

const ACTIVE_LOAN_STATUSES = ["disbursed", "repaying"];

const SAMPLE_TREND = [3.2, 3.35, 3.45, 3.65, 3.9, 4.2];
const SAMPLE_TREND_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function DashboardPage() {
  const [wallets, setWallets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active modal state: 'manual_entry' | 'sms' | null
  const [activeModal, setActiveModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Form State for Manual Entry
  const [entryForm, setEntryForm] = useState({
    wallet_id: "",
    amount: "",
    entry_type: "deposit",
    description: ""
  });

  // Form State for Broadcast SMS
  const [smsForm, setSmsForm] = useState({
    recipient_group: "all",
    message: ""
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [w, l, tx] = await Promise.allSettled([
        apiClient.get("/wallets"),
        listLoans(),
        apiClient.get("/mpesa/reconciliation-feed")
      ]);

      if (w.status === "fulfilled") setWallets(w.value.data?.data || []);
      if (l.status === "fulfilled") setLoans(l.value.data?.data || []);
      if (tx.status === "fulfilled") setTransactions(tx.value.data?.data || []);
    } catch (err) {
      console.error("Overview data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setFeedback({ type: "", message: "" });
    setEntryForm({ wallet_id: "", amount: "", entry_type: "deposit", description: "" });
    setSmsForm({ recipient_group: "all", message: "" });
  };

  // Submit Handler for Manual Entry
  const handlePostManualEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.wallet_id || !entryForm.amount) {
      setFeedback({ type: "error", message: "Please select a member wallet and enter an amount." });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await apiClient.post("/ledger/manual-entry", {
        wallet_id: entryForm.wallet_id,
        amount: parseFloat(entryForm.amount),
        type: entryForm.entry_type,
        description: entryForm.description || "Manual ledger adjustment"
      });

      setFeedback({ type: "success", message: "Manual ledger entry posted successfully!" });
      setTimeout(() => {
        closeModal();
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to post manual ledger entry."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Handler for Broadcast SMS
  const handleSendSms = async (e) => {
    e.preventDefault();
    if (!smsForm.message.trim()) {
      setFeedback({ type: "error", message: "Please enter an SMS message content." });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await apiClient.post("/communications/send-sms", {
        recipient_group: smsForm.recipient_group,
        message: smsForm.message
      });

      setFeedback({ type: "success", message: "SMS alert broadcast initiated successfully!" });
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to send SMS broadcast."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalSavings = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const activeLoans = loans.filter((l) => ACTIVE_LOAN_STATUSES.includes(l.status));
  const outstandingLoans = activeLoans.reduce((sum, l) => sum + Number(l.principal || l.amount || 0), 0);

  const reconFeed = transactions.length > 0 ? transactions.slice(0, 5) : [
    { ref: "QWR23X9Y", name: "Msema Abdalla", amount: 5000, time: "10:42 AM", matched: true },
    { ref: "QWR24Z1A", name: "Ahmad Fimbo", amount: 2500, time: "09:15 AM", matched: true },
    { ref: "QWR19L8B", name: "Unknown Sender", amount: null, time: "Yesterday", matched: false },
  ];

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time ledger and liquidity status.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setActiveModal("manual_entry")} className="btn-outline text-xs">
            <FileUp size={14} />
            Post Manual Entry
          </button>
          <button onClick={() => setActiveModal("sms")} className="btn-outline text-xs">
            <MessageSquareText size={14} />
            Send SMS Alert
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Group Savings"
          value={loading ? "—" : formatKes(totalSavings)}
          icon={Landmark}
          tone="green"
          trend="+4.2%"
        />
        <StatCard
          label="Outstanding Loans"
          value={loading ? "—" : formatKes(outstandingLoans)}
          icon={TrendingUp}
          tone="rose"
          trend={`${activeLoans.length} Active`}
        />
        <StatCard
          label="Active Members"
          value={loading ? "—" : `${wallets.length} Members`}
          icon={Users}
          tone="blue"
          trend="100% Paid"
        />
      </div>

      {/* Chart + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-slate-900">Savings Growth</h2>
              <p className="text-xs text-slate-400 mt-0.5">Trailing 6 months · platform trends</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="mt-4 flex-1 flex items-center">
            <MiniLineChart points={SAMPLE_TREND} labels={SAMPLE_TREND_LABELS} />
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-green-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">Live Recon Feed</h2>
            </div>
            <span className="badge-slate">M-PESA</span>
          </div>

          <div className="flex-1 divide-y divide-brand-border -mx-6">
            {reconFeed.map((tx, idx) => (
              <div key={tx.ref || idx} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-mono font-semibold text-slate-500 truncate">{tx.ref}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{tx.name || "M-Pesa Sender"}</p>
                </div>
                <div className="text-right shrink-0">
                  {tx.matched && tx.amount ? (
                    <p className="text-sm font-bold text-brand-green-700">+{formatKes(tx.amount)}</p>
                  ) : (
                    <span className="badge-rose">
                      <AlertTriangle size={10} />
                      Unmatched
                    </span>
                  )}
                  <p className="text-[11px] text-slate-400 mt-0.5">{tx.time || "Just now"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {activeModal === "manual_entry" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-brand-border p-6 shadow-panel space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <FileUp size={18} className="text-brand-green-600" />
                <h3 className="text-base font-bold text-slate-900">Post Manual Ledger Entry</h3>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {feedback.message && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePostManualEntry} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Member / Wallet</label>
                <select
                  value={entryForm.wallet_id}
                  onChange={(e) => setEntryForm({ ...entryForm, wallet_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-green-500/20 font-medium text-slate-800"
                  required
                >
                  <option value="">-- Select Member Wallet --</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.user_name || w.owner_name || `Wallet #${w.id}`} ({formatKes(w.balance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entry Type</label>
                  <select
                    value={entryForm.entry_type}
                    onChange={(e) => setEntryForm({ ...entryForm, entry_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800"
                  >
                    <option value="deposit">Deposit / Contribution</option>
                    <option value="withdrawal">Withdrawal / Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={entryForm.amount}
                    onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Cash payment at monthly meeting"
                  value={entryForm.description}
                  onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn-outline py-2">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary py-2 flex items-center gap-1.5">
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <FileUp size={14} />}
                  {submitting ? "Posting..." : "Post Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Alert Broadcast Modal */}
      {activeModal === "sms" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-brand-border p-6 shadow-panel space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareText size={18} className="text-brand-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Broadcast SMS Alert</h3>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {feedback.message && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendSms} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipients Group</label>
                <select
                  value={smsForm.recipient_group}
                  onChange={(e) => setSmsForm({ ...smsForm, recipient_group: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800"
                >
                  <option value="all">All Group Members ({wallets.length})</option>
                  <option value="active_borrowers">Active Borrowers</option>
                  <option value="defaulters">Overdue Loan Members</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Reminder: Chama monthly contribution is due this Friday by 5:00 PM."
                  value={smsForm.message}
                  onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800 resize-none"
                  maxLength={160}
                  required
                />
                <p className="text-[10px] text-slate-400 text-right mt-1">
                  {smsForm.message.length} / 160 characters
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn-outline py-2">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary py-2 flex items-center gap-1.5">
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? "Broadcasting..." : "Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}