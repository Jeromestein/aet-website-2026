import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./reference-style.css";
import "./scroll-stories.css";
export const metadata: Metadata = {
  manifest: "/site.webmanifest",
  title: "AET | Your next chapter. Recognized.",
  description:
    "Move forward with professional credential evaluations and certified translations. American Education and Translation Services, serving your next chapter since 2009.",
  openGraph: {
    title: "AET | Your next chapter. Recognized.",
    description:
      "Credential evaluation and professional translation, with people who care about what comes next.",
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
