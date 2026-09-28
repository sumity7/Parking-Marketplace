import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-5xl mb-4" aria-hidden="true">🅿️</p>
      <h1 className="font-display text-2xl font-bold text-navy-900">Page not found</h1>
      <p className="text-gray-500 mt-1">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link href="/" className="btn-primary inline-block mt-6">Back to home</Link>
    </div>
  );
}
