import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  AlertCircle,
  Award,
  IdCard,
  ArrowRight,
  Loader2,
  Users,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import apiClient from "../../lib/apiClient.js";

const TIERS = [
  { value: "tier_1_informal", label: "Tier 1 — Informal merry-go-round (5-10 members)" },
  { value: "tier_2_registered", label: "Tier 2 — Registered chama (has a Ministry certificate)" },
  { value: "tier_3_sacco", label: "Tier 3 — Regulated SACCO (100+ members, CR12)" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  // Role mode toggle: 'official' (register new group) or 'member' (join existing group)
  const [onboardingRole, setOnboardingRole] = useState("official");

  // Official Form State
  const [officialForm, setOfficialForm] = useState({
    name: "",
    tier: "tier_1_informal",
    chairperson_id_number: "",
  });

  // Member Form State
  const [memberForm, setMemberForm] = useState({
    group_code: "",
    national_id: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOfficialChange = (e) =>
    setOfficialForm({ ...officialForm, [e.target.name]: e.target.value });

  const handleMemberChange = (e) =>
    setMemberForm({ ...memberForm, [e.target.name]: e.target.value });

  // Handle Official Group Setup
  const handleOfficialSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/tenants/onboard", {
        ...officialForm,
        role: "official",
      });

      // Save tenant context if returned
      if (data?.data?.id || data?.tenant_id) {
        localStorage.setItem("chamify_tenant_id", data.data?.id || data.tenant_id);
      }

      navigate("/register", { state: { role: "official", tenantName: officialForm.name } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not register your group. Please check the ID or try a different group name."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Member Group Join
  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/tenants/join-request", {
        ...memberForm,
        role: "member",
      });

      if (data?.data?.tenant_id || data?.tenant_id) {
        localStorage.setItem("chamify_tenant_id", data.data?.tenant_id || data.tenant_id);
      }

      navigate("/register", { state: { role: "member", groupCode: memberForm.group_code } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid group code or National ID. Please request an invite from your group secretary."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center border-b border-slate-100 pb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Chamify</h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
            Set up a new chama or join your existing group to start managing contributions and loans.
          </p>

          {/* Role Mode Switcher */}
          <div className="mt-6 grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl w-full">
            <button
              type="button"
              onClick={() => {
                setOnboardingRole("official");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                onboardingRole === "official"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={14} />
              Register New Group
            </button>
            <button
              type="button"
              onClick={() => {
                setOnboardingRole("member");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                onboardingRole === "member"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={14} />
              Join as Member
            </button>
          </div>
        </div>

        {/* --- OFFICIAL / CHAIRPERSON FORM --- */}
        {onboardingRole === "official" ? (
          <form onSubmit={handleOfficialSubmit} className="space-y-5">
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
                  value={officialForm.name}
                  onChange={handleOfficialChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
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
                  value={officialForm.tier}
                  onChange={handleOfficialChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 appearance-none cursor-pointer"
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
                <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  Verification Required
                </span>
              </label>
              <div className="relative flex items-center">
                <IdCard size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="chairperson_id_number"
                  placeholder="Enter National ID number"
                  value={officialForm.chairperson_id_number}
                  onChange={handleOfficialChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Setting up group...
                </span>
              ) : (
                <>
                  <span>Create Group &amp; Proceed</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* --- MEMBER FORM --- */
          <form onSubmit={handleMemberSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wide">
                Group Invite Code / Chama Code
              </label>
              <div className="relative flex items-center">
                <KeyRound size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="group_code"
                  placeholder="e.g. CHM-8492"
                  value={memberForm.group_code}
                  onChange={handleMemberChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 uppercase"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Ask your group secretary or official for your Chama invite code.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wide">
                Your National ID Number
              </label>
              <div className="relative flex items-center">
                <IdCard size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="national_id"
                  placeholder="Enter National ID"
                  value={memberForm.national_id}
                  onChange={handleMemberChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Validating code...
                </span>
              ) : (
                <>
                  <span>Join Group &amp; Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

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