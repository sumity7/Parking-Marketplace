/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet v4's <MapContainer> doesn't clean up after React's dev-only
  // double-invoke-effects check (StrictMode), so on every mount in dev it throws
  // "Map container is already initialized". This only affects the dev-mode double
  // render — production builds never double-invoke effects, so this doesn't reduce
  // any real StrictMode safety in what actually ships.
  reactStrictMode: false,
  // Pins the workspace root to this project — without it, Next.js 15 gets confused
  // by an unrelated lockfile in a parent directory and prints a spurious warning.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
