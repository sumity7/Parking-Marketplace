import mongoose from "mongoose";
// Importing every model here (for side effects) guarantees they're all registered
// with Mongoose before any query runs — otherwise whichever route happens to be hit
// first after a cold start can 500 with "Schema hasn't been registered for model X"
// if it only imports the model it queries directly but .populate()s a ref to one
// it doesn't (e.g. Spot.find().populate("owner") needs the User model registered).
import "@/models/User";
import "@/models/Spot";
import "@/models/Booking";
import "@/models/Review";
import "@/models/Favorite";
import "@/models/Notification";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Cache the connection across hot-reloads / serverless invocations
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
