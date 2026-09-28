import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";
import { isValidObjectId } from "@/lib/validators";
import { notify } from "@/lib/notify";

// PATCH /api/admin/spots/:id  body: { status: "approved" | "rejected" }
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    const { status, reason } = await req.json();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status must be approved or rejected" }, { status: 400 });
    }
    if (reason !== undefined && (typeof reason !== "string" || reason.length > 500)) {
      return NextResponse.json({ error: "Reason must be under 500 characters" }, { status: 400 });
    }

    await connectDB();
    const update = { status, rejectionReason: status === "rejected" ? (reason || "").trim() : "" };
    const spot = await Spot.findByIdAndUpdate(id, update, { new: true });
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    if (status === "approved") {
      notify(spot.owner, "spot_approved", "Listing approved", `"${spot.title}" is now live on ParkSpot.`, "/dashboard");
    } else {
      notify(
        spot.owner,
        "spot_rejected",
        "Listing rejected",
        spot.rejectionReason ? `"${spot.title}" was rejected: ${spot.rejectionReason}` : `"${spot.title}" was rejected.`,
        `/spots/${spot._id}/edit`
      );
    }

    return NextResponse.json({ spot });
  } catch (err) {
    console.error("Admin update spot error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    await connectDB();
    const spot = await Spot.findByIdAndDelete(id);
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    return NextResponse.json({ message: "Spot removed" });
  } catch (err) {
    console.error("Admin delete spot error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
