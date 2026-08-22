import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Hash, Phone, Lock, ShieldCheck, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-canvas px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-panel">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-ink-900 text-white">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your group's Chamify workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Group-slug</label>
            <div className="relative flex items-center">
              <Hash size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="tenant_slug"
                placeholder="e.g. jitegemee-chama"
                value={form.tenant_slug}
                onChange={handleChange}
                required
                className="input-field pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Phone number</label>
            <div className="relative flex items-center">
              <Phone size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                name="phone_number"
                placeholder="0712345678"
                value={form.phone_number}
                onChange={handleChange}
                required
                className="input-field pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Password</label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="input-field pl-11"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-8 text-center">
          New group?{" "}
          <Link to="/onboarding" className="text-orange-600 font-semibold hover:underline">
            Onboard your chama
          </Link>
        </p>
      </div>
    </div>
  );
}