"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { RowSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function ReviewForm({ booking, onDone }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await fetch(`/api/bookings/${booking._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review", rating, comment }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast(data.error || "Could not submit review", "error");
      if (res.status === 409) onDone(); // already reviewed — hide the control
      return;
    }
    toast("Review submitted — thanks!", "success");
    onDone();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary btn-sm">Leave a review</button>
    );
  }

  return (
    <div className="mt-2 border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={n <= rating ? "#d97706" : "#e5e7eb"}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        className="input"
        rows={2}
        maxLength={1000}
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={submit} disabled={submitting} className="btn-primary btn-sm">
          {submitting ? "Submitting…" : "Submit review"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost btn-sm">Cancel</button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState("listings");
  const [bookingSubTab, setBookingSubTab] = useState("upcoming");
  const [mySpots, setMySpots] = useState([]);
  const [myBookingsAsRenter, setMyBookingsAsRenter] = useState([]);
  const [myBookingsAsOwner, setMyBookingsAsOwner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [reviewedIds, setReviewedIds] = useState(new Set());

  async function loadAll() {
    const [renterRes, ownerRes, spotsRes] = await Promise.all([
      fetch("/api/bookings?as=renter").then((r) => r.json()),
      fetch("/api/bookings?as=owner").then((r) => r.json()),
      fetch("/api/my-spots").then((r) => r.json()),
    ]);
    setMyBookingsAsRenter(renterRes.bookings || []);
    setMyBookingsAsOwner(ownerRes.bookings || []);
    setMySpots(spotsRes.spots || []);
    setLoading(false);
  }

  useEffect(() => {
    if (session) loadAll();
  }, [session]);

  async function handleBookingAction(id, action) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`Booking ${action === "mark_paid" ? "paid" : action + "ed"}.`, "success");
      loadAll();
    } else {
      toast(data.error || "Action failed", "error");
    }
  }

  async function togglePause(spot) {
    const res = await fetch(`/api/spots/${spot._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !spot.isActive }),
    });
    if (res.ok) {
      toast(spot.isActive ? "Listing paused." : "Listing resumed.", "success");
      loadAll();
    } else {
      toast("Could not update listing", "error");
    }
  }

  async function requestVerification() {
    const res = await fetch("/api/verify-request", { method: "POST" });
    if (res.ok) {
      setVerifyMsg("Verification request sent to admin.");
      toast("Verification requested.", "success");
    }
  }

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = myBookingsAsRenter.filter((b) => b.status === "confirmed" && new Date(b.startTime).getTime() >= now).length;
    const totalBookings = myBookingsAsRenter.length;
    const listed = mySpots.length;
    const totalSpent = myBookingsAsRenter.filter((b) => b.paymentStatus === "paid").reduce((sum, b) => sum + b.totalPrice, 0);
    return { upcoming, totalBookings, listed, totalSpent };
  }, [myBookingsAsRenter, mySpots]);

  const filteredRenterBookings = useMemo(() => {
    const now = Date.now();
    return myBookingsAsRenter.filter((b) => {
      if (bookingSubTab === "upcoming") return b.status === "confirmed" && new Date(b.startTime).getTime() >= now;
      if (bookingSubTab === "pending") return b.status === "pending";
      if (bookingSubTab === "completed") return b.status === "completed";
      if (bookingSubTab === "cancelled") return b.status === "cancelled";
      return true;
    });
  }, [myBookingsAsRenter, bookingSubTab]);

  if (!session) {
    return (
      <EmptyState
        title="Please log in"
        message="Log in to view your dashboard, listings and bookings."
        action={<Link href="/login" className="btn-primary">Log in</Link>}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">{greeting()}, {session.user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what&apos;s happening with your account.</p>
        </div>
        {!session.user.verified && (
          <div className="text-sm text-right">
            <button onClick={requestVerification} className="btn-secondary btn-sm">Request ID Verification</button>
            {verifyMsg && <p className="text-success-600 mt-1 text-xs">{verifyMsg}</p>}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Upcoming bookings" value={stats.upcoming} tone="brand" />
            <StatCard label="Total bookings" value={stats.totalBookings} />
            <StatCard label="Listed spots" value={stats.listed} />
            <StatCard label="Total spent" value={`₹${stats.totalSpent}`} tone="success" />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/" className="btn-secondary btn-sm">Find Parking</Link>
        <Link href="/spots/new" className="btn-secondary btn-sm">List a Spot</Link>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {[
          ["listings", "My Listings"],
          ["renting", "My Bookings"],
          ["hosting", "Bookings on My Spots"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-navy-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <RowSkeleton /><RowSkeleton /><RowSkeleton />
        </div>
      ) : (
        <>
          {tab === "listings" && (
            <div>
              <Link href="/spots/new" className="btn-primary inline-block mb-4">+ List a new spot</Link>
              {mySpots.length === 0 ? (
                <EmptyState title="No listings yet" message="List your first parking spot to start earning." />
              ) : (
                <div className="space-y-3">
                  {mySpots.map((spot) => (
                    <div key={spot._id} className="card flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-navy-900">{spot.title}</p>
                        <p className="text-sm text-gray-500">{spot.city} · ₹{spot.pricePerHour}/hr</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={spot.status} />
                        {!spot.isActive && <span className="badge-neutral">Paused</span>}
                        <Link href={`/spots/${spot._id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                        <button onClick={() => togglePause(spot)} className="btn-secondary btn-sm">
                          {spot.isActive ? "Pause" : "Resume"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "renting" && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  ["upcoming", "Upcoming"],
                  ["pending", "Pending"],
                  ["completed", "Completed"],
                  ["cancelled", "Cancelled"],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setBookingSubTab(key)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${bookingSubTab === key ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {filteredRenterBookings.length === 0 ? (
                <EmptyState title="No bookings here" message="Nothing in this category yet." action={<Link href="/" className="btn-primary">Find a spot</Link>} />
              ) : (
                <div className="space-y-3">
                  {filteredRenterBookings.map((b) => (
                    <div key={b._id} className="card">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-medium text-navy-900">{b.spot?.title}</p>
                        <div className="flex gap-1.5">
                          <StatusBadge status={b.status} />
                          <StatusBadge status={b.paymentStatus} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()} · ₹{b.totalPrice}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap items-start">
                        {b.status === "pending" && (
                          <button onClick={() => handleBookingAction(b._id, "cancel")} className="btn-secondary btn-sm">Cancel</button>
                        )}
                        {b.status === "confirmed" && b.paymentStatus === "unpaid" && (
                          <button onClick={() => handleBookingAction(b._id, "mark_paid")} className="btn-primary btn-sm" title="Development mode: no real charge is made">
                            Pay Now (simulated)
                          </button>
                        )}
                        {b.status === "completed" && !reviewedIds.has(b._id) && (
                          <ReviewForm booking={b} onDone={() => setReviewedIds((s) => new Set(s).add(b._id))} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "hosting" && (
            <div className="space-y-3">
              {myBookingsAsOwner.length === 0 ? (
                <EmptyState title="No bookings yet" message="Once someone books your spot, it'll show up here." />
              ) : (
                myBookingsAsOwner.map((b) => (
                  <div key={b._id} className="card">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-medium text-navy-900">{b.spot?.title} — booked by {b.renter?.name}</p>
                      <div className="flex gap-1.5">
                        <StatusBadge status={b.status} />
                        <StatusBadge status={b.paymentStatus} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()} · ₹{b.totalPrice}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {b.status === "pending" && (
                        <button onClick={() => handleBookingAction(b._id, "confirm")} className="btn-primary btn-sm">Confirm</button>
                      )}
                      {b.status === "confirmed" && b.paymentStatus === "paid" && (
                        <button onClick={() => handleBookingAction(b._id, "complete")} className="btn-secondary btn-sm">Mark Completed</button>
                      )}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button onClick={() => handleBookingAction(b._id, "cancel")} className="btn-danger btn-sm">Cancel</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
