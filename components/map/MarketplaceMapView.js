"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Link from "next/link";
import { patchLeafletIcon } from "@/lib/leafletIcon";

export default function MarketplaceMapView({ spots, center }) {
  patchLeafletIcon();
  const located = spots.filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number");
  const mapCenter = center || (located[0] ? [located[0].latitude, located[0].longitude] : [20.5937, 78.9629]);

  if (located.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 h-[420px] flex items-center justify-center text-sm text-gray-500 text-center px-6">
        None of these spots have an exact location set yet.
      </div>
    );
  }

  return (
    <MapContainer center={mapCenter} zoom={center ? 13 : 11} style={{ height: "420px", width: "100%", borderRadius: "0.75rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((spot) => (
        <Marker key={spot._id} position={[spot.latitude, spot.longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{spot.title}</p>
              <p>₹{spot.pricePerHour}/hr</p>
              <Link href={`/spots/${spot._id}`} className="text-brand-600 font-medium">View spot →</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
