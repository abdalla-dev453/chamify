import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-slate-900 via-brand-slate-800 to-brand-emerald-900 px-4 py-10">
      <div className="glass-panel w-full max-w-lg p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Onboard your group</h1>
        <p className="text-slate-300 text-sm mb-6">Set up your chama, church group, or SACCO on ChamaLedger.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Group name</label>
            <input className="input-field" name="name" placeholder="e.g. Jitegemee Chama" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Tier</label>
            <select className="input-field" name="tier" value={form.tier} onChange={handleChange}>
              {TIERS.map((t) => (
                <option key={t.value} value={t.value} className="bg-brand-slate-800">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Chairperson national ID (for IPRS check)</label>
            <input className="input-field" name="chairperson_id_number" value={form.chairperson_id_number} onChange={handleChange} />
          </div>

          {error && <p className="text-orange-400 text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Setting up…" : "Create group"}
          </button>
        </form>

        <p className="text-slate-400 text-sm mt-6 text-center">
          Already have a group? <Link to="/login" className="text-brand-emerald-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}