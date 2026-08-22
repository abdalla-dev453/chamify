import { useEffect, useState } from "react";
import { Smartphone, RefreshCw, Receipt, X, ArrowRightLeft, Download } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes, formatDate } from "../../lib/formatters.js";

const SAVINGS_TARGET = 150000;

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // 'mpesa' | 'withdraw' | 'transfer' | null
  const [formData, setFormData] = useState({ amount: "", phoneNumber: "", targetWalletId: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/wallets");
      const list = data.data || [];
      setWallets(list);

      const memberWallet = list.find((w) => w.wallet_type === "member") || list[0];
      if (memberWallet) {
        try {
          const { data: sData } = await apiClient.get(`/wallets/${memberWallet.id}/statement`);
          setEntries((sData.data || []).slice(0, 6));
        } catch (statementErr) {
          console.warn("Could not fetch statement:", statementErr);
          setEntries([]);
        }
      }
    } catch (err) {
      console.error("Wallet data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const memberWallet = wallets.find((w) => w.wallet_type === "member") || wallets[0];
  const savingsWallet = wallets.find((w) => w.wallet_type === "savings" || w.wallet_type === "group") || wallets[1];
  const savingsBalance = Number(savingsWallet?.balance || 0);
  const progressPct = Math.min(100, Math.round((savingsBalance / SAVINGS_TARGET) * 100));

  // --- Handlers for User Actions ---
  const handleMpesaDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/payments/stk-push", {
        amount: formData.amount,
        phone_number: formData.phoneNumber,
        wallet_id: memberWallet?.id
      });
      alert("STK push sent to your phone! Complete the PIN prompt.");
      setActionModal(null);
      fetchWalletData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to trigger M-Pesa payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post(`/wallets/${memberWallet?.id}/withdraw`, {
        amount: formData.amount
      });
      alert("Withdrawal request submitted successfully.");
      setActionModal(null);
      fetchWalletData();
    } catch (err) {
      alert(err.response?.data?.message || "Withdrawal failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/wallets/transfer", {
        source_wallet_id: memberWallet?.id,
        target_wallet_id: formData.targetWalletId || savingsWallet?.id,
        amount: formData.amount
      });
      alert("Transfer completed successfully.");
      setActionModal(null);
      fetchWalletData();
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Wallet &amp; Savings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your personal contributions and track your financial goals. We got you covered at Chamify.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ amount: "", phoneNumber: "", targetWalletId: "" });
            setActionModal("mpesa");
          }}
          className="btn-primary flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition"
        >
          <Smartphone size={14} />
          Contribute via M-Pesa
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6 border rounded-xl shadow-sm bg-white">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Available Wallet Balance</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : formatKes(memberWallet?.balance || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ready for transfer or loan repayment.</p>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => {
                setFormData({ amount: "", phoneNumber: "", targetWalletId: "" });
                setActionModal("withdraw");
              }}
              className="btn-dark px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition"
            >
              Withdraw
            </button>
            <button
              onClick={() => {
                setFormData({ amount: "", phoneNumber: "", targetWalletId: savingsWallet?.id || "" });
                setActionModal("transfer");
              }}
              className="btn-outline px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition"
            >
              Transfer to Savings
            </button>
          </div>
        </div>

        <div className="card p-6 border rounded-xl shadow-sm bg-white">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Savings Shares</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : formatKes(savingsBalance)}
          </p>
          <p className="text-xs font-semibold text-brand-green-600 mt-1">↗ +5.2% this year</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dividend Earned</span>
            <span className="text-sm font-bold text-brand-green-600">
              {loading ? "—" : formatKes(wallets.find((w) => w.wallet_type === "dividend")?.balance || 4200)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings Target */}
      <div className="card p-6 border rounded-xl shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Annual Savings Target</h2>
            <p className="text-xs text-slate-400 mt-0.5">Track your progress towards the group mandatory minimum.</p>
          </div>
          <p className="text-sm font-bold text-slate-900 shrink-0">
            {formatKes(savingsBalance)} <span className="text-slate-400 font-medium">/ {formatKes(SAVINGS_TARGET)}</span>
          </p>
        </div>
        <div className="progress-track w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div className="progress-fill bg-brand-green-600 h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400 font-medium">
          <span>{progressPct}% Completed</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card overflow-hidden border rounded-xl shadow-sm bg-white">
        <div className="p-5 flex items-center justify-between border-b border-brand-border">
          <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
          <button
            onClick={() => fetchWalletData()}
            className="text-xs font-semibold text-brand-green-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={12} /> Refresh
          </button>
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
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b">
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
                    <span className="badge-green text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>
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

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setActionModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            {actionModal === "mpesa" && (
              <form onSubmit={handleMpesaDeposit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">M-Pesa Contribution</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="254712345678"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition disabled:opacity-50"
                >
                  {submitting ? "Sending Push..." : "Prompt STK Push"}
                </button>
              </form>
            )}

            {actionModal === "withdraw" && (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Withdraw Funds</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </form>
            )}

            {actionModal === "transfer" && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Transfer to Savings</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition disabled:opacity-50"
                >
                  {submitting ? "Transferring..." : "Complete Transfer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}