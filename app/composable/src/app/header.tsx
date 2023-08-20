import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import darkMode from "@iconify/icons-ic/baseline-dark-mode";
import lightMode from "@iconify/icons-ic/baseline-light-mode";

import Image from "next/image";

export default function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 border-b dark:border-gray-700 opacity-75 dark:bg-black-900 text-black dark:text-gray-300 shadow-sm transition-all duration-300">
      <div className="container px-4 md:flex md:items-center md:justify-between py-1">
        <span className="flex text-med tracking-normal transition-colors hover:text-gray-600 dark:hover:text-gray-400">
          <Image
            src="/images/logo.png"
            width={25}
            height={25}
            alt="logo"
            className="flex mr-1"
          />
          Composable Parts
        </span>
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
    </header>
  );
}
