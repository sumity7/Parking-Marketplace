"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // light polling — no push infra here
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setLoaded(true);
    } catch {
      // silent — the bell just won't update this cycle
    }
  }

  async function markAllRead() {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  async function openNotification(n) {
    setOpen(false);
    if (!n.read) {
      setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/notifications/${n._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 rounded-full hover:bg-gray-100 text-navy-700"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-danger-500 text-white text-[10px] leading-none rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lifted z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-navy-900 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 font-medium">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!loaded ? (
              <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openNotification(n)}
                  className={`block w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${!n.read ? "bg-brand-50/50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-none" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>}
                      <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center text-xs font-medium text-brand-600 py-2.5 border-t border-gray-100 hover:bg-gray-50">
              View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
