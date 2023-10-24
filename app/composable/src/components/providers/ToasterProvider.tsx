// ToasterProvider.tsx
"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export default function ToasterProvider() {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
}
