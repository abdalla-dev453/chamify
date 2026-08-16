import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function SavingsPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/savings/schedules").then(({ data }) => setSchedules(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Savings schedules</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : schedules.length === 0 ? (
          <p className="text-slate-400 text-sm">No savings schedules configured yet.</p>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="glass-panel p-5">
              <p className="text-white font-medium">{s.name}</p>
              <p className="text-slate-400 text-sm capitalize">{s.frequency.replace("_", " ")}</p>
              <p className="text-brand-emerald-500 mt-2 font-semibold">{formatKes(s.expected_amount)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}