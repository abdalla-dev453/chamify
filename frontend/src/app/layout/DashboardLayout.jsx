import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-brand-slate-900 via-brand-slate-800 to-brand-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}