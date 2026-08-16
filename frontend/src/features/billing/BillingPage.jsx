import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/billing/plans").then(({ data }) => setPlans(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Subscription plans</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="text-slate-400 text-sm">No plans configured yet — seed SubscriptionPlan rows.</p>
        ) : (
          plans.map((p) => (
            <div key={p.id} className="glass-panel p-5">
              <p className="text-white font-medium">{p.name}</p>
              <p className="text-slate-400 text-xs capitalize mt-1">{p.billing_model.replace("_", " ")}</p>
              {p.monthly_price && (
                <p className="text-brand-emerald-500 mt-3 font-semibold">{formatKes(p.monthly_price)}/mo</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}