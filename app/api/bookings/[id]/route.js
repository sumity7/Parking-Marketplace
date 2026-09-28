import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Spot from "@/models/Spot";
import Review from "@/models/Review";
import { isValidObjectId } from "@/lib/validators";
import { notify } from "@/lib/notify";

// Allowed booking.status transitions per action. Anything not listed here (e.g.
// confirming an already-confirmed booking, completing a cancelled one) is rejected.
const STATUS_TRANSITIONS = {
  confirm: { from: ["pending"], to: "confirmed" },
  cancel: { from: ["pending", "confirmed"], to: "cancelled" },
  complete: { from: ["confirmed"], to: "completed" },
};

// PATCH /api/bookings/:id
// body: { action: "confirm" | "cancel" | "mark_paid" | "complete" | "review", ...reviewFields }
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    await connectDB();
    const booking = await Booking.findById(id).populate("spot", "title");
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const spotTitle = booking.spot?.title || "your booking";

    const isOwner = booking.owner.toString() === session.user.id;
    const isRenter = booking.renter.toString() === session.user.id;
    if (!isOwner && !isRenter && session.user.role !== "admin") {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "confirm" || action === "cancel" || action === "complete") {
      if (action === "confirm" && !isOwner) {
        return NextResponse.json({ error: "Only the spot owner can confirm a booking" }, { status: 403 });
      }
      if (action === "complete" && !isOwner) {
        return NextResponse.json({ error: "Only the spot owner can mark a booking complete" }, { status: 403 });
      }
      const transition = STATUS_TRANSITIONS[action];
      if (!transition.from.includes(booking.status)) {
        return NextResponse.json(
          { error: `Cannot ${action} a booking that is currently ${booking.status}` },
          { status: 409 }
        );
      }
      booking.status = transition.to;

      if (action === "confirm") {
        notify(booking.renter, "booking_confirmed", "Booking confirmed", `Your booking for "${spotTitle}" was confirmed.`, "/dashboard");
      } else if (action === "cancel") {
        // Notify whichever party didn't take the action
        const notifyUserId = session.user.id === booking.renter.toString() ? booking.owner : booking.renter;
        notify(notifyUserId, "booking_cancelled", "Booking cancelled", `The booking for "${spotTitle}" was cancelled.`, "/dashboard");
      } else if (action === "complete") {
        notify(booking.renter, "booking_completed", "Booking completed", `Your booking for "${spotTitle}" is complete. Leave a review?`, "/dashboard");
      }
    } else if (action === "mark_paid") {
      // NOTE: this simulates payment success. Wire this to a real Razorpay
      // payment-verification webhook before using this in production.
      if (!isRenter) return NextResponse.json({ error: "Only the renter can pay" }, { status: 403 });
      if (booking.status === "cancelled" || booking.status === "completed") {
        return NextResponse.json({ error: `Cannot pay for a booking that is ${booking.status}` }, { status: 409 });
      }
      if (booking.paymentStatus === "paid") {
        return NextResponse.json({ error: "This booking is already paid" }, { status: 409 });
      }
      booking.paymentStatus = "paid";
      notify(booking.owner, "payment_paid", "Payment received", `Payment received for "${spotTitle}".`, "/dashboard");
    } else if (action === "review") {
      if (booking.status !== "completed") {
        return NextResponse.json({ error: "You can only review a completed booking" }, { status: 400 });
      }
      const { rating, comment } = body;
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
      if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000)) {
        return NextResponse.json({ error: "Comment must be under 1000 characters" }, { status: 400 });
      }

      const reviewType = isRenter ? "spot_review" : "renter_review";
      const reviewee = isRenter ? booking.owner : booking.renter;

      const existing = await Review.findOne({ booking: booking._id, type: reviewType });
      if (existing) {
        return NextResponse.json({ error: "You already reviewed this booking" }, { status: 409 });
      }

      await Review.create({
        booking: booking._id,
        spot: isRenter ? booking.spot._id : undefined,
        reviewer: session.user.id,
        reviewee,
        type: reviewType,
        rating,
        comment: comment ? comment.trim() : "",
      });

      // Recompute aggregate rating
      if (isRenter) {
        const spotReviews = await Review.find({ spot: booking.spot._id, type: "spot_review" });
        const avg = spotReviews.reduce((sum, r) => sum + r.rating, 0) / spotReviews.length;
        await Spot.findByIdAndUpdate(booking.spot._id, { ratingAvg: avg, ratingCount: spotReviews.length });
      } else {
        const renterReviews = await Review.find({ reviewee: booking.renter, type: "renter_review" });
        const avg = renterReviews.reduce((sum, r) => sum + r.rating, 0) / renterReviews.length;
        await User.findByIdAndUpdate(booking.renter, { ratingAvg: avg, ratingCount: renterReviews.length });
      }

      return NextResponse.json({ message: "Review submitted" });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await booking.save();
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("Update booking error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
