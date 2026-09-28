"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import StatCard from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-1">Admin Overview</h1>
      <p className="text-sm text-gray-500 mb-4">Live figures from the database — nothing here is estimated.</p>
      <AdminNav />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!stats ? (
          <>
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="Total Spots" value={stats.totalSpots} />
            <StatCard label="Pending Approval" value={stats.pendingSpots} tone="warning" />
            <StatCard label="Total Bookings" value={stats.totalBookings} />
            <StatCard label="GMV (paid bookings)" value={`₹${stats.gmv}`} />
            <StatCard label="Platform Revenue (12%)" value={`₹${stats.revenue}`} tone="brand" />
          </>
        )}
      </div>
    </div>
  );
}
