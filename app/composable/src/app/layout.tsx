import "@/styles/globals.css";
import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Composable Parts",
  description: "Generative text with Composable Parts",
  openGraph: {
    title: "Composable Parts",
    description: "Generative text with Composable Parts",
    url: "https://composable.parts/",
    siteName: "Composable Parts",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    creator: "@bri4nr33d",
    title: "Composable Parts",
    description: "Generative text with Composable Parts",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
