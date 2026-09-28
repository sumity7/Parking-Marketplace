import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";
import Booking from "@/models/Booking";
import { isValidObjectId, validateBookingTime } from "@/lib/validators";
import { notify } from "@/lib/notify";

// GET /api/bookings - bookings where I'm the renter OR the owner (?as=owner / ?as=renter)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const as = searchParams.get("as") || "renter";

    const filter = as === "owner" ? { owner: session.user.id } : { renter: session.user.id };
    const bookings = await Booking.find(filter)
      .populate("spot", "title address city photos")
      .populate("renter", "name phone ratingAvg")
      .populate("owner", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("List bookings error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// POST /api/bookings - renter books a spot for a time range
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "You must be logged in to book" }, { status: 401 });

    const { spotId, startTime, endTime } = await req.json();
    if (!spotId || !startTime || !endTime || !isValidObjectId(spotId)) {
      return NextResponse.json({ error: "Spot, start time and end time are required" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    await connectDB();
    const spot = await Spot.findById(spotId);
    if (!spot || spot.status !== "approved" || !spot.isActive) {
      return NextResponse.json({ error: "This spot is not available for booking" }, { status: 400 });
    }
    if (spot.owner.toString() === session.user.id) {
      return NextResponse.json({ error: "You cannot book your own spot" }, { status: 400 });
    }

    const timeError = validateBookingTime(start, end, spot.availability);
    if (timeError) {
      return NextResponse.json({ error: timeError }, { status: 422 });
    }

    // Prevent double-booking: reject if an overlapping confirmed/pending booking exists.
    // This narrows but doesn't eliminate the race between two simultaneous requests for
    // the same slot; a unique compound index would be needed for a hard guarantee.
    const overlap = await Booking.findOne({
      spot: spotId,
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (overlap) {
      return NextResponse.json({ error: "This spot is already booked for the selected time" }, { status: 409 });
    }

    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const totalPrice = hours * spot.pricePerHour;

    const booking = await Booking.create({
      spot: spot._id,
      renter: session.user.id,
      owner: spot.owner,
      startTime: start,
      endTime: end,
      hours,
      totalPrice,
      status: "pending",
    });

    notify(
      spot.owner,
      "booking_requested",
      "New booking request",
      `${session.user.name} requested to book "${spot.title}".`,
      "/dashboard"
    );

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("Create booking error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
