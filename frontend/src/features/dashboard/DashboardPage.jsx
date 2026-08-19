import { useEffect, useState } from "react";
import { Landmark, TrendingUp, Users, FileUp, HandCoins, MessageSquareText, MoreVertical, AlertTriangle } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { listLoans } from "../loans/api.js";
import StatCard from "../../components/StatCard.jsx";
import MiniLineChart from "../../components/MiniLineChart.jsx";
import { formatKes } from "../../lib/formatters.js";

const ACTIVE_LOAN_STATUSES = ["disbursed", "repaying"];

// Illustrative — no transactions-feed / members-roster endpoint exists yet on the
// backend, so these two panels are shown with representative sample data until
// those endpoints are wired up.
const SAMPLE_TREND = [3.2, 3.35, 3.45, 3.65, 3.9, 4.2];
const SAMPLE_TREND_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SAMPLE_RECON_FEED = [
  { ref: "QWR23X9Y", name: "Msema Abdalla", amount: 5000, time: "10:42 AM", matched: true },
  { ref: "QWR24Z1A", name: "Ahmad Fimbo", amount: 2500, time: "09:15 AM", matched: true },
  { ref: "QWR19L8B", name: "Unknown Sender", amount: null, time: "Yesterday", matched: false },
];

export default function DashboardPage() {
  const [wallets, setWallets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.get("/wallets"), listLoans()])
      .then(([w, l]) => {
        setWallets(w.data.data || []);
        setLoans(l.data.data || []);
      })
      .catch((err) => console.error("Overview data fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalSavings = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const activeLoans = loans.filter((l) => ACTIVE_LOAN_STATUSES.includes(l.status));
  const outstandingLoans = activeLoans.reduce((sum, l) => sum + Number(l.principal || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time ledger and liquidity status.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-outline">
            <FileUp size={14} />
            Post Manual Entry
          </button>
          <button className="btn-primary">
            <HandCoins size={14} />
            Disburse Approved Loan
          </button>
          <button className="btn-outline">
            <MessageSquareText size={14} />
            Send SMS Alert
          </button>
        </div>
      </div>

      {/* Metric tiles */}
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
          value={loading ? "—" : `${wallets.length} / ${wallets.length || 0}`}
          icon={Users}
          tone="blue"
          trend="100% Paid"
        />
      </div>

      {/* Chart + recon feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-slate-900">Savings Growth</h2>
              <p className="text-xs text-slate-400 mt-0.5">Trailing 6 months · sample trend</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="mt-4">
            <MiniLineChart points={SAMPLE_TREND} labels={SAMPLE_TREND_LABELS} />
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-green-500" />
              <h2 className="text-base font-bold text-slate-900">Live Recon Feed</h2>
            </div>
            <span className="badge-slate">M-PESA</span>
          </div>

          <div className="flex-1 divide-y divide-brand-border -mx-6">
            {SAMPLE_RECON_FEED.map((tx) => (
              <div key={tx.ref} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono font-semibold text-slate-500 truncate">{tx.ref}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{tx.name}</p>
                </div>
                <div className="text-right shrink-0">
                  {tx.matched ? (
                    <p className="text-sm font-bold text-brand-green-600">+{tx.amount.toLocaleString()}</p>
                  ) : (
                    <span className="badge-rose">
                      <AlertTriangle size={10} />
                      Unmatched
                    </span>
                  )}
                  <p className="text-[11px] text-slate-400 mt-0.5">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full text-center text-xs font-semibold text-brand-green-700 border border-dashed border-brand-green-200 rounded-lg py-2 hover:bg-brand-green-50 transition-colors cursor-pointer">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
}