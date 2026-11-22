import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// The same faces as the portal, so the panel reads as part of it.
const sans = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin", "latin-ext"] });
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Tripyfull assistant",
  description: "The AI trip planner inside Tripyfull",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
