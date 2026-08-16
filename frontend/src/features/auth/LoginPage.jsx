import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-slate-900 via-brand-slate-800 to-brand-emerald-900 px-4">
      <div className="glass-panel w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Welcome back</h1>
        <p className="text-slate-300 text-sm mb-6">Sign in to your group's Chamify workspace.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Group ID</label>
            <input
              className="input-field" name="tenant_slug" placeholder="e.g. jitegemee-chama"
              value={form.tenant_slug} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Phone number</label>
            <input
              className="input-field" name="phone_number" placeholder="0712345678"
              value={form.phone_number} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Password</label>
            <input
              className="input-field" type="password" name="password"
              value={form.password} onChange={handleChange} required
            />
          </div>

          {error && <p className="text-orange-400 text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-slate-400 text-sm mt-6 text-center">
          New group?{" "}
          <Link to="/onboarding" className="text-brand-emerald-500 hover:underline">
            Onboard your chama
          </Link>
        </p>
      </div>
    </div>
  );
}