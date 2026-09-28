"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import SpotLocation from "@/components/map/SpotLocation";
import Gallery from "@/components/Gallery";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButtons from "@/components/ShareButtons";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SpotDetailClient({ id, spot, reviews, isFavorited }) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBook(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId: id, startTime, endTime }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Booking failed");
      return;
    }
    setMessage("Booking requested! Check your dashboard for status.");
    toast("Booking requested — the owner will confirm shortly.", "success");
  }

  const hours =
    startTime && endTime && new Date(endTime) > new Date(startTime)
      ? Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))
      : 0;

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-20 md:pb-0">
      <div className="md:col-span-2 space-y-6">
        <div>
          <div className="mb-4">
            <Gallery photos={spot.photos} title={spot.title} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-navy-900">{spot.title}</h1>
              <p className="text-gray-500">{spot.address}, {spot.city}</p>
            </div>
            {session && <FavoriteButton spotId={id} initialFavorited={isFavorited} />}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm text-gray-600">Owner: {spot.owner?.name}</span>
            {spot.owner?.verified && <span className="badge-success">Verified</span>}
            {spot.ratingCount > 0 && (
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#d97706"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                {spot.ratingAvg?.toFixed(1)} ({spot.ratingCount} reviews)
              </span>
            )}
          </div>
          <ShareButtons title={spot.title} />
        </div>

        {spot.description && <p className="text-gray-700 leading-relaxed">{spot.description}</p>}

        <div>
          <h3 className="font-semibold text-navy-800 mb-2">Location</h3>
          <SpotLocation latitude={spot.latitude} longitude={spot.longitude} address={`${spot.address}, ${spot.city}`} title={spot.title} />
        </div>

        <div>
          <h3 className="font-semibold text-navy-800 mb-2">Vehicle types</h3>
          <div className="flex flex-wrap gap-2">
            {spot.vehicleTypes?.map((v) => (
              <span key={v} className="badge-neutral capitalize">{v}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-navy-800 mb-2">Availability</h3>
          {spot.availability?.length ? (
            <div className="flex flex-wrap gap-2 text-sm">
              {spot.availability.map((slot, i) => (
                <span key={i} className="badge-neutral">
                  {WEEKDAYS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Available any time.</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-navy-800 mb-3">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-navy-800">{r.reviewer?.name}</span>
                    <span className="flex items-center gap-1 text-warning-600">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                      {r.rating}/5
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop sticky booking card */}
      <div className="hidden md:block card h-fit sticky top-24">
        <BookingForm
          spot={spot}
          session={session}
          startTime={startTime}
          endTime={endTime}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          hours={hours}
          error={error}
          message={message}
          loading={loading}
          onSubmit={handleBook}
        />
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 p-4 shadow-lifted">
        <details className="group">
          <summary className="list-none flex items-center justify-between cursor-pointer">
            <span className="font-display font-bold text-navy-900">₹{spot.pricePerHour}<span className="text-xs font-normal text-gray-500">/hr</span></span>
            <span className="btn-primary btn-sm">Book now</span>
          </summary>
          <div className="mt-4">
            <BookingForm
              spot={spot}
              session={session}
              startTime={startTime}
              endTime={endTime}
              setStartTime={setStartTime}
              setEndTime={setEndTime}
              hours={hours}
              error={error}
              message={message}
              loading={loading}
              onSubmit={handleBook}
              hidePrice
            />
          </div>
        </details>
      </div>
    </div>
  );
}

function BookingForm({ spot, session, startTime, endTime, setStartTime, setEndTime, hours, error, message, loading, onSubmit, hidePrice }) {
  return (
    <>
      {!hidePrice && (
        <p className="font-display text-2xl font-bold text-navy-900 mb-4">
          ₹{spot.pricePerHour}<span className="text-sm text-gray-500 font-normal">/hour</span>
        </p>
      )}
      {error && <p className="text-danger-600 text-sm mb-2 bg-danger-50 rounded-lg px-3 py-2">{error}</p>}
      {message && <p className="text-success-700 text-sm mb-2 bg-success-50 rounded-lg px-3 py-2">{message}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="label">Start</label>
          <input type="datetime-local" required className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="label">End</label>
          <input type="datetime-local" required className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        {hours > 0 && (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 flex justify-between">
            <span>{hours} hour(s) × ₹{spot.pricePerHour}</span>
            <strong className="text-navy-900">₹{hours * spot.pricePerHour}</strong>
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Requesting…" : session ? "Request Booking" : "Log in to book"}
        </button>
      </form>
    </>
  );
}
