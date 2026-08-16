import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, FileSpreadsheet, RefreshCw } from "lucide-react";
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
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          System Auditing & Registry
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Security Target:</span>
          <span className="font-mono">Compliance & Protocol Activity Logs</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-300">Classification:</span>
          <span className="text-orange-500 font-mono font-semibold">Internal Audit Only</span>
        </div>
      </div>

      {/* Main Audit Trail Data Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        
        {/* Registry Table Toolbar */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={14} className="text-orange-500" />
            <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
              Immutable Action Log Records
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Record Count: {loading || error ? "0" : logs.length} Verified
          </span>
        </div>

        {/* Core Conditional Data Render Engine */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={14} className="text-slate-500 animate-spin" />
            <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Executing Compliance Pull...</p>
          </div>
        ) : error ? (
          <div className="py-12 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 bg-slate-900/10">
            <ShieldAlert size={20} className="text-rose-500/80 mb-2" />
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider font-mono">Access Privileges Revoked</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              This operational node requires elevated Group Administrator privileges to run schema index queries.
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 bg-slate-900/10">
            <ShieldCheck size={20} className="text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Registry Sandbox Empty</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Zero tracked ledger mutations recorded within this specific tenant environment context.
            </p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
            
            {/* Structural Table Column Headers */}
            <div className="grid grid-cols-3 gap-4 bg-slate-900/50 px-4 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">
              <div className="col-span-2">System Mutation Event</div>
              <div className="text-right">Timestamp Record</div>
            </div>

            {/* Event Records Looping Array */}
            <div className="divide-y divide-slate-800">
              {logs.map((l, i) => (
                <div 
                  key={i} 
                  className="grid grid-cols-3 gap-4 px-4 py-3 text-sm items-center hover:bg-slate-900/30 transition-colors duration-100"
                >
                  {/* Event Action Name Description */}
                  <div className="col-span-2 text-slate-200 font-semibold tracking-tight font-sans truncate">
                    {l.action}
                  </div>
                  
                  {/* Event Timestamps Metadata */}
                  <div className="text-right text-slate-400 text-xs font-mono select-all">
                    {formatDate(l.created_at)}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
