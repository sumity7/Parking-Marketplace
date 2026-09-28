"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { patchLeafletIcon } from "@/lib/leafletIcon";

export default function SpotMapView({ lat, lng, title }) {
  patchLeafletIcon();
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: "220px", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}
