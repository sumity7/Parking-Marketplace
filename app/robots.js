export default function robots() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/saved",
        "/notifications",
        "/api",
        "/login",
        "/register",
        "/spots/new",
        "/spots/*/edit",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
