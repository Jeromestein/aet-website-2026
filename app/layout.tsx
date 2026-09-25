import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./reference-style.css";
import "./scroll-stories.css";
import "./home-design.css";
export const metadata: Metadata = {
  manifest: "/site.webmanifest",
  title: "AET | Professional Translation & Evaluation Services",
  description:
    "Professional translations and credential evaluations trusted by USCIS, colleges, and government agencies nationwide.",
  openGraph: {
    title: "AET | Professional Translation & Evaluation Services",
    description:
      "Professional translation and foreign credential evaluation services.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
