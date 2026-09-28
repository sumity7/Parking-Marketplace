import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    spot: { type: mongoose.Schema.Types.ObjectId, ref: "Spot", required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    hours: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

BookingSchema.index({ spot: 1 });
BookingSchema.index({ renter: 1 });
BookingSchema.index({ owner: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });
// Matches the overlap check in POST /api/bookings (spot + status + time range)
BookingSchema.index({ spot: 1, status: 1, startTime: 1, endTime: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
