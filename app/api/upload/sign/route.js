import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isCloudinaryConfigured, createUploadSignature } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rateLimit";

// 30 signatures/hour/user — each covers one photo, so this comfortably allows
// several full listings (up to 8 photos each) per hour while blunting abuse of
// a compromised or malicious account generating unlimited signed uploads.
const UPLOAD_SIGN_LIMIT = { limit: 30, windowMs: 60 * 60 * 1000 };

// POST /api/upload/sign — issues a short-lived signature for a direct browser→Cloudinary
// upload. Returns 503 (not 500) when Cloudinary isn't configured so the client can show
// a clear "upload unavailable" state instead of a generic error.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed, retryAfterSeconds } = rateLimit(`upload-sign:${session.user.id}`, UPLOAD_SIGN_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Image upload is not configured on this server (missing Cloudinary credentials)." },
        { status: 503 }
      );
    }

    const params = createUploadSignature("parkspot/spots");
    return NextResponse.json(params);
  } catch (err) {
    console.error("Upload sign error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
