import { useState } from "react";
import { Landmark, Calendar, ShieldAlert, Percent, RefreshCw, X } from "lucide-react";
import { applyForLoan } from "./api.js";

export default function LoanApplicationModal({ walletId, onClose, onApplied }) {
  const [form, setForm] = useState({ principal: "", term_months: "6", interest_method: "reducing_balance" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await applyForLoan({
        wallet_id: walletId,
        principal: form.principal,
        term_months: Number(form.term_months),
        interest_method: form.interest_method,
      });
      onApplied?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-panel relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green-50 text-brand-green-600">
            <Landmark size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Apply for a Loan</h2>
            <p className="text-xs text-slate-400">Complete the details below to submit your request.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Requested Amount</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-semibold text-slate-400">KES</span>
              <input
                type="number"
                name="principal"
                min="1"
                placeholder="0.00"
                value={form.principal}
                onChange={handleChange}
                required
                className="input-field pl-12"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Term</label>
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="number"
                name="term_months"
                min="1"
                max="60"
                placeholder="Months"
                value={form.term_months}
                onChange={handleChange}
                required
                className="input-field pl-10 pr-16"
              />
              <span className="absolute right-3.5 text-xs font-medium text-slate-400">Months</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Interest Method</label>
            <div className="relative flex items-center">
              <Percent size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <select
                name="interest_method"
                value={form.interest_method}
                onChange={handleChange}
                className="input-field pl-10 appearance-none cursor-pointer"
              >
                <option value="reducing_balance">Reducing Balance</option>
                <option value="flat_rate">Flat Rate</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                "Continue to Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}