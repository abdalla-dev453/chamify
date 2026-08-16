import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, Wallet, PiggyBank, HandCoins, 
  Vote, FileText, Settings, LogOut, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/wallets", label: "Wallets", icon: Wallet },
  { to: "/savings", label: "Savings", icon: PiggyBank },
  { to: "/loans", label: "Loans", icon: HandCoins },
  { to: "/governance", label: "Governance", icon: Vote },
  { to: "/compliance", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getInitials = (name) => {
    if (!name) return "CL";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <aside 
      className={`relative h-screen flex flex-col border-r border-slate-800 bg-slate-950 p-4 transition-all duration-200 shrink-0 select-none
        ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Structural Toggle Control Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 hidden md:flex h-6 w-6 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer z-50 shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Institutional Core Branding */}
      <div className={`mb-6 flex items-center gap-3 px-1.5 ${isCollapsed ? "justify-center" : ""}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 font-bold font-mono text-orange-500 text-sm">
          CL
        </div>
        {!isCollapsed && (
          <div className="flex flex-col tracking-tight min-w-0">
            <span className="text-sm font-bold font-mono uppercase text-white truncate">
              ChamaLedger
            </span>
            <span className="text-[9px] font-bold font-mono tracking-wider text-slate-500 uppercase mt-0.5">
              System Core Console
            </span>
          </div>
        )}
      </div>

      {/* High-Density Tabular Navigation Pipeline */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={isCollapsed ? label : ""}
            className={({ isActive }) => `
              group flex items-center rounded-lg px-3 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-colors relative
              ${isCollapsed ? "justify-center" : "gap-3"}
              ${isActive 
                ? "bg-slate-900 text-orange-500 border border-slate-800/80" 
                : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border border-transparent"
              }
            `}
          >
            <Icon 
              size={14} 
              className={isCollapsed ? "text-slate-400 group-hover:text-slate-200" : ""} 
            />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer System Control Registry */}
      <div className="space-y-1 pt-4 border-t border-slate-900">
        
        {/* Utility Route: Billing */}
        <NavLink 
          to="/billing" 
          title={isCollapsed ? "Billing" : ""}
          className={({ isActive }) => `
            group flex items-center rounded-lg px-3 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-colors
            ${isCollapsed ? "justify-center" : "gap-3"}
            ${isActive 
              ? "bg-slate-900 text-white border border-slate-800" 
              : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border border-transparent"
            }
          `}
        >
          <Settings size={14} />
          {!isCollapsed && <span>Billing</span>}
        </NavLink>

        {/* Action Node: Log Out Session */}
        <button 
          onClick={logout} 
          title={isCollapsed ? "Terminate Session" : ""}
          className={`group flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 border border-transparent transition-colors cursor-pointer
            ${isCollapsed ? "justify-center" : "gap-3"}`}
        >
          <LogOut size={14} className="text-slate-500 group-hover:text-rose-400" />
          {!isCollapsed && <span>Exit Session</span>}
        </button>

        {/* Authorized User Profile Node */}
        <div className={`mt-3 flex items-center rounded-lg bg-slate-950 border border-slate-900 p-2 ${isCollapsed ? "justify-center border-transparent" : "gap-2.5 bg-slate-900/20"}`}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-800 text-[10px] font-bold font-mono text-slate-400">
            {getInitials(user?.full_name)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[11px] font-bold text-slate-300 font-sans tracking-tight">{user?.full_name || "System Operator"}</span>
              <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider mt-0.5">Role: {user?.role || "Member"}</span>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
