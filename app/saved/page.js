"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SpotCard from "@/components/SpotCard";
import EmptyState from "@/components/ui/EmptyState";
import { SpotGridSkeleton } from "@/components/ui/Skeleton";

export default function SavedPage() {
  const { data: session, status } = useSession();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setLoading(false);
      return;
    }
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setSpots(d.spots || []))
      .finally(() => setLoading(false));
  }, [session, status]);

  if (status !== "loading" && !session) {
    return (
      <EmptyState
        title="Please log in"
        message="Log in to see the parking spots you've saved."
        action={<Link href="/login" className="btn-primary">Log in</Link>}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-1">My Saved Parking</h1>
      <p className="text-sm text-gray-500 mb-6">Spots you&apos;ve favorited, all in one place.</p>

      {loading ? (
        <SpotGridSkeleton />
      ) : spots.length === 0 ? (
        <EmptyState
          title="No saved spots yet"
          message="Tap the heart on any listing to save it here."
          action={<Link href="/" className="btn-primary">Find Parking</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {spots.map((spot) => (
            <SpotCard key={spot._id} spot={spot} showFavorite initialFavorited />
          ))}
        </div>
      )}
    </div>
  );
}
