import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import { isValidObjectId } from "@/lib/validators";

const MAX_PAGE_LIMIT = 50;

// GET /api/favorites — the logged-in user's saved spots, newest first
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get("limit"), 10) || MAX_PAGE_LIMIT));

    const [favorites, total] = await Promise.all([
      Favorite.find({ user: session.user.id })
        .populate({
          path: "spot",
          populate: { path: "owner", select: "name verified ratingAvg ratingCount" },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Favorite.countDocuments({ user: session.user.id }),
    ]);

    // A favorited spot may since have been deleted — drop those rather than error
    const spots = favorites.filter((f) => f.spot).map((f) => f.spot);

    return NextResponse.json({ spots, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("List favorites error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// POST /api/favorites  body: { spotId } — save a spot (idempotent)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { spotId } = await req.json();
    if (!isValidObjectId(spotId)) {
      return NextResponse.json({ error: "Valid spotId is required" }, { status: 400 });
    }

    await connectDB();
    await Favorite.updateOne(
      { user: session.user.id, spot: spotId },
      { $setOnInsert: { user: session.user.id, spot: spotId } },
      { upsert: true }
    );

    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (err) {
    console.error("Add favorite error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
