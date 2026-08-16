import { useState } from "react";
import { Landmark, Calendar, ShieldAlert, Award, RefreshCw, X } from "lucide-react";
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      
      {/* Main Structural Modal Containment Box */}
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative">
        
        {/* Absolute Floating Close Corner Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Institutional Title Area Header */}
        <div className="mb-5 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Landmark size={14} className="text-orange-500" />
            <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
              Credit Execution Module
            </h2>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            Initialising Appraisal Index for Wallet Context ID: {walletId || "Null"}
          </p>
        </div>

        {/* Input Parameters Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Input field: Amount (KES) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-400 block uppercase font-mono">
              Principal Amount (KES)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold font-mono text-slate-600">KES</span>
              <input
                type="number"
                name="principal"
                min="1"
                placeholder="0.00"
                value={form.principal}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-sm font-medium font-mono text-white placeholder-slate-700 outline-none transition-all duration-150 focus:border-orange-500/40"
              />
            </div>
          </div>

          {/* Input field: Term (Months) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-400 block uppercase font-mono">
              Amortization Term Interval
            </label>
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              <input
                type="number"
                name="term_months"
                min="1"
                max="60"
                placeholder="Months"
                value={form.term_months}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-16 py-2 rounded-lg border border-slate-800 bg-slate-900 text-sm font-medium font-mono text-white placeholder-slate-700 outline-none transition-all duration-150 focus:border-orange-500/40"
              />
              <span className="absolute right-3.5 text-[10px] font-bold font-mono text-slate-500 uppercase">Months</span>
            </div>
          </div>

          {/* Input field: Interest calculation method */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-400 block uppercase font-mono">
              Interest Formulation Matrix
            </label>
            <div className="relative flex items-center">
              <Award size={14} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              <select
                name="interest_method"
                value={form.interest_method}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-800 bg-slate-900 text-sm font-medium text-white outline-none transition-all duration-150 focus:border-orange-500/40 appearance-none cursor-pointer"
              >
                <option value="reducing_balance" className="bg-slate-950 text-slate-200">Reducing Balance Matrix</option>
                <option value="flat_rate" className="bg-slate-950 text-slate-200">Flat Rate Structure</option>
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-500 border-l border-slate-800 pl-2 text-[10px] font-mono uppercase font-bold">
                Select
              </div>
            </div>
          </div>

          {/* Valuation Engine Error Callout Message */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 tracking-wide">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono uppercase text-[9px] font-bold text-rose-500">Appraisal Engine Rejection:</span>
                <span className="text-[11px] font-medium leading-normal">{error}</span>
              </div>
            </div>
          )}

          {/* Balanced Alignment Action Row */}
          <div className="flex gap-3 pt-3 border-t border-slate-900 mt-2">
            
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 px-4 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-400 font-mono uppercase tracking-wider transition-colors duration-150 cursor-pointer text-center"
            >
              Abort
            </button>

            <button 
              type="submit" 
              disabled={submitting} 
              className="flex-1 py-2 px-4 rounded-lg bg-slate-100 hover:bg-white text-xs font-bold text-slate-950 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
                  <RefreshCw size={12} className="animate-spin" />
                  Executing...
                </span>
              ) : (
                <span className="font-mono uppercase tracking-wider text-[11px] font-extrabold">Commit App</span>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
