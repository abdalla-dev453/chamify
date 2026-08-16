import { useState } from "react";
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
      // Surfaces the appraisal engine's own message, e.g.
      // "Requested amount exceeds your loan limit of 15000.00"
      setError(err.response?.data?.message || "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="glass-panel w-full max-w-sm p-6 bg-brand-slate-800">
        <h2 className="text-white font-medium mb-4">Apply for a loan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Amount (KES)</label>
            <input
              className="input-field" name="principal" type="number" min="1"
              value={form.principal} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Term (months)</label>
            <input
              className="input-field" name="term_months" type="number" min="1" max="60"
              value={form.term_months} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Interest method</label>
            <select className="input-field" name="interest_method" value={form.interest_method} onChange={handleChange}>
              <option value="reducing_balance" className="bg-brand-slate-800">Reducing balance</option>
              <option value="flat_rate" className="bg-brand-slate-800">Flat rate</option>
            </select>
          </div>

          {error && <p className="text-orange-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-slate-300 text-sm hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 text-sm">
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}