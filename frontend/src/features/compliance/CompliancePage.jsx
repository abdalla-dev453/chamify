import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { formatDate } from "../../lib/formatters.js";

export default function CompliancePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get("/compliance/audit-log")
      .then(({ data }) => setLogs(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Reports & Audit Log</h1>
      <div className="glass-panel p-6">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : error ? (
          <p className="text-slate-400 text-sm">This view requires group admin access.</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-400 text-sm">No audit activity yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((l, i) => (
              <div key={i} className="py-2 flex justify-between text-sm">
                <span className="text-white">{l.action}</span>
                <span className="text-slate-500">{formatDate(l.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}