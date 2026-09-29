import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";
import Favorite from "@/models/Favorite";
import ResultsView from "@/components/ResultsView";
import NearMeButton from "@/components/NearMeButton";
import { escapeRegex } from "@/lib/validators";
import Link from "next/link";

export const metadata = {
  title: "Find Parking Near You",
  description: "Search verified parking spots by city, vehicle type and price — book by the hour in seconds.",
};

const NEARBY_RADIUS_METERS = 10000;

// Server Component: fetches directly from the DB, no client-side API call needed for the initial view.
// When lat/lng are present (via the "Near Me" button), spots are pulled by geo distance
// instead of the text filters, and each result carries a distanceMeters field.
async function getSpots(searchParams) {
  await connectDB();
  const lat = Number(searchParams.lat);
  const lng = Number(searchParams.lng);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  const filters = { status: "approved", isActive: true };
  if (searchParams.vehicleType) filters.vehicleTypes = searchParams.vehicleType;
  if (searchParams.maxPrice && Number.isFinite(Number(searchParams.maxPrice))) {
    filters.pricePerHour = { $lte: Number(searchParams.maxPrice) };
  }

  if (hasLocation) {
    const spots = await Spot.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distanceMeters",
          maxDistance: NEARBY_RADIUS_METERS,
          query: filters,
          spherical: true,
        },
      },
      { $limit: 24 },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [{ $project: { name: 1, verified: 1, ratingAvg: 1, ratingCount: 1 } }],
        },
      },
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    ]);
    return JSON.parse(JSON.stringify(spots));
  }

  if (searchParams.city) filters.city = new RegExp(escapeRegex(searchParams.city), "i");

  const spots = await Spot.find(filters)
    .populate("owner", "name verified ratingAvg ratingCount")
    .sort({ createdAt: -1 })
    .limit(24)
    .lean();

  return JSON.parse(JSON.stringify(spots));
}

const TRUST_ITEMS = [
  { label: "Verified owners", desc: "Every host is ID-checked before they can list a space." },
  { label: "Moderated listings", desc: "Our team reviews every spot before it goes live." },
  { label: "Flexible booking", desc: "Book by the hour, cancel a pending request anytime." },
];

const STEPS = [
  { n: "01", title: "Search", desc: "Enter your city, vehicle type and budget." },
  { n: "02", title: "Choose", desc: "Compare verified spots by price, rating and availability." },
  { n: "03", title: "Book", desc: "Request a booking — the owner confirms in minutes." },
  { n: "04", title: "Park", desc: "Show up and park. No meters, no guesswork." },
];

const FAQS = [
  { q: "How is the price calculated?", a: "You pay the listed hourly rate × the hours you book. The total is shown before you confirm — no hidden fees." },
  { q: "What happens after I request a booking?", a: "The spot owner confirms or declines your request. You'll see the status update on your dashboard." },
  { q: "Can I list more than one spot?", a: "Yes — list as many as you like from your dashboard. Each new listing is reviewed before it goes live." },
];

export default async function HomePage({ searchParams }) {
  const sp = await searchParams;
  const spots = await getSpots(sp);
  const hasLocation = Boolean(sp.lat && sp.lng);
  const isSearch = Boolean(sp.city || sp.vehicleType || sp.maxPrice || hasLocation);
  const mapCenter = hasLocation ? [Number(sp.lat), Number(sp.lng)] : undefined;

  const session = await getServerSession(authOptions);
  let favoritedIds = [];
  if (session && spots.length > 0) {
    const favorites = await Favorite.find({
      user: session.user.id,
      spot: { $in: spots.map((s) => s._id) },
    })
      .select("spot")
      .lean();
    favoritedIds = favorites.map((f) => f.spot.toString());
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section
        className="rounded-2xl text-white px-6 sm:px-10 py-14 sm:py-20 -mx-4 sm:mx-0 overflow-hidden relative"
        style={{ backgroundImage: "linear-gradient(160deg, #0b1728 0%, #101f3a 45%, #152f6e 100%)" }}
      >
        <div className="absolute inset-0 bg-dot-grid text-white/[0.06]" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-success-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-navy-100 backdrop-blur">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
            Verified owners · Moderated listings
          </span>

          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight mt-4 text-balance">
            Find a parking spot<br className="hidden sm:block" /> <span className="text-gradient">without the hassle.</span>
          </h1>
          <p className="text-navy-200 mt-4 text-base sm:text-lg max-w-lg">
            Rent a verified spot from a local owner, by the hour — no circling the block, no meters.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#search" className="btn-primary shadow-lifted">Find Parking</a>
            <Link href="/spots/new" className="btn bg-white/10 text-white border border-white/15 hover:bg-white/20 backdrop-blur">
              List Your Spot
            </Link>
          </div>
        </div>
      </section>

      {/* Search */}
      <section id="search" className="scroll-mt-20">
        <form className="card grid sm:grid-cols-4 gap-3" method="GET">
          <div className="sm:col-span-2">
            <label className="label">City / Area</label>
            <input name="city" defaultValue={sp.city || ""} placeholder="e.g. Hazratganj, Lucknow" className="input" />
          </div>
          <div>
            <label className="label">Vehicle</label>
            <select name="vehicleType" defaultValue={sp.vehicleType || ""} className="input">
              <option value="">Any</option>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="suv">SUV</option>
            </select>
          </div>
          <div>
            <label className="label">Max ₹/hour</label>
            <input name="maxPrice" defaultValue={sp.maxPrice || ""} type="number" min="0" placeholder="e.g. 50" className="input" />
          </div>
          <div className="sm:col-span-4 flex gap-2 items-start flex-wrap">
            <button type="submit" className="btn-primary">Search</button>
            <Suspense fallback={null}>
              <NearMeButton />
            </Suspense>
            {isSearch && <Link href="/" className="btn-ghost">Clear filters</Link>}
          </div>
        </form>
      </section>

      {/* Trust indicators */}
      <section className="grid sm:grid-cols-3 gap-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="card-flat card-hover flex gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-success-50 text-success-600 flex items-center justify-center flex-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
            </div>
            <div>
              <p className="font-semibold text-navy-800 text-sm">{item.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Results */}
      <section>
        <h2 className="font-display text-xl font-bold text-navy-900 mb-4">
          {hasLocation
            ? `${spots.length} spot${spots.length === 1 ? "" : "s"} near you`
            : isSearch
            ? `${spots.length} spot${spots.length === 1 ? "" : "s"} found`
            : "Featured parking spots"}
        </h2>
        <ResultsView spots={spots} center={mapCenter} showFavorite={Boolean(session)} favoritedIds={favoritedIds} />
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-display text-xl font-bold text-navy-900 mb-8 text-center">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" aria-hidden="true" />
          {STEPS.map((step) => (
            <div key={step.n} className="relative text-center sm:text-left">
              <div className="mx-auto sm:mx-0 h-12 w-12 rounded-full bg-white border-2 border-brand-500 text-brand-600 font-display font-bold flex items-center justify-center relative z-10 shadow-soft">
                {step.n}
              </div>
              <p className="font-semibold text-navy-800 mt-3">{step.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* List your spot CTA */}
      <section
        className="rounded-xl border border-navy-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, #eef4ff 0%, #eef1f6 100%)" }}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-200/30 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <p className="font-display text-lg sm:text-xl font-bold text-navy-900">Have an empty parking space?</p>
          <p className="text-sm text-gray-600 mt-1">Turn it into income — list it in minutes, we handle the rest.</p>
        </div>
        <Link href="/spots/new" className="btn-primary flex-none relative">List Your Spot</Link>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="font-display text-xl font-bold text-navy-900 mb-4">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="card-flat p-4 group">
              <summary className="font-medium text-navy-800 cursor-pointer list-none flex items-center justify-between">
                {f.q}
                <span className="text-gray-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-gray-500 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
