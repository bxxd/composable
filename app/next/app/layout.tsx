import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import Header from "./header";
import Sidebar from "./sidebar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Composable",
  description: "Composable Parts Generative Text",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <Sidebar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
