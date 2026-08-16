export default function StatCard({ label, value, trend, icon: Icon, isSecondary = false }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm transition-colors duration-150 hover:border-slate-700">
      <div className="flex items-center justify-between gap-4">
        {/* Metric Label */}
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">
          {label}
        </p>
        
        {/* Structural Icon Block */}
        {Icon && (
          <div className={`p-1.5 rounded border ${
            isSecondary 
              ? "bg-slate-900 border-slate-800 text-slate-500" 
              : "bg-slate-900 border-slate-800 text-orange-500"
          }`}>
            <Icon size={14} />
          </div>
        )}
      </div>

      {/* Main Numerical Matrix Display */}
      <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
        <p className={`text-2xl font-bold tracking-tight font-mono ${
          isSecondary 
            ? "text-slate-100" 
            : "text-orange-500"
        }`}>
          {value}
        </p>

        {/* Tabular Trend Indicator */}
        {trend && (
          <span className="font-mono text-[10px] font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
