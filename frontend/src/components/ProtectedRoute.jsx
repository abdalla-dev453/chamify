import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-brand-canvas font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-2 border-t-brand-green-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-bold text-slate-800">Chamify</span>
            <span className="text-xs text-slate-500">Securing your workspace…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}