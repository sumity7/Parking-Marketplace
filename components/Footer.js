import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-display font-bold text-xs"
              style={{ backgroundImage: "linear-gradient(135deg, #2f6fed, #183f97)" }}
              aria-hidden="true"
            >
              P
            </span>
            <p className="font-display font-bold text-navy-800 text-lg">ParkSpot</p>
          </div>
          <p className="text-sm text-gray-500">Rent a parking spot from a verified local owner, by the hour.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-700 mb-3">Marketplace</p>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-brand-600">Find Parking</Link></li>
            <li><Link href="/spots/new" className="hover:text-brand-600">List Your Spot</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-700 mb-3">Account</p>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link href="/login" className="hover:text-brand-600">Log in</Link></li>
            <li><Link href="/register" className="hover:text-brand-600">Sign up</Link></li>
            <li><Link href="/dashboard" className="hover:text-brand-600">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-700 mb-3">Trust &amp; safety</p>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>Verified owners</li>
            <li>Moderated listings</li>
            <li>Booking protection</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} ParkSpot. All rights reserved.
      </div>
    </footer>
  );
}
