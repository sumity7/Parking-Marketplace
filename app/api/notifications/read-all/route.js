import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

// PATCH /api/notifications/read-all — marks every notification for this user as read
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await Notification.updateMany({ user: session.user.id, read: false }, { read: true });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
