import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/wallets").then(({ data }) => setWallets(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Wallets</h1>
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-left border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td className="p-4 text-slate-400" colSpan={3}>Loading…</td></tr>
            ) : (
              wallets.map((w) => (
                <tr key={w.id} className="text-white">
                  <td className="p-4">{w.name}</td>
                  <td className="p-4 text-slate-400 capitalize">{w.wallet_type.replace("_", " ")}</td>
                  <td className="p-4 text-right text-brand-emerald-500 font-medium">{formatKes(w.balance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}