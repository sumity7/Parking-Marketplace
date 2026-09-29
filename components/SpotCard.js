import Link from "next/link";
import { formatDistance } from "@/lib/geo";
import FavoriteButton from "@/components/FavoriteButton";

export default function SpotCard({ spot, showFavorite = false, initialFavorited = false }) {
  return (
    <Link
      href={`/spots/${spot._id}`}
      className="card-flat card-hover group block overflow-hidden"
    >
      <div
        className="aspect-video overflow-hidden flex items-center justify-center text-navy-300 relative"
        style={!spot.photos?.[0] ? { backgroundImage: "linear-gradient(135deg, #eef1f6, #dce2ec)" } : undefined}
      >
        {showFavorite && (
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton spotId={spot._id} initialFavorited={initialFavorited} size="sm" />
          </div>
        )}
        {spot.photos?.[0] ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spot.photos[0]}
              alt={spot.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" aria-hidden="true" />
          </>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
          </svg>
        )}
        {spot.vehicleTypes?.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {spot.vehicleTypes.slice(0, 3).map((v) => (
              <span key={v} className="badge bg-white/90 text-navy-700 capitalize shadow-soft">{v}</span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-navy-900 leading-snug line-clamp-1">{spot.title}</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{spot.address}, {spot.city}</p>
        {spot.distanceMeters != null && (
          <p className="text-xs text-brand-600 font-medium mt-0.5">{formatDistance(spot.distanceMeters)}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          {spot.owner?.verified && (
            <span className="badge-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
              Verified
            </span>
          )}
          {spot.ratingCount > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#d97706"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
              {spot.ratingAvg?.toFixed(1)} ({spot.ratingCount})
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="font-display font-bold text-navy-900">
            ₹{spot.pricePerHour}<span className="text-xs font-normal text-gray-500">/hr</span>
          </span>
          <span className="text-xs font-medium text-brand-600 group-hover:translate-x-0.5 transition-transform">
            View spot →
          </span>
        </div>
      </div>
    </Link>
  );
}
