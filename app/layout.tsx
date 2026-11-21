import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
  Sora,
} from "next/font/google";
import "./globals.css";

// Sora is the logo typeface, so headings sound like the brand.
const heading = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

// Inter stays readable at small sizes, which is where students read feedback.
const body = Inter({ variable: "--font-inter", subsets: ["latin"] });

// Mono is for small labels, numbers and the live status only.
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400"],
});

// Sora and Inter have no Devanagari; Noto sits comfortably next to Inter.
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "Ambrace", template: "%s · Ambrace" },
  description: "Practise your viva out loud, and see where you stand.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // Nothing here is public: every page sits behind sign-in.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0B0B10" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${mono.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
