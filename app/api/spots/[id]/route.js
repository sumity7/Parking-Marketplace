import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";
import Review from "@/models/Review";
import { isValidObjectId, validateSpotInput } from "@/lib/validators";

// GET /api/spots/:id - spot detail + its reviews.
// Public callers only ever see approved + active listings; a pending/rejected/paused
// listing is only visible to its owner or an admin, so it can't leak via a direct URL.
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    await connectDB();
    const spot = await Spot.findById(id).populate("owner", "name verified ratingAvg ratingCount").lean();
    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const isPublic = spot.status === "approved" && spot.isActive;
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      const isOwner = session?.user?.id === spot.owner?._id?.toString();
      const isAdmin = session?.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Spot not found" }, { status: 404 });
      }
    }

    const reviews = await Review.find({ spot: id, type: "spot_review" })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ spot, reviews });
  } catch (err) {
    console.error("Get spot error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// PUT /api/spots/:id - owner edits their own listing. Editing resets status to "pending" for re-approval.
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    await connectDB();
    const spot = await Spot.findById(id);
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    if (spot.owner.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
    }

    const body = await req.json();
    const { errors, clean } = validateSpotInput(body, { partial: true });
    if (errors.length) {
      return NextResponse.json({ error: errors[0] }, { status: 422 });
    }

    Object.entries(clean).forEach(([field, value]) => {
      spot[field] = value;
    });

    // Re-moderate only when a core listing detail actually changed — pausing/resuming
    // (isActive-only) shouldn't send an already-approved listing back through review.
    const CORE_FIELDS = ["title", "description", "address", "city", "pricePerHour", "vehicleTypes", "photos", "availability", "location"];
    const changedCoreField = CORE_FIELDS.some((field) => field in clean);
    if (session.user.role !== "admin" && changedCoreField) {
      spot.status = "pending";
      spot.rejectionReason = "";
    }

    await spot.save();
    return NextResponse.json({ spot });
  } catch (err) {
    console.error("Update spot error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// DELETE /api/spots/:id - owner or admin deletes a listing
export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    await connectDB();
    const spot = await Spot.findById(id);
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    if (spot.owner.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "You can only delete your own listings" }, { status: 403 });
    }

    await spot.deleteOne();
    return NextResponse.json({ message: "Spot deleted" });
  } catch (err) {
    console.error("Delete spot error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
