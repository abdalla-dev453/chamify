import { useEffect, useState } from "react";
import { Smartphone, RefreshCw, Receipt } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes, formatDate } from "../../lib/formatters.js";

// The savings-target goal isn't backed by an endpoint yet — shown as an
// illustrative annual milestone until that config is exposed by the API.
const SAVINGS_TARGET = 150000;

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/wallets")
      .then(({ data }) => {
        const list = data.data || [];
        setWallets(list);
        const memberWallet = list.find((w) => w.wallet_type === "member") || list[0];
        if (memberWallet) {
          return apiClient.get(`/wallets/${memberWallet.id}/statement`).then(({ data: sData }) => {
            setEntries((sData.data || []).slice(0, 6));
          });
        }
      })
      .catch((err) => console.error("Wallet data fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const memberWallet = wallets.find((w) => w.wallet_type === "member") || wallets[0];
  const savingsWallet = wallets.find((w) => w.wallet_type === "savings" || w.wallet_type === "group") || wallets[1];
  const savingsBalance = Number(savingsWallet?.balance || 0);
  const progressPct = Math.min(100, Math.round((savingsBalance / SAVINGS_TARGET) * 100));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Wallet &amp; Savings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal contributions and track your financial goals.We got you covered at Chamify.</p>
        </div>
        <button className="btn-primary">
          <Smartphone size={14} />
          Contribute via M-Pesa
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Available Wallet Balance</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : formatKes(memberWallet?.balance || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ready for transfer or loan repayment.</p>
          <div className="flex items-center gap-2 mt-4">
            <button className="btn-dark">Withdraw</button>
            <button className="btn-outline">Transfer to Savings</button>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Savings Shares</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : formatKes(savingsBalance)}
          </p>
          <p className="text-xs font-semibold text-brand-green-600 mt-1">↗ +5.2% this year</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dividend Earned</span>
            <span className="text-sm font-bold text-brand-green-600">
              {loading ? "—" : formatKes((wallets.find((w) => w.wallet_type === "dividend")?.balance) || 4200)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings target */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Annual Savings Target</h2>
            <p className="text-xs text-slate-400 mt-0.5">Track your progress towards the group mandatory minimum.</p>
          </div>
          <p className="text-sm font-bold text-slate-900 shrink-0">
            {formatKes(savingsBalance)} <span className="text-slate-400 font-medium">/ {formatKes(SAVINGS_TARGET)}</span>
          </p>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400 font-medium">
          <span>{progressPct}% Completed</span>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-brand-border">
          <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
          <button className="text-xs font-semibold text-brand-green-700 hover:underline cursor-pointer">View All</button>
        </div>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-400">Loading your transactions…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-center px-6">
            <Receipt size={20} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No transactions yet</p>
            <p className="text-xs text-slate-400">Contributions and transfers will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description / Ref</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(e.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 capitalize">{(e.source_type || "entry").replace(/_/g, " ")}</p>
                    {e.mpesa_transaction_id && (
                      <p className="text-[11px] text-slate-400 font-mono">{e.mpesa_transaction_id}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 capitalize">{e.entry_type}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge-green">Completed</span>
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${
                      e.entry_type === "credit" ? "text-brand-green-600" : "text-slate-700"
                    }`}
                  >
                    {e.entry_type === "credit" ? "+" : "-"}
                    {formatKes(e.amount).replace("KES", "").trim()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}