import { useEffect, useState } from "react";
import { Vote, HeartHandshake, CheckSquare, Calendar, ShieldCheck } from "lucide-react";
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
      .catch((err) => console.error("Governance engine retrieval error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Corporate Metadata Header Block */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
          Governance & Resolution Hub
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Module Index:</span>
          <span className="font-mono">AGM Resolutions & Disbursement Requests</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-300">Auditing:</span>
          <span className="text-orange-500 font-mono font-semibold">Active Ledger Context</span>
        </div>
      </div>

      {/* Grid containing AGM Voting Registry & Welfare Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panel Block: Open AGM Ballots */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Vote size={14} className="text-orange-500" />
                <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
                  Active AGM Ballots
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Pending Action: {loading ? "0" : votes.length}
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-slate-800 border-t-orange-500 animate-spin" />
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Polling Ballots...</p>
              </div>
            ) : votes.length === 0 ? (
              <div className="py-8 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 bg-slate-900/10">
                <ShieldCheck size={16} className="text-slate-600 mb-1.5" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Registry Clean</p>
                <p className="text-[11px] text-slate-600 mt-0.5">No open legislative vectors or system ballots are pending resolution.</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden divide-y divide-slate-800">
                {votes.map((v) => (
                  <div key={v.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors duration-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare size={13} className="text-slate-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-200 truncate">{v.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono whitespace-nowrap">
                      <Calendar size={12} className="text-slate-600" />
                      <span>Closes {formatDate(v.closes_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Block: Welfare Allotment Requests */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake size={14} className="text-orange-500" />
                <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
                  Welfare Allocations
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Active Queries: {loading ? "0" : welfare.length}
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-slate-800 border-t-orange-500 animate-spin" />
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Syncing Welfare Schema...</p>
              </div>
            ) : welfare.length === 0 ? (
              <div className="py-8 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 bg-slate-900/10">
                <ShieldCheck size={16} className="text-slate-600 mb-1.5" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">No Claims Found</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Zero tracked member welfare distribution claims returned by database.</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden divide-y divide-slate-800">
                {welfare.map((w) => (
                  <div key={w.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors duration-100">
                    <span className="text-sm font-semibold text-slate-200 capitalize truncate">{w.category}</span>
                    <span className="text-sm font-bold text-orange-500 font-mono whitespace-nowrap">
                      {formatKes(w.amount_requested)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
