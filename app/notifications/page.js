"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

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

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setLoading(false);
      return;
    }
    fetch("/api/notifications?limit=50")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .finally(() => setLoading(false));
  }, [session, status]);

  async function open(n) {
    if (!n.read) {
      setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      fetch(`/api/notifications/${n._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    }
    if (n.link) router.push(n.link);
  }

  if (status !== "loading" && !session) {
    return (
      <EmptyState
        title="Please log in"
        message="Log in to see your notifications."
        action={<Link href="/login" className="btn-primary">Log in</Link>}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-6">Notifications</h1>

      {loading ? (
        <div className="space-y-2"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications yet" message="You'll see booking, listing and account updates here." />
      ) : (
        <div className="card-flat divide-y divide-gray-100">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => open(n)}
              className={`block w-full text-left px-4 py-4 hover:bg-gray-50 ${!n.read ? "bg-brand-50/50" : ""}`}
            >
              <div className="flex items-start gap-2">
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-none" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-900">{n.title}</p>
                  {n.message && <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
