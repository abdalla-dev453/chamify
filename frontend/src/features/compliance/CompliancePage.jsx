import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, FileSpreadsheet, RefreshCw, Download } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatDate } from "../../lib/formatters.js";

export default function CompliancePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get("/compliance/audit-log")
      .then(({ data }) => setLogs(data.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Compliance &amp; Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Regulatory reports and a record of system-level changes.</p>
        </div>
        <button className="btn-dark">
          <Download size={14} />
          Generate Report
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-brand-green-600" />
            <h2 className="text-base font-bold text-slate-900">Audit Log</h2>
          </div>
          <span className="badge-slate">{loading || error ? "—" : logs.length} entries</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-400">Loading audit log…</p>
          </div>
        ) : error ? (
          <div className="py-14 flex flex-col items-center justify-center text-center px-6">
            <ShieldAlert size={20} className="text-rose-400 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Access restricted</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Viewing the audit trail requires elevated group administrator privileges.
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center px-6">
            <ShieldCheck size={20} className="text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No audit records yet</p>
            <p className="text-xs text-slate-400 mt-1">Ledger changes for this tenant will be logged here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {logs.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{l.action}</td>
                  <td className="px-5 py-3.5 text-right text-slate-400">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}