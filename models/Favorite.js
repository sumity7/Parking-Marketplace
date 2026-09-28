import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    spot: { type: mongoose.Schema.Types.ObjectId, ref: "Spot", required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ user: 1, spot: 1 }, { unique: true }); // prevents duplicate saves
FavoriteSchema.index({ user: 1, createdAt: -1 }); // "My Saved Parking" listing order

export default mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);
