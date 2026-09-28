"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bookings").then((r) => r.json()).then((d) => {
      setBookings(d.bookings || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-4">All Bookings</h1>
      <AdminNav />

      {loading ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /></div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card-flat overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-3 px-4">Spot</th>
                  <th className="py-3 px-4">Renter</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">When</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4">{b.spot?.title}</td>
                    <td className="py-3 px-4 text-gray-500">{b.renter?.name}</td>
                    <td className="py-3 px-4 text-gray-500">{b.owner?.name}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(b.startTime).toLocaleDateString()}</td>
                    <td className="py-3 px-4">₹{b.totalPrice}</td>
                    <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                    <td className="py-3 px-4"><StatusBadge status={b.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="card">
                <p className="font-medium text-navy-900">{b.spot?.title}</p>
                <p className="text-sm text-gray-500">{b.renter?.name} → {b.owner?.name}</p>
                <p className="text-sm text-gray-500">{new Date(b.startTime).toLocaleDateString()} · ₹{b.totalPrice}</p>
                <div className="flex gap-1.5 mt-2">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
