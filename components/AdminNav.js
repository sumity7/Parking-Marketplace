"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Overview"],
  ["/admin/spots", "Spot Moderation"],
  ["/admin/users", "Users"],
  ["/admin/bookings", "Bookings"],
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
      {links.map(([href, label]) => (
        <Link key={href} href={href}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${pathname === href ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-navy-700"}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}
