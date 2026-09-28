"use client";

import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/Toast";

const SpotMapView = dynamic(() => import("./SpotMapView"), {
  ssr: false,
  loading: () => <div className="skeleton h-[220px] rounded-xl" />,
});

export default function SpotLocation({ latitude, longitude, address, title }) {
  const toast = useToast();

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      toast("Address copied.", "success");
    } catch {
      toast("Could not copy — select the text manually.", "error");
    }
  }

  const hasLocation = typeof latitude === "number" && typeof longitude === "number";

  return (
    <div>
      {hasLocation ? (
        <SpotMapView lat={latitude} lng={longitude} title={title} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 h-[140px] flex items-center justify-center text-sm text-gray-500">
          Exact location not set for this listing.
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {hasLocation && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm"
          >
            Get Directions
          </a>
        )}
        {hasLocation && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm"
          >
            Open in Google Maps
          </a>
        )}
        <button type="button" onClick={copyAddress} className="btn-secondary btn-sm">
          Copy Address
        </button>
      </div>
    </div>
  );
}
