"use client";

import Header from "@/components/header/Header";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { GlobalProvider } from "@/lib/context";

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
};

export default function Page() {
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
          <main className="App  flex flex-col gap-4">Hi There!</main>
          <ToasterProvider />
        </ThemeProvider>
      </GlobalProvider>
    </>
  );
}
