export default function StatCard({ label, value, accent = "emerald" }) {
  const accentClass = accent === "orange" ? "text-brand-orange-400" : "text-brand-emerald-500";
  return (
    <div className="glass-panel p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
    </div>
  );
}