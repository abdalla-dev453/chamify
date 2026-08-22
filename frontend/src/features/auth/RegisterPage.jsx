import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Hash, User, Phone, Mail, Lock, UserPlus, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import apiClient from "../../lib/apiClient.js";

const FIELDS = [
  { name: "tenant_slug", label: "Group-slug", type: "text", placeholder: "e.g. jitegemee-chama", icon: Hash, required: true },
  { name: "full_name", label: "Full Name", type: "text", placeholder: "Neema Jitegemee", icon: User, required: true },
  { name: "phone_number", label: "Phone Number", type: "tel", placeholder: "0712345678", icon: Phone, required: true },
  { name: "email", label: "Email Address", type: "email", placeholder: "neema@example.com", icon: Mail, required: false, optional: true },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••", icon: Lock, required: true },
];

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
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-canvas px-4 py-12 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-panel">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-ink-900 text-white">
            <UserPlus size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Join your chama</h1>
          <p className="mt-1.5 text-sm text-slate-500">Create your member account to access the workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(({ name, label, type, placeholder, icon: Icon, required, optional }) => (
            <div className="space-y-1.5" key={name}>
              <label className="text-xs font-semibold text-slate-500 flex justify-between items-center">
                <span>{label}</span>
                {optional && <span className="text-[11px] text-slate-400 font-medium">Optional</span>}
              </label>
              <div className="relative flex items-center">
                <Icon size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                  required={required}
                  className="input-field pl-10"
                />
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-2">
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}