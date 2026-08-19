const ICON_TONES = {
  green: "bg-brand-green-50 text-brand-green-600",
  blue: "bg-blue-50 text-blue-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-500",
};

export default function StatCard({ label, value, trend, icon: Icon, tone = "slate" }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONES[tone] || ICON_TONES.slate}`}>
            <Icon size={17} />
          </div>
        )}
        {trend && <span className="badge-green">{trend}</span>}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}