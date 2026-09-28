"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import EmptyState from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

function SpotRow({ spot, filter, onApprove, onReject, onDelete }) {
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-medium text-navy-900">{spot.title}</p>
          <p className="text-sm text-gray-500">{spot.address}, {spot.city} · ₹{spot.pricePerHour}/hr</p>
          <p className="text-sm text-gray-500">
            Owner: {spot.owner?.name} ({spot.owner?.email}) {spot.owner?.verified && "· Verified"}
          </p>
          {spot.status === "rejected" && spot.rejectionReason && (
            <p className="text-sm text-danger-600 mt-1">Reason: {spot.rejectionReason}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {filter !== "approved" && <button onClick={() => onApprove(spot._id)} className="btn-primary btn-sm">Approve</button>}
          {filter !== "rejected" && (
            <button onClick={() => setShowReason((s) => !s)} className="btn-secondary btn-sm">Reject</button>
          )}
          <button onClick={() => onDelete(spot._id)} className="btn-danger btn-sm">Delete</button>
        </div>
      </div>
      {showReason && (
        <div className="mt-3 flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-[200px]"
            placeholder="Rejection reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            onClick={() => { onReject(spot._id, reason); setShowReason(false); setReason(""); }}
            className="btn-danger btn-sm"
          >
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminSpotsPage() {
  const toast = useToast();
  const [spots, setSpots] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/spots?status=${filter}`).then((r) => r.json()).then((d) => {
      setSpots(d.spots || []);
      setLoading(false);
    });
  }

  useEffect(load, [filter]);

  async function approve(id) {
    await fetch(`/api/admin/spots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    toast("Spot approved.", "success");
    load();
  }

  async function reject(id, reason) {
    await fetch(`/api/admin/spots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", reason }),
    });
    toast("Spot rejected.", "info");
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this spot permanently?")) return;
    await fetch(`/api/admin/spots/${id}`, { method: "DELETE" });
    toast("Spot deleted.", "success");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-4">Spot Moderation</h1>
      <AdminNav />

      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm border capitalize transition-colors ${filter === s ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-300"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /></div>
      ) : spots.length === 0 ? (
        <EmptyState title={`No ${filter} spots`} />
      ) : (
        <div className="space-y-3">
          {spots.map((spot) => (
            <SpotRow key={spot._id} spot={spot} filter={filter} onApprove={approve} onReject={reject} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
