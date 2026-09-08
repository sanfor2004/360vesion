import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "360Vision — Local Property Tour Studio",
    template: "%s · 360Vision",
  },
  description:
    "A local studio for building and viewing portable interactive 360° property tours.",
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
