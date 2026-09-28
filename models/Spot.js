import mongoose from "mongoose";

// Simple recurring weekly availability, e.g. { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }
const AvailabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const SpotSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    address: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    vehicleTypes: {
      type: [String],
      enum: ["car", "bike", "suv"],
      default: ["car"],
    },
    photos: { type: [String], default: [] },
    availability: { type: [AvailabilitySlotSchema], default: [] },

    // Optional — older spots (or ones created before a location was picked) simply
    // won't appear in geospatial "nearby" queries; nothing else depends on this.
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    formattedAddress: { type: String, default: "" },
    // GeoJSON mirror of latitude/longitude, kept in sync in the API layer.
    // Coordinate order is [longitude, latitude] per the GeoJSON spec — NOT [lat, lng].
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }, // [lng, lat]
    },

    isActive: { type: Boolean, default: true }, // owner can pause listing
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // admin moderates new listings before they go live
    },
    rejectionReason: { type: String, default: "" },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SpotSchema.index({ city: "text", title: "text", address: "text" });
SpotSchema.index({ city: 1 });
SpotSchema.index({ status: 1 });
SpotSchema.index({ isActive: 1 });
SpotSchema.index({ owner: 1 });
SpotSchema.index({ ratingAvg: -1 });
SpotSchema.index({ createdAt: -1 });
// Most marketplace queries filter on all three together (status + isActive + city)
SpotSchema.index({ status: 1, isActive: 1, city: 1 });
// Sparse: only spots that actually have a location participate in $geoNear/$near queries
SpotSchema.index({ location: "2dsphere" }, { sparse: true });

export default mongoose.models.Spot || mongoose.model("Spot", SpotSchema);
