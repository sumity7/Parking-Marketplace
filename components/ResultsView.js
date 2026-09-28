"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import SpotCard from "@/components/SpotCard";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

const MarketplaceMapView = dynamic(() => import("./map/MarketplaceMapView"), {
  ssr: false,
  loading: () => <div className="skeleton h-[420px] rounded-xl" />,
});

export default function ResultsView({ spots, center, showFavorite = false, favoritedIds = [] }) {
  const favSet = new Set(favoritedIds);
  const [view, setView] = useState("list");

  if (spots.length === 0) {
    return (
      <EmptyState
        title="No spots found"
        message="Try a different city or clear your filters — or be the first to list a spot here."
        action={<Link href="/spots/new" className="btn-primary">List Your Spot</Link>}
      />
    );
  }

  return (
    <div>
      <div className="flex gap-1 mb-4 border border-gray-200 rounded-lg p-1 w-fit">
        {["list", "map"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${view === v ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {spots.map((spot) => (
            <SpotCard key={spot._id} spot={spot} showFavorite={showFavorite} initialFavorited={favSet.has(spot._id)} />
          ))}
        </div>
      ) : (
        <MarketplaceMapView spots={spots} center={center} />
      )}
    </div>
  );
}
