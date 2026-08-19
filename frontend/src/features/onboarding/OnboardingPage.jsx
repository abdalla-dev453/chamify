import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, AlertCircle, Award, IdCard, ArrowRight, Loader2 } from "lucide-react";
import apiClient from "../../lib/apiClient.js";

const TIERS = [
  { value: "tier_1_informal", label: "Tier 1 — Informal merry-go-round (5-10 members)" },
  { value: "tier_2_registered", label: "Tier 2 — Registered chama (has a Ministry certificate)" },
  { value: "tier_3_sacco", label: "Tier 3 — Regulated SACCO (100+ members, CR12)" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", tier: "tier_1_informal", chairperson_id_number: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiClient.post("/tenants/onboard", form);
      navigate("/register");
    } catch (err) {
      setError(err.response?.data?.message || "Could not register your group. Try a different name.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      
      {/* Registration Card */}
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center border-b border-slate-100 pb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Register Your Group
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
            Set up your chama, investment group, or SACCO to start managing your funds together.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Group Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wide">
              Group Name
            </label>
            <div className="relative flex items-center">
              <Building2 size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="name"
                placeholder="e.g. Jitegemee Investment Group"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              />
            </div>
          </div>

          {/* Group Type Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wide">
              Group Type
            </label>
            <div className="relative flex items-center">
              <Award size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <select
                name="tier"
                value={form.tier}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 outline-none transition-all duration-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 appearance-none cursor-pointer"
              >
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value} className="text-slate-900 text-sm">
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-400 text-xs font-medium">
                ▼
              </div>
            </div>
          </div>

          {/* Chairperson ID Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex justify-between items-center uppercase tracking-wide">
              <span>Chairperson ID Number</span>
              <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Verification Required</span>
            </label>
            <div className="relative flex items-center">
              <IdCard size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="chairperson_id_number"
                placeholder="Enter ID number"
                value={form.chairperson_id_number}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-semibold text-white transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Setting up group...
              </span>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs font-medium text-slate-500 mt-6 text-center">
          Already registered?{" "}
          <Link to="/login" className="text-orange-600 font-semibold hover:text-orange-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}