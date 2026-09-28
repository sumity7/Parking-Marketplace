import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    spot: { type: mongoose.Schema.Types.ObjectId, ref: "Spot" }, // present when reviewing a spot
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // "spot_review" = renter rating the parking spot/owner
    // "renter_review" = owner rating the renter (helps build renter trust score)
    type: { type: String, enum: ["spot_review", "renter_review"], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

ReviewSchema.index({ booking: 1, type: 1 }, { unique: true }); // one review per type per booking
ReviewSchema.index({ spot: 1 });
ReviewSchema.index({ reviewee: 1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
