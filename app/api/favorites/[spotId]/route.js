import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import { isValidObjectId } from "@/lib/validators";

// DELETE /api/favorites/:spotId — unsave a spot
export async function DELETE(_req, { params }) {
  try {
    const { spotId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isValidObjectId(spotId)) return NextResponse.json({ error: "Invalid spot id" }, { status: 400 });

    await connectDB();
    await Favorite.deleteOne({ user: session.user.id, spot: spotId });

    return NextResponse.json({ favorited: false });
  } catch (err) {
    console.error("Remove favorite error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
