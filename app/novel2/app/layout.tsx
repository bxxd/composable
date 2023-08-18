import "@/styles/globals.css";
// import "@/styles/prosemirror.css";
import "@/styles/tiptap.scss";

import { Metadata } from "next";
import { ReactNode } from "react";
import Providers from "./providers";
import Header from "./header";
import Sidebar from "./sidebar";

const title = "Composable";
const description = "Composable parts";

// export const metadata: Metadata = {
//   title,
//   description,
//   openGraph: {
//     title,
//     description,
//   },
//   twitter: {
//     title,
//     description,
//     card: "summary_large_image",
//     creator: "@steventey",
//   },
//   metadataBase: new URL("https://novel.sh"),
//   themeColor: "#ffffff",
// };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <Sidebar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
