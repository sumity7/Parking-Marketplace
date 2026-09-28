import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";

const VALID_STATUSES = ["pending", "approved", "rejected"];
const MAX_PAGE_LIMIT = 100;

// GET /api/admin/spots?status=pending - list ALL spots regardless of status, for moderation
export async function GET(req) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get("limit"), 10) || MAX_PAGE_LIMIT));

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const query = status ? { status } : {};
    const [spots, total] = await Promise.all([
      Spot.find(query)
        .populate("owner", "name email verified")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Spot.countDocuments(query),
    ]);

    return NextResponse.json({ spots, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("Admin list spots error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
