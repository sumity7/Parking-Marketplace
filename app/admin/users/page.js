"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import EmptyState from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => {
      setUsers(d.users || []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function act(id, action) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Action failed", "error");
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-4">Users</h1>
      <AdminNav />

      {loading ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
      ) : users.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card-flat overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Verified</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4">{u.name}</td>
                    <td className="py-3 px-4 text-gray-500">{u.email}</td>
                    <td className="py-3 px-4 capitalize">{u.role}</td>
                    <td className="py-3 px-4">
                      {u.verified ? <span className="badge-success">Verified</span> : u.verificationRequested ? <span className="badge-warning">Requested</span> : "—"}
                    </td>
                    <td className="py-3 px-4">{u.banned ? <span className="badge-danger">Banned</span> : <span className="badge-success">Active</span>}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {!u.verified ? (
                          <button onClick={() => act(u._id, "verify")} className="btn-primary btn-sm">Verify</button>
                        ) : (
                          <button onClick={() => act(u._id, "unverify")} className="btn-secondary btn-sm">Unverify</button>
                        )}
                        {u.banned ? (
                          <button onClick={() => act(u._id, "unban")} className="btn-secondary btn-sm">Unban</button>
                        ) : (
                          <button onClick={() => act(u._id, "ban")} className="btn-danger btn-sm">Ban</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u._id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  {u.banned ? <span className="badge-danger">Banned</span> : <span className="badge-success">Active</span>}
                </div>
                <div className="flex gap-2 flex-wrap mt-2 text-xs text-gray-500">
                  <span className="capitalize">{u.role}</span>
                  {u.verified ? <span className="badge-success">Verified</span> : u.verificationRequested ? <span className="badge-warning">Requested</span> : null}
                </div>
                <div className="flex gap-2 mt-3">
                  {!u.verified ? (
                    <button onClick={() => act(u._id, "verify")} className="btn-primary btn-sm">Verify</button>
                  ) : (
                    <button onClick={() => act(u._id, "unverify")} className="btn-secondary btn-sm">Unverify</button>
                  )}
                  {u.banned ? (
                    <button onClick={() => act(u._id, "unban")} className="btn-secondary btn-sm">Unban</button>
                  ) : (
                    <button onClick={() => act(u._id, "ban")} className="btn-danger btn-sm">Ban</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
