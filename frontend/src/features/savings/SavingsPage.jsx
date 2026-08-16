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
      .then(({ data }) => setSchedules(data.data))
      .catch((err) => console.error("Database connection failure on savings query:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          Savings Matrix Control
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Target Protocol:</span>
          <span className="font-mono text-orange-700">Contribution Frequencies & Expected Target Bounds</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-500">Auditing:</span>
          <span className="text-orange-500 font-mono font-semibold">Live Configurations</span>
        </div>
      </div>

      {/* Main Structural Schedules Layout Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950">
            <RefreshCw size={14} className="animate-spin text-orange-500" />
            <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Querying Savings Allocations...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full py-12 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-6 bg-slate-900/20">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-500 mb-3">
              <Layers size={14} />
            </div>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider font-mono">No Active Target Schedules</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Zero tracked asset distribution frequencies or contribution structures returned by database queries.
            </p>
          </div>
        ) : (
          schedules.map((s) => (
            <div 
              key={s.id} 
              className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm transition-colors duration-150 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                {/* Header Metadata Section */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <PiggyBank size={13} />
                    </div>
                    <p className="text-sm font-bold tracking-tight text-white truncate">
                      {s.name}
                    </p>
                  </div>
                  
                  {/* Frequency Interval Micro Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar size={11} className="text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/60">
                      {s.frequency ? s.frequency.replace("_", " ") : "Variable Timeline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target expected asset valuation field */}
              <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                  Target Deposit Allocation:
                </span>
                <span className="text-base font-bold font-mono tracking-tight text-orange-500 select-all">
                  {formatKes(s.expected_amount || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
