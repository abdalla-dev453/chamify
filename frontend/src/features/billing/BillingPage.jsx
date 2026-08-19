import { useEffect, useState } from "react";
import { CreditCard, PackageOpen, RefreshCw } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/billing/plans")
      .then(({ data }) => setPlans(data.data || []))
      .catch((err) => console.error("Billing plans fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription &amp; Billing</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your tenant's current plan and available tiers.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 card">
            <RefreshCw size={16} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-400">Loading plans…</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-14 card flex flex-col items-center justify-center text-center p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-3">
              <PackageOpen size={16} />
            </div>
            <p className="text-sm font-semibold text-slate-600">No subscription plans configured</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Billing tiers will appear here once they're set up.</p>
          </div>
        ) : (
          plans.map((p) => (
            <div key={p.id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CreditCard size={13} />
                  </div>
                </div>
                <span className="badge-slate mt-2.5 inline-block">
                  {p.billing_model ? p.billing_model.replace(/_/g, " ") : "standard"}
                </span>
              </div>

              {p.monthly_price && (
                <div className="mt-6 pt-4 border-t border-brand-border flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">{formatKes(p.monthly_price)}</span>
                  <span className="text-xs font-semibold text-slate-400">/ mo</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}