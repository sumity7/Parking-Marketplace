import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Shared helper: returns the session if the caller is an admin, otherwise null
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}
