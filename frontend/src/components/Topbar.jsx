import { Search, Bell, HelpCircle, Settings } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext.jsx";

export default function Topbar({ placeholder = "Search transactions, members..." }) {
  const { user } = useAuth();

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
    <header className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-xl">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder={placeholder} className="search-field" />
      </div>

      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
          <Bell size={17} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
          <HelpCircle size={17} />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
          <Settings size={17} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink-900 text-white text-xs font-bold ml-1">
          {getInitials(user?.full_name)}
        </div>
      </div>
    </header>
  );
}