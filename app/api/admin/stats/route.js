import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Spot from "@/models/Spot";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await connectDB();

    const [totalUsers, totalSpots, pendingSpots, totalBookings, paidAgg] = await Promise.all([
      User.countDocuments(),
      Spot.countDocuments(),
      Spot.countDocuments({ status: "pending" }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, gmv: { $sum: "$totalPrice" } } },
      ]),
    ]);

    const gmv = paidAgg[0]?.gmv || 0;
    const commissionRate = 0.12; // 12% platform commission - adjust as needed
    const revenue = Math.round(gmv * commissionRate);

    return NextResponse.json({
      totalUsers,
      totalSpots,
      pendingSpots,
      totalBookings,
      gmv,
      revenue,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
