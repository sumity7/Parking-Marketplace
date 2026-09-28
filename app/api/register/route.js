import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{0,20}$/;

// 5 registrations per 15 minutes per IP — generous for real users (nobody signs up
// 5 times in a row), tight enough to blunt automated account-creation spam.
const REGISTER_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(req) {
  try {
    const { allowed, retryAfterSeconds } = rateLimit(`register:${getClientIp(req)}`, REGISTER_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters" }, { status: 400 });
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 6 and 128 characters" }, { status: 400 });
    }
    if (phone && (typeof phone !== "string" || !PHONE_RE.test(phone))) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Normal registration is always a plain user. Admin accounts are only ever
    // created via `npm run seed:admin` (ADMIN_EMAIL/ADMIN_PASSWORD) or promoted
    // by an existing admin — never automatically from the signup form, since
    // that would let anyone become admin simply by registering first.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      phone: phone ? phone.trim() : "",
      role: "user",
    });

    return NextResponse.json(
      { message: "Account created", user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
