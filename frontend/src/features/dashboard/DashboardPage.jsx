import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import StatCard from "../../components/StatCard.jsx";
import { formatKes } from "../../lib/formatters.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/wallets")
      .then(({ data }) => setWallets(data.data))
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const memberWallet = wallets.find((w) => w.wallet_type === "member");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Habari, {user?.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-slate-400 text-sm">Here's what's happening in your group.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="My wallet balance" value={loading ? "…" : formatKes(memberWallet?.balance)} />
        <StatCard label="Total wallets" value={loading ? "…" : wallets.length} accent="orange" />
        <StatCard label="Combined balance" value={loading ? "…" : formatKes(totalBalance)} />
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-white font-medium mb-4">Your wallets</h2>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : wallets.length === 0 ? (
          <p className="text-slate-400 text-sm">No wallets yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {wallets.map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{w.name}</p>
                  <p className="text-slate-500 text-xs capitalize">{w.wallet_type.replace("_", " ")}</p>
                </div>
                <p className="text-brand-emerald-500 font-medium">{formatKes(w.balance)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}