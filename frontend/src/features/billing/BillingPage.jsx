import { useEffect, useState } from "react";
import { 
  CreditCard, 
  PackageOpen, 
  RefreshCw, 
  Check, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  AlertCircle 
} from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [upgradingId, setUpgradingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        apiClient.get("/billing/plans"),
        apiClient.get("/billing/subscription")
      ]);

      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.data?.data || []);
      }
      if (subRes.status === "fulfilled") {
        setCurrentSub(subRes.value.data?.data || null);
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
      setError("Unable to load billing details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    setUpgradingId(planId);
    try {
      const { data } = await apiClient.post("/billing/subscribe", {
        plan_id: planId,
        billing_cycle: isAnnual ? "annual" : "monthly"
      });
      
      if (data?.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
      } else {
        await fetchBillingData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to initiate subscription change.");
    } finally {
      setUpgradingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription &amp; Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your workspace tier, usage limits, and platform billing.</p>
        </div>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              !isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Annual
            <span className="badge-green text-[10px] py-0 px-1.5">Save 15%</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-600">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Subscription Banner */}
      {currentSub && (
        <div className="card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-ink-900 text-white relative overflow-hidden shadow-panel">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Zap size={180} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Tier
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Renews: {currentSub.current_period_end ? new Date(currentSub.current_period_end).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {currentSub.plan_name || "Standard Workspace"}
                <ShieldCheck size={18} className="text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-300 max-w-lg">
                Your workspace is active. You have full access to current financial ledgers, automated reconciliation, and member access routes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-right min-w-[140px]">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Monthly Charge</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {formatKes(currentSub.amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 card">
            <RefreshCw size={20} className="animate-spin text-brand-green-600" />
            <p className="text-xs font-medium text-slate-400">Loading plan options…</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-16 card flex flex-col items-center justify-center text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <PackageOpen size={20} />
            </div>
            <p className="text-base font-bold text-slate-700">No subscription plans configured</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Billing tiers will appear here once configured by the platform administrator.
            </p>
          </div>
        ) : (
          plans.map((p) => {
            const isCurrent = currentSub?.plan_id === p.id;
            const price = isAnnual && p.annual_price ? p.annual_price / 12 : p.monthly_price;

            return (
              <div
                key={p.id}
                className={`card p-6 flex flex-col justify-between transition-all duration-200 relative ${
                  p.is_popular ? "border-brand-orange-500 ring-2 ring-brand-orange-500/15 shadow-panel" : ""
                }`}
              >
                {p.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles size={11} /> Recommended
                  </div>
                )}

                <div>
                  {/* Title & Icon */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.description || "Complete chama management tier."}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <CreditCard size={15} />
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="mt-6 pb-6 border-b border-brand-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {price ? formatKes(price) : "Free"}
                      </span>
                      {price > 0 && <span className="text-xs font-semibold text-slate-400">/ mo</span>}
                    </div>
                    {isAnnual && price > 0 && (
                      <p className="text-[11px] text-brand-green-700 font-semibold mt-1">
                        Billed annually ({formatKes(p.annual_price || price * 12)}/yr)
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="py-6 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                    <ul className="space-y-2.5">
                      {(p.features || [
                        "Automated Ledger Sync",
                        "M-Pesa B2C & C2B Callbacks",
                        "Up to 50 Members",
                        "Exportable PDF/Excel Statements"
                      ]).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-green-100 text-brand-green-700">
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call To Action */}
                <button
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={isCurrent || upgradingId === p.id}
                  className={`w-full py-2.5 mt-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : p.is_popular
                      ? "btn-primary"
                      : "btn-outline"
                  }`}
                >
                  {upgradingId === p.id ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Processing…
                    </>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    <>
                      Upgrade to {p.name}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}