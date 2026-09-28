"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";

function NavLink({ href, children, onClick }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${active ? "text-brand-700" : "text-navy-600 hover:text-navy-900"}`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-display font-bold text-navy-800 flex items-center gap-1.5">
          <span aria-hidden="true">🅿️</span> ParkSpot
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/">Find Parking</NavLink>

          {status === "loading" ? null : session ? (
            <>
              <NavLink href="/spots/new">List Your Spot</NavLink>
              <NavLink href="/saved">Saved</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
              {session.user.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
              <NotificationBell />
              <div className="h-5 w-px bg-gray-200" />
              <span className="text-sm text-gray-600">Hi, {session.user.name?.split(" ")[0]}</span>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>
              <Link href="/register" className="btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </nav>

        <button
          className="md:hidden p-2 -mr-2 text-navy-700"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-3">
          <NavLink href="/" onClick={() => setMobileOpen(false)}>Find Parking</NavLink>
          {status !== "loading" && session ? (
            <>
              <NavLink href="/spots/new" onClick={() => setMobileOpen(false)}>List Your Spot</NavLink>
              <NavLink href="/saved" onClick={() => setMobileOpen(false)}>Saved</NavLink>
              <NavLink href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
              {session.user.role === "admin" && (
                <NavLink href="/admin" onClick={() => setMobileOpen(false)}>Admin</NavLink>
              )}
              <NavLink href="/notifications" onClick={() => setMobileOpen(false)}>Notifications</NavLink>
              <div className="h-px w-full bg-gray-100 my-1" />
              <span className="text-sm text-gray-600">Signed in as {session.user.name}</span>
              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                className="btn-secondary btn-sm self-start"
              >
                Logout
              </button>
            </>
          ) : (
            status !== "loading" && (
              <>
                <NavLink href="/login" onClick={() => setMobileOpen(false)}>Login</NavLink>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn-sm self-start">
                  Sign Up
                </Link>
              </>
            )
          )}
        </nav>
      )}
    </header>
  );
}
