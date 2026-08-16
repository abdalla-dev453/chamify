import { useEffect, useState } from "react";
import { Wallet, Layers, ShieldCheck, RefreshCw } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/wallets")
      .then(({ data }) => setWallets(data.data))
      .catch((err) => console.error("Database connection failure on wallets query:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          Ledger Node Registry
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Target Inventory:</span>
          <span className="font-mono">Account Clusters & System Node Balance Sheets</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-300">Auditing:</span>
          <span className="text-orange-500 font-mono font-semibold">Live Balances</span>
        </div>
      </div>

      {/* Main Tabular Container Block */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <table className="w-full text-sm border-collapse">
          
          {/* Strict Tabular Headers */}
          <thead className="bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4 text-left font-bold">Node Name</th>
              <th className="p-4 text-left font-bold">Classification Type</th>
              <th className="p-4 text-right font-bold">Liquid Balance</th>
            </tr>
          </thead>
          
          {/* Table Data Array Rows */}
          <tbody className="divide-y divide-slate-800 font-sans">
            {loading ? (
              <tr>
                <td className="p-8 text-center text-slate-500" colSpan={3}>
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-orange-500" />
                    <span className="font-mono text-xs uppercase tracking-wider">Syncing Wallets Ledger...</span>
                  </div>
                </td>
              </tr>
            ) : wallets.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-slate-500" colSpan={3}>
                  <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                    <Layers size={18} className="text-slate-700" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider block text-slate-400">Zero Balances Returned</span>
                    <span className="text-[11px] text-slate-600">No live financial nodes found mapping to this token sequence.</span>
                  </div>
                </td>
              </tr>
            ) : (
              wallets.map((w) => (
                <tr 
                  key={w.id} 
                  className="bg-slate-950 hover:bg-slate-900/40 transition-colors duration-100"
                >
                  {/* Wallet Label Name */}
                  <td className="p-4 text-slate-200 font-semibold tracking-tight">
                    <div className="flex items-center gap-2.5">
                      <Wallet size={13} className="text-slate-500" />
                      <span>{w.name}</span>
                    </div>
                  </td>
                  
                  {/* Wallet Category Tag */}
                  <td className="p-4 text-xs font-mono font-bold text-slate-400 capitalize">
                    {w.wallet_type ? w.wallet_type.replace("_", " ") : "Base System Account"}
                  </td>
                  
                  {/* Wallet Ledger Currency Metric */}
                  <td className="p-4 text-right text-orange-500 font-bold font-mono select-all">
                    {formatKes(w.balance || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
