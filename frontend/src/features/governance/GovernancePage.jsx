import { useEffect, useState } from "react";
import { Vote, ShieldCheck, HeartHandshake, Calendar, Download, FileBarChart, Eye, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../../lib/apiClient.js";
import { formatKes, formatDate } from "../../lib/formatters.js";

const WELFARE_BADGE = {
  approved: "badge-green",
  under_review: "badge-blue",
  pending: "badge-blue",
  rejected: "badge-rose",
};

export default function GovernancePage() {
  const [welfare, setWelfare] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voteNotice, setVoteNotice] = useState("");

  useEffect(() => {
    Promise.all([apiClient.get("/governance/welfare-requests"), apiClient.get("/governance/votes")])
      .then(([w, v]) => {
        setWelfare(w.data.data || []);
        setVotes(v.data.data || []);
      })
      .catch((err) => console.error("Governance data fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance &amp; Compliance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Oversee AGM voting, welfare requests, and generate SASRA-compliant reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <Download size={14} />
            Member Statements
          </button>
          <Link to="/compliance" className="btn-dark">
            <FileBarChart size={14} />
            SASRA Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        {/* AGM motions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Vote size={16} className="text-brand-green-600" />
              <h2 className="text-base font-bold text-slate-900">Active AGM Motions</h2>
            </div>
            {votes.length > 0 && <span className="badge-blue">{votes.length} Pending</span>}
          </div>

          {voteNotice && (
            <p className="mb-3 text-xs font-semibold text-slate-500 bg-slate-50 border border-brand-border rounded-lg px-3 py-2">
              {voteNotice}
            </p>
          )}

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading motions…</p>
          ) : votes.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
              <ShieldCheck size={18} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No open motions</p>
              <p className="text-xs text-slate-400">New AGM motions will appear here for voting.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {votes.map((v) => (
                <div key={v.id} className="rounded-xl border border-brand-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{v.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <Calendar size={12} />
                        <span>Closes {formatDate(v.closes_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setVoteNotice("Ballot casting isn't available yet — this motion is being tracked for the next AGM release.")}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        Vote For
                      </button>
                      <button
                        onClick={() => setVoteNotice("Ballot casting isn't available yet — this motion is being tracked for the next AGM release.")}
                        className="btn-muted py-1.5 px-3 text-xs"
                      >
                        Vote Against
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance hub shortcut */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-brand-green-600" />
            <h2 className="text-base font-bold text-slate-900">Compliance Hub</h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 border border-brand-border p-4">
              <p className="text-sm font-bold text-slate-800">SASRA Reports</p>
              <p className="text-xs text-slate-400 mt-1">Generate automated regulatory compliance documents.</p>
              <Link to="/compliance" className="btn-dark w-full mt-3 justify-center">
                <FileBarChart size={13} />
                Generate Report
              </Link>
            </div>

            <div className="rounded-xl bg-slate-50 border border-brand-border p-4">
              <p className="text-sm font-bold text-slate-800">Audit Trail</p>
              <p className="text-xs text-slate-400 mt-1">View system-level changes and administrative actions.</p>
              <Link to="/compliance" className="btn-outline w-full mt-3 justify-center">
                View Logs
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Welfare fund requests */}
      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-2">
            <HeartHandshake size={16} className="text-brand-green-600" />
            <h2 className="text-base font-bold text-slate-900">Welfare Fund Requests</h2>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading requests…</p>
        ) : welfare.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
            <HeartHandshake size={18} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No welfare requests</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Amount (KES)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {welfare.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{String(w.id).slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 capitalize">{w.category}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-800">{formatKes(w.amount_requested)}</td>
                  <td className="px-5 py-3.5">
                    <span className={WELFARE_BADGE[w.status] || "badge-slate"}>
                      {w.status ? w.status.replace(/_/g, " ") : "pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}