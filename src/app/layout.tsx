import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GrainOverlay } from "@/components/GrainOverlay";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const title = "HardCap";
const description =
  "HardCap is a personal expense and budget tracker: set hard spending caps per category, log expenses in seconds, and see your real-time remaining balance - no drift, no spreadsheets.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s - HardCap",
  },
  description,
  keywords: [
    "budget tracker",
    "expense tracker",
    "personal finance app",
    "spending caps",
    "monthly budget planner",
    "money lending tracker",
  ],
  authors: [{ name: "HardCap" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "HardCap",
    title,
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "HardCap | Know your number" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading the nonce middleware set on the request is what makes Next.js
  // apply it to the inline scripts/styles it injects for hydration — without
  // this read, the nonce in the CSP response header never matches anything
  // in the rendered HTML and the browser blocks every inline script/style.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GrainOverlay />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}