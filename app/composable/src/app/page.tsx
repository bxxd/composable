"use client";

import Workspace from "@/components/workspace";
// import Tiptap from "@/components/editor";
import Header from "@/components/header";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";
// import { GlobalContext } from "@/lib/context";
import { GlobalProvider } from "@/lib/context";
import { JSONContent } from "@tiptap/react";
import { readFromLocalStorage } from "@/lib/utils";

// import useLocalStorage from "@/lib/hooks/use-local-storage";

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
};

export default function Home() {
  return (
    <>
      <GlobalProvider>
        <ThemeProvider
          attribute="class"
          value={{
            light: "light-theme",
            dark: "dark-theme",
          }}
        >
          <Header />
          <main className="App  flex flex-col gap-4">
            <Workspace />
          </main>
          <ToasterProvider />
        </ThemeProvider>
      </GlobalProvider>
    </>
  );
}
