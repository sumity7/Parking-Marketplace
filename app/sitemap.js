import { connectDB } from "@/lib/db";
import Spot from "@/models/Spot";

export default async function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  await connectDB();
  const spots = await Spot.find({ status: "approved", isActive: true }).select("_id updatedAt").lean();

  const spotEntries = spots.map((s) => ({
    url: `${baseUrl}/spots/${s._id}`,
    lastModified: s.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...spotEntries,
  ];
}
