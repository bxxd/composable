"use client";
import React from "react";
import { ThemeProvider, useTheme } from "next-themes";

interface MyThemeProviderProps {
  children: any;
}

export default function MyThemeProvider({ children }: MyThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      value={{
        light: "light-theme",
        dark: "dark-theme",
      }}
    >
      {children}
    </ThemeProvider>
  );
}
