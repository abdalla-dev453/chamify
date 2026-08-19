import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";
import Topbar from "../../components/Topbar.jsx";


export default function DashboardLayout() {
  return (
    <div className="min-h-screen w-full flex bg-brand-canvas overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto no-scrollbar flex flex-col">
        <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col justify-start">
          <Topbar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}