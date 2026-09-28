import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { isValidObjectId } from "@/lib/validators";

// PATCH /api/notifications/:id  body: { read: true }
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    const { read } = await req.json();
    if (typeof read !== "boolean") {
      return NextResponse.json({ error: "read must be true or false" }, { status: 400 });
    }

    await connectDB();
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { read },
      { new: true }
    );
    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    return NextResponse.json({ notification });
  } catch (err) {
    console.error("Update notification error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
