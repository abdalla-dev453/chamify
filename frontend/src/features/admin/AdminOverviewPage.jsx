import { useEffect, useState } from "react";
import { Building2, ShieldCheck, Activity } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import StatCard from "../../components/StatCard.jsx";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/overview")
      .then(({ data }) => {
        setOverview(data.data);
      })
      .catch((err) => {
        console.error("Failed to fetch control tower data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header Area */}
      <div className="flex flex-col gap-1.5 border-b border-white/[0.04] pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Activity size={14} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Platform control tower
          </h1>
        </div>
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Real-time metrics and deployment health for ecosystem nodes.
        </p>
      </div>

      {/* Metrics Layout Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <StatCard 
          label="Total tenants" 
          value={isLoading ? "—" : (overview?.total_tenants?.toLocaleString() ?? "0")} 
          icon={Building2}
          isSecondary={true}
        />
        
        <StatCard 
          label="Active tenants" 
          value={isLoading ? "—" : (overview?.active_tenants?.toLocaleString() ?? "0")} 
          icon={ShieldCheck}
          isSecondary={false} 
        />
      </div>
    </div>
  );
}
