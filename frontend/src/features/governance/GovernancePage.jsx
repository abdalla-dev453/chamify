import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { formatKes, formatDate } from "../../lib/formatters.js";

export default function GovernancePage() {
  const [welfare, setWelfare] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/governance/welfare-requests"),
      apiClient.get("/governance/votes"),
    ])
      .then(([w, v]) => {
        setWelfare(w.data.data);
        setVotes(v.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Governance</h1>

      <div className="glass-panel p-6">
        <h2 className="text-white font-medium mb-4">Open AGM votes</h2>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : votes.length === 0 ? (
          <p className="text-slate-400 text-sm">No open votes right now.</p>
        ) : (
          votes.map((v) => (
            <div key={v.id} className="py-2 flex justify-between text-sm">
              <span className="text-white">{v.title}</span>
              <span className="text-slate-400">Closes {formatDate(v.closes_at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-white font-medium mb-4">Welfare requests</h2>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : welfare.length === 0 ? (
          <p className="text-slate-400 text-sm">No welfare requests yet.</p>
        ) : (
          welfare.map((w) => (
            <div key={w.id} className="py-2 flex justify-between text-sm">
              <span className="text-white capitalize">{w.category}</span>
              <span className="text-brand-emerald-500">{formatKes(w.amount_requested)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}