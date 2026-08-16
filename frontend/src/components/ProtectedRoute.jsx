import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-sans selection:bg-orange-500/30">
        {/* Abstract Cosmic Backdrop Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-orange-500/5 to-slate-900/10 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center gap-4 z-10 animate-fade-in">
          {/* Dual-Ring High-End Loading Indicator */}
          <div className="relative h-12 w-12">
            {/* Outer Navy Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/[0.04]" />
            {/* Inner Glowing Solar Orange Spinning Arc */}
            <div className="absolute inset-0 rounded-full border-2 border-t-orange-500 border-r-orange-400/30 border-b-transparent border-l-transparent animate-spin shadow-[0_0_15px_rgba(249,115,22,0.2)]" />
          </div>

          {/* Typography */}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              ChamaLedger
            </span>
            <span className="text-[11px] font-medium tracking-wide text-slate-500 animate-pulse">
              Securing workspace data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}
