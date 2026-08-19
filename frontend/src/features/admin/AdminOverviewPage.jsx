import { useEffect, useState } from "react";
import { Building2, ShieldCheck, Activity } from "lucide-react";
import apiClient from "../../lib/apiClient.js";
import StatCard from "../../components/StatCard.jsx";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/admin/overview")
      .then(({ data }) => setOverview(data.data))
      .catch((err) => console.error("Failed to fetch platform overview:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navy-50 text-brand-navy-600">
          <Activity size={16} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Control Tower</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time metrics across all tenant organizations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <StatCard
          label="Total Tenants"
          value={isLoading ? "—" : overview?.total_tenants?.toLocaleString() ?? "0"}
          icon={Building2}
          tone="blue"
        />
        <StatCard
          label="Active Tenants"
          value={isLoading ? "—" : overview?.active_tenants?.toLocaleString() ?? "0"}
          icon={ShieldCheck}
          tone="green"
        />
      </div>
    </div>
  );
}