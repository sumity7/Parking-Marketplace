import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const MAX_PAGE_LIMIT = 100;

export async function GET(req) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get("limit"), 10) || MAX_PAGE_LIMIT));

    const [users, total] = await Promise.all([
      User.find()
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return NextResponse.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("List users error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
