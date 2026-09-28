"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import LocationPicker from "@/components/map/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EditSpotPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [form, setForm] = useState(null);
  const [availDays, setAvailDays] = useState([]);
  const [availStart, setAvailStart] = useState("08:00");
  const [availEnd, setAvailEnd] = useState("20:00");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetch(`/api/spots/${id}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setNotFound(true);
          return;
        }
        const spot = data.spot;
        if (spot.owner?._id !== session.user.id && session.user.role !== "admin") {
          setNotFound(true);
          return;
        }
        setForm({
          title: spot.title,
          description: spot.description || "",
          address: spot.address,
          city: spot.city,
          pricePerHour: spot.pricePerHour,
          vehicleTypes: spot.vehicleTypes,
          photos: spot.photos || [],
          latitude: spot.latitude ?? null,
          longitude: spot.longitude ?? null,
          formattedAddress: spot.formattedAddress || "",
        });
        if (spot.availability?.length) {
          setAvailDays(spot.availability.map((s) => s.dayOfWeek));
          setAvailStart(spot.availability[0].startTime);
          setAvailEnd(spot.availability[0].endTime);
        }
      })
      .catch(() => setNotFound(true));
  }, [id, session, status, router]);

  function toggleVehicle(type) {
    setForm((f) => ({
      ...f,
      vehicleTypes: f.vehicleTypes.includes(type)
        ? f.vehicleTypes.filter((v) => v !== type)
        : [...f.vehicleTypes, type],
    }));
  }

  function toggleDay(day) {
    setAvailDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));
  }

  function handleLocationChange({ latitude, longitude, formattedAddress, city }) {
    setForm((f) => ({
      ...f,
      latitude,
      longitude,
      formattedAddress: formattedAddress || f.formattedAddress,
      address: formattedAddress || f.address,
      city: city || f.city,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const availability = availDays.map((d) => ({ dayOfWeek: d, startTime: availStart, endTime: availEnd }));
    const photos = form.photos.filter(Boolean);

    const res = await fetch(`/api/spots/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        photos,
        availability,
        pricePerHour: Number(form.pricePerHour),
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    toast("Listing updated — it will need admin re-approval.", "success");
    router.push("/dashboard");
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-xl font-bold text-navy-800">Listing not found</p>
        <p className="text-gray-500 mt-1">This listing doesn&apos;t exist or isn&apos;t yours to edit.</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto card animate-pulse space-y-3">
        <div className="skeleton h-6 w-1/2 rounded" />
        <div className="skeleton h-24 rounded" />
        <div className="skeleton h-10 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-1">Edit listing</h1>
      <p className="text-sm text-gray-500 mb-6">Changing core details sends this listing back for admin re-approval.</p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <p className="text-danger-600 text-sm bg-danger-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="label">Title</label>
          <input required minLength={3} maxLength={120} className="input" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} maxLength={2000} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="label">Location</label>
          <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={handleLocationChange} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Address</label>
            <input required minLength={3} maxLength={300} className="input" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input required minLength={2} maxLength={100} className="input" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Price per hour (₹)</label>
          <input required type="number" min="0" max="100000" className="input w-40" value={form.pricePerHour}
            onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
        </div>

        <div>
          <label className="label">Vehicle types allowed</label>
          <div className="flex gap-3">
            {["car", "bike", "suv"].map((type) => (
              <label key={type} className="flex items-center gap-1.5 text-sm capitalize">
                <input type="checkbox" checked={form.vehicleTypes.includes(type)} onChange={() => toggleVehicle(type)} />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Photos</label>
          <ImageUploader photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
        </div>

        <div>
          <label className="label">Available days</label>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAYS.map((label, idx) => (
              <button type="button" key={idx} onClick={() => toggleDay(idx)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${availDays.includes(idx) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-300 hover:border-brand-300"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Available from</label>
            <input type="time" className="input" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
          </div>
          <div>
            <label className="label">Available until</label>
            <input type="time" className="input" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
