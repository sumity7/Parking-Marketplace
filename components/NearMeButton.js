"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NearMeButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("idle"); // idle | locating | denied | error
  const active = searchParams.has("lat");

  function findNearMe() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", pos.coords.latitude.toFixed(6));
        params.set("lng", pos.coords.longitude.toFixed(6));
        setStatus("idle");
        router.push(`/?${params.toString()}`);
      },
      () => {
        setStatus("denied");
      },
      { timeout: 10000 }
    );
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  return (
    <div>
      {active ? (
        <button type="button" onClick={clear} className="btn-secondary btn-sm">
          ✕ Clear location
        </button>
      ) : (
        <button type="button" onClick={findNearMe} disabled={status === "locating"} className="btn-secondary btn-sm">
          {status === "locating" ? "Locating…" : "📍 Parking Near Me"}
        </button>
      )}
      {status === "denied" && <p className="text-xs text-warning-600 mt-1">Location access is unavailable. Search by city instead.</p>}
      {status === "error" && <p className="text-xs text-warning-600 mt-1">Location isn&apos;t supported in this browser.</p>}
    </div>
  );
}
