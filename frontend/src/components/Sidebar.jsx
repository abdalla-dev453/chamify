import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wallet, PiggyBank, HandCoins, Vote, FileText, Settings, LogOut } from "lucide-react";
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
  const { logout } = useAuth();


  return (
    <aside className="glass-panel w-64 shrink-0 h-[calc(100vh-2rem)] m-4 p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-white font-semibold text-lg">ChamaLedger</h1>
        <p className="text-slate-400 text-xs">{user?.full_name}</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-brand-emerald-500/20 text-brand-emerald-500 font-medium"
                  : "text-slate-300 hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 pt-4 border-t border-white/10">
        <NavLink to="/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5">
          <Settings size={18} /> Billing
        </NavLink>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-orange-400 hover:bg-white/5">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}