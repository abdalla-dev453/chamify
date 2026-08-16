import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient.js";
import StatCard from "../../components/StatCard.jsx";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    apiClient.get("/admin/overview").then(({ data }) => setOverview(data.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Platform control tower</h1>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <StatCard label="Total tenants" value={overview?.total_tenants ?? "…"} />
        <StatCard label="Active tenants" value={overview?.active_tenants ?? "…"} accent="orange" />
      </div>
    </div>
  );
}