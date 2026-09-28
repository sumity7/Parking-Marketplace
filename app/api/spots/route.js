import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";
import { escapeRegex, validateSpotInput } from "@/lib/validators";

const MAX_PAGE_LIMIT = 50;

// GET /api/spots?city=Lucknow&vehicleType=car&maxPrice=100&page=1&limit=20
// Public: only returns approved + active spots
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const vehicleType = searchParams.get("vehicleType");
    const maxPrice = searchParams.get("maxPrice");
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get("limit"), 10) || MAX_PAGE_LIMIT));

    const query = { status: "approved", isActive: true };
    if (city) query.city = new RegExp(escapeRegex(city), "i");
    if (vehicleType) query.vehicleTypes = vehicleType;
    if (maxPrice && Number.isFinite(Number(maxPrice))) query.pricePerHour = { $lte: Number(maxPrice) };

    const [spots, total] = await Promise.all([
      Spot.find(query)
        .populate("owner", "name verified ratingAvg ratingCount")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Spot.countDocuments(query),
    ]);

    return NextResponse.json({
      spots,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("List spots error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// POST /api/spots - create a new listing (goes to "pending" until admin approves)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "You must be logged in to list a spot" }, { status: 401 });
    }

    const body = await req.json();
    const { errors, clean } = validateSpotInput(body);
    if (errors.length) {
      return NextResponse.json({ error: errors[0] }, { status: 422 });
    }

    await connectDB();

    const spot = await Spot.create({
      owner: session.user.id,
      title: clean.title,
      description: clean.description || "",
      address: clean.address,
      city: clean.city,
      pricePerHour: clean.pricePerHour,
      vehicleTypes: clean.vehicleTypes && clean.vehicleTypes.length ? clean.vehicleTypes : ["car"],
      photos: clean.photos || [],
      availability: clean.availability || [],
      latitude: clean.latitude,
      longitude: clean.longitude,
      formattedAddress: clean.formattedAddress || "",
      location: clean.location,
      status: "pending",
    });

    return NextResponse.json({ spot }, { status: 201 });
  } catch (err) {
    console.error("Create spot error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
