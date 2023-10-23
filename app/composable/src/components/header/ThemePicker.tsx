"use client";
import React from "react";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import darkMode from "@iconify/icons-ic/baseline-dark-mode";
import lightMode from "@iconify/icons-ic/baseline-light-mode";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="flex justify-center items-center">
      <div className="justify-center inline-flex flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="p-1 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700 rounded transition-all duration-300"
        >
          <Icon
            icon={theme === "light" ? darkMode : lightMode}
            width="18"
            height="18"
            className="transition-colors"
          />
        </button>
      </div>
    </div>
  );
}
