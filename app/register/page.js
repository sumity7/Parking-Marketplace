"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // Auto-login right after successful registration
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <span
          className="inline-flex h-12 w-12 rounded-xl items-center justify-center text-white font-display font-bold text-lg shadow-soft"
          style={{ backgroundImage: "linear-gradient(135deg, #2f6fed, #183f97)" }}
          aria-hidden="true"
        >
          P
        </span>
        <h1 className="font-display text-xl font-bold text-navy-900 mt-3">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">List a spot or start booking in minutes.</p>
      </div>
      <div className="card shadow-lifted">
        {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Full name</label>
            <input required minLength={2} maxLength={100} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
      </div>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Already have an account? <Link href="/login" className="text-brand-600 font-medium">Log in</Link>
      </p>
    </div>
  );
}
