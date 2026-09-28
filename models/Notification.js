import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "booking_requested",
  "booking_confirmed",
  "booking_cancelled",
  "payment_paid",
  "booking_completed",
  "spot_submitted",
  "spot_approved",
  "spot_rejected",
  "verification_approved",
  "verification_rejected",
  "review_reminder",
];

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" }, // relative app path to navigate to on click
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export { NOTIFICATION_TYPES };
