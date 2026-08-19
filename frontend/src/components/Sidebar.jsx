import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  HandCoins,
  Vote,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
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

function roleLabel(role) {
  if (!role) return "Member";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getInitials = (name) => {
    if (!name) return "CL";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={`relative h-screen flex flex-col border-r border-brand-border bg-white p-4 transition-all duration-200 shrink-0 select-none
        ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-brand-border bg-white text-slate-400 hover:text-slate-700 hover:shadow-card transition-colors cursor-pointer z-50 shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Branding */}
      <div className={`mb-6 flex items-center gap-2.5 px-1.5 ${isCollapsed ? "justify-center" : ""}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-ink-900 text-white">
          <ShieldCheck size={17} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-bold text-slate-900 truncate">
              {user?.tenant_name || "Chamify"}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              {roleLabel(user?.role)} View
            </span>
          </div>
        )}
      </div>

      {/* Quick action */}
      <button
        className={`mb-4 flex items-center rounded-lg bg-brand-ink-900 hover:bg-brand-ink-800 text-white font-semibold text-sm py-2.5 transition-colors cursor-pointer
          ${isCollapsed ? "justify-center px-0" : "justify-center gap-2 px-3"}`}
      >
        <Zap size={14} className="shrink-0" />
        {!isCollapsed && <span>Quick Action</span>}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={isCollapsed ? label : ""}
            className={({ isActive }) => `
              group flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors relative
              ${isCollapsed ? "justify-center" : "gap-3"}
              ${
                isActive
                  ? "bg-brand-green-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }
            `}
          >
            <Icon size={17} className="shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 pt-3 border-t border-brand-border">
        <NavLink
          to="/billing"
          title={isCollapsed ? "Settings" : ""}
          className={({ isActive }) => `
            group flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors
            ${isCollapsed ? "justify-center" : "gap-3"}
            ${isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"}
          `}
        >
          <Settings size={17} className="shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={logout}
          title={isCollapsed ? "Log Out" : ""}
          className={`group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer
            ${isCollapsed ? "justify-center" : "gap-3"}`}
        >
          <LogOut size={17} className="shrink-0" />
          {!isCollapsed && <span>Log Out</span>}
        </button>

        <div
          className={`mt-3 flex items-center rounded-lg border border-brand-border bg-slate-50 p-2 ${
            isCollapsed ? "justify-center border-transparent bg-transparent" : "gap-2.5"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-ink-900 text-[11px] font-bold text-white">
            {getInitials(user?.full_name)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[13px] font-semibold text-slate-800">
                {user?.full_name || "System User"}
              </span>
              <span className="text-[11px] text-slate-400 truncate">{roleLabel(user?.role)}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}