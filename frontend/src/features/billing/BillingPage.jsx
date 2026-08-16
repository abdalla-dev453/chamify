import { useEffect, useState } from "react";
import { CreditCard, Database, Terminal, ShieldAlert } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/billing/plans")
      .then(({ data }) => setPlans(data.data))
      .catch((err) => console.error("Database billing registry lookup failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          Subscription Matrices
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Target Module:</span>
          <span className="font-mono text-orange-700">Tenant Tier Allocation & Billing Plans</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-500">Status:</span>
          <span className="text-orange-500 font-mono font-semibold">Live Registry</span>
        </div>
      </div>

      {/* Main Structural Plan Layout Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950">
            <div className="h-4 w-4 rounded-full border-2 border-slate-800 border-t-orange-500 animate-spin" />
            <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Querying Subscription Tiers...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-6 bg-slate-900/20">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-500 mb-3">
              <Terminal size={14} />
            </div>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider font-mono">No Subscription Schema Detected</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              The billing registry returned an empty array. Execute system database seed workflows to populate 
              <code className="text-orange-400 bg-slate-900 px-1 py-0.5 rounded font-mono ml-1">SubscriptionPlan</code> tables.
            </p>
          </div>
        ) : (
          plans.map((p) => (
            <div 
              key={p.id} 
              className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm transition-colors duration-150 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                {/* Header Information */}
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-bold tracking-tight text-white">
                    {p.name}
                  </p>
                  <div className="p-1 rounded border bg-slate-900 border-slate-800 text-slate-500">
                    <CreditCard size={12} />
                  </div>
                </div>
                
                {/* Billing Model Metadata Label */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                    Model:
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/60">
                    {p.billing_model ? p.billing_model.replace("_", " ") : "Standard Allocation"}
                  </span>
                </div>
              </div>

              {/* Pricing Allocation block */}
              {p.monthly_price && (
                <div className="mt-6 pt-4 border-t border-slate-900 flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono tracking-tight text-orange-500">
                    {formatKes(p.monthly_price)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">
                    / mo
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
