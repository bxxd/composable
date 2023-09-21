import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import darkMode from "@iconify/icons-ic/baseline-dark-mode";
import lightMode from "@iconify/icons-ic/baseline-light-mode";
import Navigation from "./Navigation";
import Image from "next/image";
import { ReactNode } from "react";

type HeaderProps = { childrenComponents?: ReactNode[] };

export default function Header({ childrenComponents = [] }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const routes = [
    { path: "/work", label: "Workspace" },
    // { path: "/docs", label: "Docs" },
    { path: "/hub", label: "Hub" },
    // ... add more routes as necessary
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b shadow-sm transition-all duration-300 opacity-85 bg-white text-black dark:border-gray-700 dark:bg-black-900 dark:text-gray-300">
      <div className="px-4 md:flex md:items-center md:justify-between py-1">
        <div className="px-4 md:flex md:items-center md:justify-between py-1">
          <div className="flex-shrink-0 inline-block">
            <Image
              src="/images/logo3.png"
              width={25}
              height={25}
              alt="logo"
              className="mr-1"
            />
          </div>

          <div className="opacity-50 mr-5  font-serif">
            <a href="/">
              Composable Parts
              <span className="text-xs italic">&nbsp;wip</span>
            </a>
          </div>
          <div className="font-serif">
            <Navigation routes={routes} />
          </div>
        </div>
        <div className="flex ml-auto mr-4">
          {childrenComponents.map((component, index) => (
            <div key={index} className="mr-2">
              {component}
            </div>
          ))}
        </div>
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
