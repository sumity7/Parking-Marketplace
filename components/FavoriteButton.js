"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function FavoriteButton({ spotId, initialFavorited = false, size = "md" }) {
  const toast = useToast();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !favorited;
    setFavorited(next); // optimistic
    try {
      const res = next
        ? await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spotId }),
          })
        : await fetch(`/api/favorites/${spotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast(next ? "Saved to your parking." : "Removed from saved.", "success");
    } catch {
      setFavorited(!next); // revert
      toast("Could not update favorites", "error");
    } finally {
      setBusy(false);
    }
  }

  const dim = size === "sm" ? 16 : 20;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? "Remove from saved parking" : "Save parking"}
      aria-pressed={favorited}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${size === "sm" ? "h-8 w-8" : "h-10 w-10"} ${favorited ? "bg-danger-50 text-danger-500" : "bg-white/90 text-gray-500 hover:text-danger-500"} shadow-soft`}
    >
      <svg width={dim} height={dim} viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-10.1-9A5.6 5.6 0 0112 6.3 5.6 5.6 0 0122.1 12c-2.6 4.4-10.1 9-10.1 9z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
