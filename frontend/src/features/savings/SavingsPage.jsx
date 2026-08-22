import { useEffect, useState } from "react";
import {
  PiggyBank,
  Calendar,
  RefreshCw,
  Layers,
  Plus,
  X,
  Target,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import { formatKes } from "../../lib/formatters.js";

export default function SavingsPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'create' | 'contribute' | null
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    expected_amount: "",
    frequency: "monthly",
    target_wallet_id: "",
  });
  const [contributionAmount, setContributionAmount] = useState("");

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/savings/schedules");
      setSchedules(data.data || []);
    } catch (err) {
      console.error("Savings schedule fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // --- Handlers ---
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/savings/schedules", {
        ...formData,
        expected_amount: Number(formData.expected_amount),
      });
      alert("Savings schedule created successfully!");
      setModalType(null);
      setFormData({ name: "", expected_amount: "", frequency: "monthly", target_wallet_id: "" });
      fetchSchedules();
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Access Denied: Only group officials (Admin/Treasurer) can create savings schedules.");
      } else {
        alert(err.response?.data?.message || "Savings schedule creation failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post(`/savings/schedules/${selectedSchedule?.id}/contribute`, {
        amount: Number(contributionAmount),
      });
      alert(`Successfully contributed ${formatKes(contributionAmount)} to ${selectedSchedule.name}!`);
      setModalType(null);
      setContributionAmount("");
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || "Contribution payment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalTarget = schedules.reduce((acc, s) => acc + Number(s.expected_amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Savings Schedules</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Contribution frequencies and target amounts for your group.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSchedules}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-600"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setModalType("create")}
            className="btn-primary flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white font-medium rounded-lg hover:bg-brand-green-700 transition"
          >
            <Plus size={16} />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border rounded-xl shadow-sm bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Combined Target</p>
              <p className="text-xl font-bold text-slate-900">{loading ? "—" : formatKes(totalTarget)}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border rounded-xl shadow-sm bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active Plans</p>
              <p className="text-xl font-bold text-slate-900">{loading ? "—" : schedules.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border rounded-xl shadow-sm bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Primary Frequency</p>
              <p className="text-xl font-bold text-slate-900 capitalize">
                {schedules[0]?.frequency?.replace(/_/g, " ") || "Monthly"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 border rounded-xl bg-white shadow-sm">
            <RefreshCw size={18} className="animate-spin text-brand-green-600" />
            <p className="text-xs text-slate-500">Loading savings schedules…</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full py-14 border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-center p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 mb-3">
              <Layers size={18} />
            </div>
            <p className="text-sm font-semibold text-slate-600">No active schedules</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Savings contribution frequencies will appear here once configured.
            </p>
            <button
              onClick={() => setModalType("create")}
              className="px-4 py-2 text-xs font-medium bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition"
            >
              Add First Schedule
            </button>
          </div>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="card p-5 border rounded-xl shadow-sm bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-green-50 text-brand-green-600">
                      <PiggyBank size={16} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 px-2.5 py-1 rounded-full">
                    <Calendar size={12} className="text-slate-500" />
                    <span className="text-xs font-medium text-slate-600 capitalize">
                      {s.frequency ? s.frequency.replace(/_/g, " ") : "variable"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Target Amount
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    {formatKes(s.expected_amount || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t border-dashed border-slate-100">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 size={12} /> Active Plan
                </span>
                <button
                  onClick={() => {
                    setSelectedSchedule(s);
                    setContributionAmount(s.expected_amount || "");
                    setModalType("contribute");
                  }}
                  className="text-xs font-semibold text-brand-green-600 hover:text-brand-green-700 hover:underline flex items-center gap-1"
                >
                  Contribute Now <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Modals --- */}
      {modalType === "create" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Savings Schedule</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Shares Target"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Expected Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="2000"
                  value={formData.expected_amount}
                  onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600 bg-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi_weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Saving..." : "Create Schedule"}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalType === "contribute" && selectedSchedule && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => {
                setModalType(null);
                setSelectedSchedule(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Contribute to Plan</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedSchedule.name}</p>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contribution Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Processing..." : "Confirm Contribution"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}