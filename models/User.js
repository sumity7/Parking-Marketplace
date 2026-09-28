import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    banned: { type: Boolean, default: false },
    phone: { type: String, default: "" },

    // Trust & verification
    verified: { type: Boolean, default: false }, // admin marks true after ID check
    verificationRequested: { type: Boolean, default: false },

    // Aggregate rating as a USER (renter reputation, computed from reviews left by owners)
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
