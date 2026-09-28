"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <p className="text-2xl" aria-hidden="true">🅿️</p>
        <h1 className="font-display text-xl font-bold text-navy-900 mt-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Log in to manage bookings and listings.</p>
      </div>
      <div className="card">
        {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Don&apos;t have an account? <Link href="/register" className="text-brand-600 font-medium">Sign up</Link>
      </p>
    </div>
  );
}
