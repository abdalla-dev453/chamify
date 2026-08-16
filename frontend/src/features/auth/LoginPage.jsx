import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Hash, Phone, Lock, KeyRound, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenant_slug: "", phone_number: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden font-sans selection:bg-orange-500/30">
      
      {/* Background Ambient Kinetic Light Blurs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-orange-500/5 to-slate-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-orange-500/5 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Login Container */}
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-slate-950/40 backdrop-blur-xl p-8 shadow-[0_8px_32px_0_rgba(2,6,23,0.5)] z-10 animate-fade-in">
        
        {/* Core Header Identity branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 font-bold text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.3)]">
            <KeyRound size={20} />
          </div>
          <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Welcome back
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-400">
            Sign in to your group's ChamaLedger workspace.
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Input field: Group ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-400 block uppercase">
              Group ID
            </label>
            <div className="relative flex items-center">
              <Hash size={16} className="absolute left-3.5 text-slate-500 pointer-events-none transition-colors group-focus-within:text-orange-400" />
              <input
                type="text"
                name="tenant_slug"
                placeholder="e.g. jitegemee-chama"
                value={form.tenant_slug}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-slate-900/40 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-orange-500/50 focus:bg-slate-900/80 focus:shadow-[0_0_15px_rgba(249,115,22,0.05)]"
              />
            </div>
          </div>

          {/* Input field: Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-400 block uppercase">
              Phone number
            </label>
            <div className="relative flex items-center">
              <Phone size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              <input
                type="tel"
                name="phone_number"
                placeholder="0712345678"
                value={form.phone_number}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-slate-900/40 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-orange-500/50 focus:bg-slate-900/80 focus:shadow-[0_0_15px_rgba(249,115,22,0.05)]"
              />
            </div>
          </div>

          {/* Input field: Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-400 block uppercase">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-slate-900/40 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-orange-500/50 focus:bg-slate-900/80 focus:shadow-[0_0_15px_rgba(249,115,22,0.05)]"
              />
            </div>
          </div>

          {/* Error Banner System */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 tracking-wide animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Premium Form Submission Action Trigger */}
          <button 
            type="submit" 
            disabled={submitting} 
            className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(249,115,22,0.25)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                Signing in…
              </span>
            ) : (
              <>
                Sign in
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Redirection Layer */}
        <p className="text-xs font-medium text-slate-500 mt-8 text-center tracking-wide">
          New group?{" "}
          <Link to="/onboarding" className="text-orange-400 font-semibold hover:text-orange-300 transition-colors ml-1 inline-flex items-center gap-0.5 hover:underline">
            Onboard your chama
          </Link>
        </p>
      </div>
    </div>
  );
}
