import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// POST /api/verify-request - a user asks admin to verify their identity
// (In a real product this would attach an uploaded ID document; kept simple here.)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, { verificationRequested: true });
    return NextResponse.json({ message: "Verification request submitted" });
  } catch (err) {
    console.error("Verify request error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
