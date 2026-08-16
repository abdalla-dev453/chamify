import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../lib/apiClient.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenant_slug: "", full_name: "", phone_number: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/auth/register", form);
      localStorage.setItem("chamaledger_access_token", data.data.access_token);
      localStorage.setItem("chamaledger_refresh_token", data.data.refresh_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-slate-900 via-brand-slate-800 to-brand-emerald-900 px-4 py-10">
      <div className="glass-panel w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Join your chama</h1>
        <p className="text-slate-300 text-sm mb-6">Create your member account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input-field" name="tenant_slug" placeholder="Group ID" value={form.tenant_slug} onChange={handleChange} required />
          <input className="input-field" name="full_name" placeholder="Full name" value={form.full_name} onChange={handleChange} required />
          <input className="input-field" name="phone_number" placeholder="0712345678" value={form.phone_number} onChange={handleChange} required />
          <input className="input-field" name="email" placeholder="Email (optional)" value={form.email} onChange={handleChange} />
          <input className="input-field" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />

          {error && <p className="text-orange-400 text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}