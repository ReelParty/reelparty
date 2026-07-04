import "./global.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

const siteUrl =
  process.env.NEXT_PUBLIC_WEB_ORIGIN ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ReelParty — Watch TikToks, Reels, Facebook & Shorts together",
  description:
    "Spin up a watch party, drop in TikToks, Reels, Facebook and YouTube Shorts, and react together in real time.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ReelParty",
    description: "Watch TikToks, Reels, Facebook & Shorts together",
    images: ["/api/og/default.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
