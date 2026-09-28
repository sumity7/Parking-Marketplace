import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";

// GET /api/my-spots - the logged-in user's own listings, in ANY status (pending/approved/rejected)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const spots = await Spot.find({ owner: session.user.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ spots });
  } catch (err) {
    console.error("List my spots error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
