/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy — primary brand color, used for headings, nav, primary surfaces
        navy: {
          50: "#eef1f6",
          100: "#dce2ec",
          200: "#b3c0d6",
          300: "#8a9fc0",
          400: "#4d6699",
          500: "#1f3a66",
          600: "#162a4d",
          700: "#101f3a",
          800: "#0b1728",
          900: "#070f1b",
        },
        // Electric blue — accent for CTAs, links, focus states
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#b3cdff",
          300: "#80abff",
          400: "#4d84ff",
          500: "#2f6fed",
          600: "#1d54c9",
          700: "#183f97",
          800: "#152f6e",
          900: "#0f2350",
        },
        success: { 50: "#effaf1", 500: "#16a34a", 600: "#0f8a3d", 700: "#0c6e31" },
        warning: { 50: "#fefaeb", 500: "#d97706", 600: "#b25e05", 700: "#8a4904" },
        danger: { 50: "#fdf1f1", 500: "#dc2626", 600: "#b91c1c", 700: "#8f1616" },
        ink: "#161c2b",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 31, 58, 0.06), 0 1px 1px rgba(16, 31, 58, 0.04)",
        card: "0 1px 3px rgba(16, 31, 58, 0.08), 0 1px 2px rgba(16, 31, 58, 0.04)",
        lifted: "0 8px 24px rgba(16, 31, 58, 0.12)",
      },
    },
  },
  plugins: [],
};
