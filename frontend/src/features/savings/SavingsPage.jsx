import { useEffect, useState } from "react";
import { PiggyBank, Calendar, RefreshCw, Layers } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function SavingsPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/savings/schedules")
      .then(({ data }) => setSchedules(data.data || []))
      .catch((err) => console.error("Savings schedule fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Savings Schedules</h1>
        <p className="text-sm text-slate-600 mt-0.5">Contribution frequencies and target amounts for your group.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 card">
            <RefreshCw size={16} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-500">Loading savings schedules…</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full py-14 card flex flex-col items-center justify-center text-center p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 mb-3">
              <Layers size={16} />
            </div>
            <p className="text-sm font-semibold text-slate-600">No active schedules</p>
            <p className="text-xs text-slate-500 mt-1">Savings contribution frequencies will appear here once configured.</p>
          </div>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="card p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-green-50 text-brand-green-600">
                    <PiggyBank size={14} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar size={11} className="text-slate-500" />
                  <span className="badge-slate">{s.frequency ? s.frequency.replace(/_/g, " ") : "variable"}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-brand-border flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Target Amount</span>
                <span className="text-base font-bold text-slate-900">{formatKes(s.expected_amount || 0)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}