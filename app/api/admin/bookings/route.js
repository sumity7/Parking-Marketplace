import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";

const MAX_PAGE_LIMIT = 100;

export async function GET(req) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get("limit"), 10) || MAX_PAGE_LIMIT));

    const [bookings, total] = await Promise.all([
      Booking.find()
        .populate("spot", "title city")
        .populate("renter", "name email")
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(),
    ]);

    return NextResponse.json({ bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("Admin list bookings error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
