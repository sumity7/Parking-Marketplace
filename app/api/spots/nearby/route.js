import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";

const MAX_RADIUS_METERS = 50000; // 50km cap — no unbounded radius queries
const DEFAULT_RADIUS_METERS = 5000;
const MAX_PAGE_LIMIT = 50;

// GET /api/spots/nearby?lat=..&lng=..&radius=5000&page=1&limit=20&vehicleType=car&maxPrice=100
// Public: approved + active spots within `radius` meters of (lat, lng), nearest first.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius = Math.min(MAX_RADIUS_METERS, Math.max(100, Number(searchParams.get("radius")) || DEFAULT_RADIUS_METERS));
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get("limit"), 10) || MAX_PAGE_LIMIT));
    const vehicleType = searchParams.get("vehicleType");
    const maxPrice = searchParams.get("maxPrice");

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Valid lat and lng are required" }, { status: 400 });
    }

    await connectDB();

    const query = { status: "approved", isActive: true };
    if (vehicleType) query.vehicleTypes = vehicleType;
    if (maxPrice && Number.isFinite(Number(maxPrice))) query.pricePerHour = { $lte: Number(maxPrice) };

    const [result] = await Spot.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distanceMeters",
          maxDistance: radius,
          query,
          spherical: true,
        },
      },
      {
        $facet: {
          spots: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { name: 1, verified: 1, ratingAvg: 1, ratingCount: 1 } }],
              },
            },
            { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const total = result.total[0]?.count || 0;
    return NextResponse.json({
      spots: result.spots,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Nearby spots error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
