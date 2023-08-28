"use client";

import Workspace from "@/components/workspace";
// import Tiptap from "@/components/editor";
import Header from "./header";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { GlobalContext } from "@/lib/cmn";

// import useLocalStorage from "@/lib/hooks/use-local-storage";

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
};

export default function Home() {
  const [aiModel, setAiModel] = useState("meta-llama/llama-2-70b-chat");

  return (
    <>
      <GlobalContext.Provider value={{ aiModel, setAiModel }}>
        <ThemeProvider
          attribute="class"
          value={{
            light: "light-theme",
            dark: "dark-theme",
          }}
        >
          <Header />
          <main className="App container flex flex-col gap-4">
            <Workspace />
          </main>
          <ToasterProvider />
        </ThemeProvider>
      </GlobalContext.Provider>
    </>
  );
}
