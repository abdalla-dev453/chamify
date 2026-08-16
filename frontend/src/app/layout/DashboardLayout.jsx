import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen w-full flex bg-brand-slate-950 overflow-hidden font-sans selection:bg-brand-orange-500/30">
      
      {/* Structural Navigation Frame */}
      <Sidebar />
      
      {/* Core Terminal Data Stream Grid Area */}
      <main className="flex-1 p-6 overflow-y-auto no-scrollbar bg-brand-slate-950 flex flex-col">
        <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col justify-start">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
