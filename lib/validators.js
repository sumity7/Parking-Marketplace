import mongoose from "mongoose";

export function isValidObjectId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

// Escapes regex metacharacters so user search input can't build an
// unintended (or expensive/ReDoS-prone) pattern.
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const VALID_VEHICLE_TYPES = ["car", "bike", "suv"];
const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_RE = /^https?:\/\/.+/i;

// Validates + normalizes spot fields shared by create (POST) and edit (PUT).
// With `partial: true`, only fields present in `body` are checked (used for edits).
export function validateSpotInput(body, { partial = false } = {}) {
  const errors = [];
  const clean = {};

  const has = (field) => !partial || body[field] !== undefined;

  if (has("title")) {
    if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 120) {
      errors.push("Title must be between 3 and 120 characters");
    } else {
      clean.title = body.title.trim();
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 2000) {
      errors.push("Description must be under 2000 characters");
    } else {
      clean.description = body.description.trim();
    }
  }

  if (has("address")) {
    if (typeof body.address !== "string" || body.address.trim().length < 3 || body.address.trim().length > 300) {
      errors.push("Address must be between 3 and 300 characters");
    } else {
      clean.address = body.address.trim();
    }
  }

  if (has("city")) {
    if (typeof body.city !== "string" || body.city.trim().length < 2 || body.city.trim().length > 100) {
      errors.push("City must be between 2 and 100 characters");
    } else {
      clean.city = body.city.trim();
    }
  }

  if (has("pricePerHour")) {
    const price = Number(body.pricePerHour);
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      errors.push("Price per hour must be a number between 0 and 100000");
    } else {
      clean.pricePerHour = price;
    }
  }

  if (body.vehicleTypes !== undefined) {
    const types = body.vehicleTypes;
    if (
      !Array.isArray(types) ||
      types.length === 0 ||
      types.length > VALID_VEHICLE_TYPES.length ||
      !types.every((v) => VALID_VEHICLE_TYPES.includes(v))
    ) {
      errors.push(`Vehicle types must be a non-empty list of: ${VALID_VEHICLE_TYPES.join(", ")}`);
    } else {
      clean.vehicleTypes = [...new Set(types)];
    }
  }

  if (body.photos !== undefined) {
    const photos = body.photos;
    if (
      !Array.isArray(photos) ||
      photos.length > 10 ||
      !photos.every((p) => typeof p === "string" && p.length <= 2000 && (p === "" || URL_RE.test(p)))
    ) {
      errors.push("Photos must be a list of valid image URLs (max 10)");
    } else {
      clean.photos = photos.filter(Boolean);
    }
  }

  if (body.availability !== undefined) {
    const availability = body.availability;
    const valid =
      Array.isArray(availability) &&
      availability.length <= 50 &&
      availability.every(
        (slot) =>
          slot &&
          VALID_DAYS.includes(slot.dayOfWeek) &&
          TIME_RE.test(slot.startTime) &&
          TIME_RE.test(slot.endTime) &&
          slot.startTime < slot.endTime
      );
    if (!valid) {
      errors.push("Availability slots need a valid day, and a start time before the end time");
    } else {
      clean.availability = availability.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      errors.push("isActive must be true or false");
    } else {
      clean.isActive = body.isActive;
    }
  }

  // Latitude/longitude are optional but must be provided together, or not at all.
  if (body.latitude !== undefined || body.longitude !== undefined) {
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.push("Location coordinates are invalid");
    } else {
      clean.latitude = lat;
      clean.longitude = lng;
      clean.location = { type: "Point", coordinates: [lng, lat] };
      if (body.formattedAddress !== undefined) {
        if (typeof body.formattedAddress !== "string" || body.formattedAddress.length > 300) {
          errors.push("Formatted address must be under 300 characters");
        } else {
          clean.formattedAddress = body.formattedAddress.trim();
        }
      }
    }
  }

  return { errors, clean };
}

const MIN_BOOKING_MINUTES = 30;
const MAX_BOOKING_HOURS = 24 * 14; // 14 days

// Validates a requested booking time range against basic sanity rules and the
// spot's own weekly availability. Booking must fall on a single calendar day
// (matches how availability slots + hourly pricing are modeled) within a slot
// that covers the whole requested range.
export function validateBookingTime(start, end, availability) {
  if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end)) {
    return "Invalid start or end time";
  }
  if (!(start < end)) {
    return "End time must be after start time";
  }
  if (start.getTime() < Date.now() - 60 * 1000) {
    return "Booking cannot start in the past";
  }
  const minutes = (end - start) / (1000 * 60);
  if (minutes < MIN_BOOKING_MINUTES) {
    return `Minimum booking duration is ${MIN_BOOKING_MINUTES} minutes`;
  }
  if (minutes > MAX_BOOKING_HOURS * 60) {
    return `Maximum booking duration is ${MAX_BOOKING_HOURS} hours`;
  }

  if (Array.isArray(availability) && availability.length > 0) {
    if (start.getDay() !== end.getDay()) {
      return "Bookings can't span past midnight into the next day — please book each day separately";
    }
    const startHHmm = start.toTimeString().slice(0, 5);
    const endHHmm = end.toTimeString().slice(0, 5);
    const fits = availability.some(
      (slot) => slot.dayOfWeek === start.getDay() && slot.startTime <= startHHmm && slot.endTime >= endHHmm
    );
    if (!fits) {
      return "This spot is not available for the selected day/time";
    }
  }

  return null;
}
