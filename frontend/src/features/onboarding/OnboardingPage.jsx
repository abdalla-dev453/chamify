import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, ShieldAlert, Award, Fingerprint, ArrowRight, RefreshCw } from "lucide-react";
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
      setError(err.response?.data?.message || "Could not onboard your group. Try a different name.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans selection:bg-orange-500/30">
      
      {/* Main Structural Registration Panel */}
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl z-10 animate-fade-in">
        
        {/* Core Institutional Header */}
        <div className="mb-8 flex flex-col items-center text-center border-b border-slate-900 pb-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 font-bold text-orange-500 shadow-sm">
            <Building2 size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-mono">
            Tenant Initialization
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-400 max-w-sm">
            Register your chama, investment group, or regulated SACCO entity node within the system ledger core.
          </p>
        </div>

        {/* Input Parameters Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Form Row: Group Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wide text-slate-400 block uppercase font-mono">
              Corporate Entity Name
            </label>
            <div className="relative flex items-center">
              <Building2 size={15} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                name="name"
                placeholder="e.g. Jitegemee Investment Group"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-orange-500/50"
              />
            </div>
          </div>

          {/* Form Row: Classification Tier Dropdown Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wide text-slate-400 block uppercase font-mono">
              Regulatory Framework Classification
            </label>
            <div className="relative flex items-center">
              <Award size={15} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              <select
                name="tier"
                value={form.tier}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-sm font-medium text-white outline-none transition-all duration-200 focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-950 text-slate-200 text-sm">
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-500 border-l border-slate-800 pl-2 text-[10px] font-mono uppercase font-bold">
                Select
              </div>
            </div>
          </div>

          {/* Form Row: Chairperson ID validation */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wide text-slate-400 block uppercase font-mono flex justify-between items-center">
              <span>Chairperson National ID</span>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">IPRS Gateway Check</span>
            </label>
            <div className="relative flex items-center">
              <Fingerprint size={15} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              
            </div>
          </div>

          {/* Error Banner Notification Alert */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 tracking-wide">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span className="font-mono uppercase text-[10px] font-bold text-rose-500 mr-1">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <button 
            type="submit" 
            disabled={submitting} 
            className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 rounded-xl bg-slate-100 hover:bg-white text-sm font-bold text-slate-950 transition-all duration-150 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-xs">
                <RefreshCw size={14} className="animate-spin" />
                Initializing Node Schema…
              </span>
            ) : (
              <>
                <span className="font-mono uppercase tracking-wider text-xs font-extrabold">Commit Registration Initialization</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 text-slate-700" />
              </>
            )}
          </button>
        </form>

        {/* Footer Redirection Registry Layer */}
        <p className="text-xs font-medium text-slate-500 mt-6 text-center tracking-wide font-mono uppercase">
          Existing System Tenant?{" "}
          <Link to="/login" className="text-orange-500 font-bold hover:text-orange-400 transition-colors ml-1 hover:underline lowercase normal-case">
            Sign in to session
          </Link>
        </p>
      </div>
    </div>
  );
}
