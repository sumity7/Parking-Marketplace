"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { patchLeafletIcon } from "@/lib/leafletIcon";

function ClickHandler({ onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ lat, lng, onMove }) {
  patchLeafletIcon();
  const center = [lat ?? 20.5937, lng ?? 78.9629]; // default: center of India

  return (
    <MapContainer center={center} zoom={lat ? 15 : 5} style={{ height: "280px", width: "100%", borderRadius: "0.75rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMove={onMove} />
      {lat != null && lng != null && (
        <Marker
          position={[lat, lng]}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = e.target.getLatLng();
              onMove(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
