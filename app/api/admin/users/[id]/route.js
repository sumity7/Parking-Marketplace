import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isValidObjectId } from "@/lib/validators";
import { notify } from "@/lib/notify";

// PATCH /api/admin/users/:id  body: { action: "ban" | "unban" | "verify" | "unverify" }
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { action } = await req.json();
    const update = {
      ban: { banned: true },
      unban: { banned: false },
      verify: { verified: true, verificationRequested: false },
      unverify: { verified: false },
    }[action];

    if (!update) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    await connectDB();

    if (action === "ban") {
      const target = await User.findById(id);
      if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (target._id.toString() === session.user.id) {
        return NextResponse.json({ error: "You cannot ban your own account" }, { status: 400 });
      }
      if (target.role === "admin") {
        const otherActiveAdmins = await User.countDocuments({
          role: "admin",
          banned: false,
          _id: { $ne: target._id },
        });
        if (otherActiveAdmins === 0) {
          return NextResponse.json({ error: "Cannot ban the only remaining admin" }, { status: 400 });
        }
      }
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-passwordHash");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (action === "verify") {
      notify(user._id, "verification_approved", "You're verified", "Your identity verification was approved.", "/dashboard");
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
