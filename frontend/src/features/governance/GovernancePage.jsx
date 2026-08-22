import { useEffect, useState } from "react";
import { 
  Vote, 
  ShieldCheck, 
  HeartHandshake, 
  Calendar, 
  Download, 
  FileBarChart, 
  Eye, 
  ArrowRight,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Coins
} from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../../lib/apiClient.js";
import { formatKes, formatDate } from "../../lib/formatters.js";

const WELFARE_BADGE = {
  approved: "badge-green",
  under_review: "badge-blue",
  pending: "badge-amber",
  rejected: "badge-rose",
};

export default function GovernancePage() {
  const [welfare, setWelfare] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Voting & Interaction States
  const [votingId, setVotingId] = useState(null);
  const [votedMotions, setVotedMotions] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modal States
  const [showWelfareModal, setShowWelfareModal] = useState(false);
  const [selectedWelfare, setSelectedWelfare] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Welfare Request Form
  const [welfareForm, setWelfareForm] = useState({
    category: "medical",
    amount_requested: "",
    reason: "",
  });

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    setLoading(true);
    try {
      const [w, v] = await Promise.allSettled([
        apiClient.get("/governance/welfare-requests"),
        apiClient.get("/governance/votes")
      ]);

      if (w.status === "fulfilled") setWelfare(w.value.data?.data || []);
      if (v.status === "fulfilled") setVotes(v.value.data?.data || []);
    } catch (err) {
      console.error("Governance data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Ballot Casting
  const handleCastVote = async (motionId, decision) => {
    setVotingId(motionId);
    setFeedback({ type: "", message: "" });

    try {
      await apiClient.post(`/governance/votes/${motionId}/cast`, { decision });
      
      setVotedMotions((prev) => ({ ...prev, [motionId]: decision }));
      setFeedback({ type: "success", message: `Vote successfully recorded (${decision.toUpperCase()}).` });
      
      // Refresh motions
      const { data } = await apiClient.get("/governance/votes");
      setVotes(data.data || []);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to submit ballot. You may have already voted."
      });
    } finally {
      setVotingId(null);
    }
  };

  // Submit Welfare Request
  const handleCreateWelfareRequest = async (e) => {
    e.preventDefault();
    if (!welfareForm.amount_requested || !welfareForm.reason) {
      setFeedback({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await apiClient.post("/governance/welfare-requests", {
        category: welfareForm.category,
        amount_requested: parseFloat(welfareForm.amount_requested),
        reason: welfareForm.reason,
      });

      setFeedback({ type: "success", message: "Welfare claim submitted for executive review." });
      setTimeout(() => {
        setShowWelfareModal(false);
        setWelfareForm({ category: "medical", amount_requested: "", reason: "" });
        fetchGovernanceData();
      }, 1500);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to submit welfare request."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export Member Statements
  const handleExportStatements = () => {
    const csvContent = "data:text/csv;charset=utf-8,Member,Category,Amount,Status,Date\n" +
      welfare.map(w => `"${w.member_name || "Member"}","${w.category}",${w.amount_requested},"${w.status}","${w.created_at || ""}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chama_governance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance &amp; Compliance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Oversee AGM voting, welfare requests, and generate SASRA-compliant reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportStatements} className="btn-outline text-xs">
            <Download size={14} />
            Member Statements
          </button>
          <Link to="/compliance" className="btn-dark text-xs">
            <FileBarChart size={14} />
            SASRA Report
          </Link>
        </div>
      </div>

      {/* Global Feedback Notice */}
      {feedback.message && !showWelfareModal && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: "", message: "" })} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Grid: AGM Motions + Compliance Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        {/* AGM Motions Panel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Vote size={16} className="text-brand-green-600" />
              <h2 className="text-base font-bold text-slate-900">Active AGM Motions</h2>
            </div>
            {votes.length > 0 && <span className="badge-blue">{votes.length} Active Ballot{votes.length > 1 ? "s" : ""}</span>}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-brand-green-600" />
              <p className="text-xs text-slate-400">Loading active motions…</p>
            </div>
          ) : votes.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
              <ShieldCheck size={20} className="text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No open motions</p>
              <p className="text-xs text-slate-400 max-w-xs">New motions submitted by the executive committee will appear here for voting.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {votes.map((v) => {
                const userVote = votedMotions[v.id] || v.user_vote;
                const isVotingThis = votingId === v.id;

                return (
                  <div key={v.id} className="rounded-2xl border border-brand-border p-4 hover:border-slate-300 transition-colors bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <span className="badge-slate text-[10px] uppercase font-bold tracking-wider">
                          {v.category || "AGM Policy"}
                        </span>
                        <p className="text-sm font-bold text-slate-900">{v.title}</p>
                        {v.description && <p className="text-xs text-slate-500 line-clamp-2">{v.description}</p>}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                          <Calendar size={12} />
                          <span>Closes {formatDate(v.closes_at || v.created_at)}</span>
                        </div>
                      </div>

                      {/* Vote Buttons / Result Badge */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {userVote ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
                            <CheckCircle2 size={13} />
                            <span>Voted {userVote.toUpperCase()}</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCastVote(v.id, "for")}
                              disabled={isVotingThis}
                              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                            >
                              {isVotingThis ? <RefreshCw size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                              For
                            </button>
                            <button
                              onClick={() => handleCastVote(v.id, "against")}
                              disabled={isVotingThis}
                              className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                            >
                              {isVotingThis ? <RefreshCw size={12} className="animate-spin" /> : <ThumbsDown size={12} />}
                              Against
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compliance Hub Shortcut */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-brand-green-600" />
            <h2 className="text-base font-bold text-slate-900">Compliance Hub</h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 border border-brand-border p-4">
              <p className="text-sm font-bold text-slate-800">SASRA Regulatory Audits</p>
              <p className="text-xs text-slate-400 mt-1">Generate automated regulatory compliance filings and ledger history.</p>
              <Link to="/compliance" className="btn-dark w-full mt-3 justify-center text-xs">
                <FileBarChart size={13} />
                Generate Regulatory Report
              </Link>
            </div>

            <div className="rounded-xl bg-slate-50 border border-brand-border p-4">
              <p className="text-sm font-bold text-slate-800">System Audit Trail</p>
              <p className="text-xs text-slate-400 mt-1">Review executive operations, policy shifts, and authentication logs.</p>
              <Link to="/compliance" className="btn-outline w-full mt-3 justify-center text-xs">
                View Audit Logs
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Welfare Fund Requests Table */}
      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-brand-border bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HeartHandshake size={16} className="text-brand-green-600" />
            <h2 className="text-base font-bold text-slate-900">Welfare Fund Claims</h2>
          </div>
          <button onClick={() => setShowWelfareModal(true)} className="btn-primary text-xs py-1.5">
            <Plus size={14} />
            Submit Welfare Claim
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-400">Loading welfare requests…</p>
          </div>
        ) : welfare.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
            <HeartHandshake size={20} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No welfare requests recorded</p>
            <p className="text-xs text-slate-400">Members can request emergency disbursements from the shared welfare pool.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-slate-100/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Claim ID</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Amount (KES)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-white">
                {welfare.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      #{String(w.id).slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 capitalize">
                      {w.category || "Emergency"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatKes(w.amount_requested || 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={WELFARE_BADGE[w.status] || "badge-slate"}>
                        {w.status ? w.status.replace(/_/g, " ") : "pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedWelfare(w)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors inline-flex items-center"
                        title="View claim details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Welfare Claim Modal */}
      {showWelfareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-brand-border p-6 shadow-panel space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake size={18} className="text-brand-green-600" />
                <h3 className="text-base font-bold text-slate-900">Submit Welfare Claim</h3>
              </div>
              <button onClick={() => setShowWelfareModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {feedback.message && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateWelfareRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Claim Category</label>
                <select
                  value={welfareForm.category}
                  onChange={(e) => setWelfareForm({ ...welfareForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800"
                >
                  <option value="medical">Medical Relief</option>
                  <option value="bereavement">Bereavement Support</option>
                  <option value="education">Education Support</option>
                  <option value="disaster">Emergency Disaster Relief</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Requested Amount (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={welfareForm.amount_requested}
                  onChange={(e) => setWelfareForm({ ...welfareForm, amount_requested: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason &amp; Justification</label>
                <textarea
                  rows={3}
                  placeholder="Provide brief details regarding the welfare claim..."
                  value={welfareForm.reason}
                  onChange={(e) => setWelfareForm({ ...welfareForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-800 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowWelfareModal(false)} className="btn-outline py-2">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary py-2 flex items-center gap-1.5">
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {submitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Welfare Detail Inspection Modal */}
      {selectedWelfare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-brand-border p-6 shadow-panel space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-slate-900">Welfare Claim Details</h3>
              <button onClick={() => setSelectedWelfare(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Claim ID</span>
                  <span className="font-mono font-bold text-slate-800">#{String(selectedWelfare.id).slice(0, 8)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Status</span>
                  <span className={WELFARE_BADGE[selectedWelfare.status] || "badge-slate"}>
                    {selectedWelfare.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Requested Amount</span>
                <span className="text-lg font-bold text-slate-900">{formatKes(selectedWelfare.amount_requested)}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Justification</span>
                <p className="text-slate-700 font-medium mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedWelfare.reason || "No written statement provided."}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedWelfare(null)} className="btn-outline text-xs py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}