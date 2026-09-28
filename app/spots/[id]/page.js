import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";
import Review from "@/models/Review";
import Favorite from "@/models/Favorite";
import { isValidObjectId } from "@/lib/validators";
import SpotDetailClient from "./SpotDetailClient";

// Cached per-request so generateMetadata and the page component share one DB round trip.
const getSpotData = cache(async (id) => {
  if (!isValidObjectId(id)) return null;
  await connectDB();

  const spot = await Spot.findById(id).populate("owner", "name verified ratingAvg ratingCount").lean();
  if (!spot) return null;

  const isPublic = spot.status === "approved" && spot.isActive;
  if (!isPublic) {
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === spot.owner?._id?.toString();
    const isAdmin = session?.user?.role === "admin";
    if (!isOwner && !isAdmin) return null;
  }

  const reviews = await Review.find({ spot: id, type: "spot_review" })
    .populate("reviewer", "name")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify({ spot, reviews }));
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getSpotData(id);
  if (!data) {
    return { title: "Parking spot" };
  }
  const { spot } = data;
  const vehicleLabel = spot.vehicleTypes?.[0] ? `${spot.vehicleTypes[0]} ` : "";
  const title = `${spot.title} — ${vehicleLabel}Parking in ${spot.city} | ParkSpot`;
  const description = `${spot.title} in ${spot.city}, ₹${spot.pricePerHour}/hour. ${spot.description ? spot.description.slice(0, 120) : "Book a verified parking spot by the hour on ParkSpot."}`;

  return {
    title: `${spot.title} — Parking in ${spot.city}`,
    description,
    alternates: { canonical: `/spots/${spot._id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: spot.photos?.[0] ? [spot.photos[0]] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: spot.photos?.[0] ? [spot.photos[0]] : undefined,
    },
  };
}

export default async function SpotDetailPage({ params }) {
  const { id } = await params;
  const data = await getSpotData(id);
  if (!data) notFound();
  const { spot, reviews } = data;

  const session = await getServerSession(authOptions);
  let isFavorited = false;
  if (session) {
    await connectDB();
    isFavorited = Boolean(await Favorite.exists({ user: session.user.id, spot: spot._id }));
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ParkingFacility",
    name: spot.title,
    description: spot.description || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: spot.address,
      addressLocality: spot.city,
    },
    ...(typeof spot.latitude === "number" && {
      geo: { "@type": "GeoCoordinates", latitude: spot.latitude, longitude: spot.longitude },
    }),
    ...(spot.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: spot.ratingAvg,
        reviewCount: spot.ratingCount,
      },
    }),
    offers: {
      "@type": "Offer",
      price: spot.pricePerHour,
      priceCurrency: "INR",
      availability: spot.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      {/* Escape "<" so a title/description containing "</script>" can't break out of this tag and inject markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <SpotDetailClient id={id} spot={spot} reviews={reviews} isFavorited={isFavorited} />
    </>
  );
}
