import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "360Vision — the community for 360° creators",
    template: "%s · 360Vision",
  },
  description:
    "Interactive 360° panorama tours with a hotspot authoring studio. Build, publish and share immersive tours.",
  openGraph: {
    siteName: "360Vision",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Panorama drag/pinch should own the gesture; don't let the page zoom.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14171c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
