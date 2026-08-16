import { useEffect, useState } from "react";
import { HandCoins, Layers, TrendingUp, Wallet, ArrowUpRight, ShieldAlert } from "lucide-react";
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
      .catch((err) => console.error("Database connection failure:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const memberWallet = wallets.find((w) => w.wallet_type === "member");

  return (
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          Account Overview
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Authorized Session:</span>
          <span className="font-mono">{user?.full_name || "System Member"}</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-300">Status:</span>
          <span className="text-orange-500 font-mono font-semibold">Active Node</span>
        </div>
      </div>

      {/* Structured Asset Metrics Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          label="Individual Wallet Equity" 
          value={loading ? "—" : formatKes(memberWallet?.balance || 0)} 
          icon={Wallet}
          isSecondary={false} 
        />
        <StatCard 
          label="Assigned Group Nodes" 
          value={loading ? "—" : String(wallets.length)} 
          icon={Layers}
          isSecondary={true}
        />
        <StatCard 
          label="Aggregate Ledger Valuation" 
          value={loading ? "—" : formatKes(totalBalance)} 
          icon={TrendingUp}
          isSecondary={true}
        />
      </div>

      {/* System Ledger Ledger Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        
        {/* Table Control Registry Title */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins size={14} className="text-orange-500" />
            <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
              Asset Node Registry
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Total Record Count: {wallets.length}
          </span>
        </div>

        {/* Core Conditional Information Grid */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-slate-800 border-t-orange-500 animate-spin" />
            <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Querying Data Records...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="py-12 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 bg-slate-900/20">
            <ShieldAlert size={20} className="text-slate-600 mb-1.5" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Zero Records Returned</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
              No financial nodes are assigned to this credentials portfolio. System administrator authorization required.
            </p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden divide-y divide-slate-800">
            {wallets.map((w) => (
              <div 
                key={w.id} 
                className="p-3.5 flex items-center justify-between gap-4 bg-slate-950 transition-colors duration-150 hover:bg-slate-900/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-400">
                    <Wallet size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {w.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono mt-0.5">
                      Type: {w.wallet_type ? w.wallet_type.replace("_", " ") : "Base Asset"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right shrink-0">
                  <p className="text-sm font-bold tracking-tight text-white font-mono">
                    {formatKes(w.balance || 0)}
                  </p>
                  <ArrowUpRight size={14} className="text-slate-700" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
