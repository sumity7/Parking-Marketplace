"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { geocodeAddress, reverseGeocode } from "@/lib/geo";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-[280px] rounded-xl" />,
});

// Controlled location picker: search box (Nominatim) + interactive map with a
// draggable marker. Calls onChange({ latitude, longitude, formattedAddress, city })
// whenever the confirmed location changes.
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirmedLabel, setConfirmedLabel] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      try {
        const results = await geocodeAddress(query, { signal: controller.signal });
        setSuggestions(results);
      } catch {
        // ignore aborted/failed searches — user is likely still typing
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function selectSuggestion(s) {
    setSuggestions([]);
    setQuery("");
    setConfirmedLabel(s.label);
    setMapKey((k) => k + 1);
    onChange({ latitude: s.lat, longitude: s.lng, formattedAddress: s.label, city: s.city });
  }

  async function handleMove(lat, lng) {
    onChange({ latitude: lat, longitude: lng, formattedAddress: confirmedLabel, city: undefined });
    try {
      const r = await reverseGeocode(lat, lng);
      setConfirmedLabel(r.label);
      onChange({ latitude: lat, longitude: lng, formattedAddress: r.label, city: r.city });
    } catch {
      // reverse geocoding is a nice-to-have here — coordinates are already saved
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          className="input"
          placeholder="Search address, area or landmark"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <p className="text-xs text-gray-500 mt-1">Searching…</p>}
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lifted max-h-56 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={i}
                onClick={() => selectSuggestion(s)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <LocationPickerMap key={mapKey} lat={latitude} lng={longitude} onMove={handleMove} />
      </div>

      {latitude != null ? (
        <p className="text-xs text-success-700 mt-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
          Location confirmed{confirmedLabel ? `: ${confirmedLabel}` : ""}
        </p>
      ) : (
        <p className="text-xs text-gray-500 mt-2">Search above or click/drag on the map to set the exact location.</p>
      )}
    </div>
  );
}
