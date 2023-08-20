"use client";

import Workspace from "@/components/workspace";
import Tiptap from "@/components/editor";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
};

export default function Home() {
  return (
    <>
      <ThemeProvider
        attribute="class"
        value={{
          light: "light-theme",
          dark: "dark-theme",
        }}
      >
        <ToasterProvider />
        <main className="App container flex flex-col gap-4 max-w-[100ch]">
          <Tiptap />
        </main>
      </ThemeProvider>
    </>
  );
}
