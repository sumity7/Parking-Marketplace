import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

// Formats allowed for a direct browser→Cloudinary upload. Signed here (not just
// checked client-side) so a request crafted to skip our UI's own file-type check
// still gets rejected by Cloudinary itself — the client-side check is a UX nicety,
// this is the actual enforcement.
const ALLOWED_FORMATS = "jpg,jpeg,png,webp";

// Generates the parameters a browser needs to upload a file straight to Cloudinary
// (no image bytes pass through our server). Throws if Cloudinary isn't configured —
// callers must check isCloudinaryConfigured() first and fail gracefully.
export function createUploadSignature(folder = "parkspot") {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder, allowed_formats: ALLOWED_FORMATS };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
    allowedFormats: ALLOWED_FORMATS,
  };
}
