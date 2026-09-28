import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: { default: "ParkSpot — Find & Rent Parking Near You", template: "%s | ParkSpot" },
  description: "A peer-to-peer parking marketplace. List your empty space, or find a verified spot near you by the hour.",
  openGraph: {
    title: "ParkSpot — Find & Rent Parking Near You",
    description: "A peer-to-peer parking marketplace. List your empty space, or find a verified spot near you by the hour.",
    siteName: "ParkSpot",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ParkSpot — Find & Rent Parking Near You",
    description: "A peer-to-peer parking marketplace. List your empty space, or find a verified spot near you by the hour.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans flex flex-col">
        <Providers>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
