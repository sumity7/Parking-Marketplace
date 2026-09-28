import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

// Fire-and-forget notification creation — a failure here must never break the
// booking/moderation transaction that triggered it, so errors are only logged.
export async function notify(userId, type, title, message, link = "", metadata = {}) {
  try {
    await connectDB();
    await Notification.create({ user: userId, type, title, message, link, metadata });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
