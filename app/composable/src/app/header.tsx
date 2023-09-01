import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import darkMode from "@iconify/icons-ic/baseline-dark-mode";
import lightMode from "@iconify/icons-ic/baseline-light-mode";
import { aiModels } from "@/lib/cmn";
import { useGlobalContext } from "@/lib/context";

import Image from "next/image";

type HeaderProps = {};

export default function Header({}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const { aiModel: selectedModel, setAiModel: setSelectedModel } =
    useGlobalContext();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 border-b shadow-sm transition-all duration-300 opacity-85 bg-white text-black dark:border-gray-700 dark:bg-black-900 dark:text-gray-300">
      <div className=" px-4 md:flex md:items-center md:justify-between py-1">
        <div className=" px-4  md:flex md:items-center md:justify-between py-1">
          <span className="flex text-med tracking-normal transition-colors hover:text-gray-600 dark:hover:text-gray-400">
            <Image
              src="/images/logo.png"
              width={25}
              height={25}
              alt="logo"
              className="flex mr-1"
            />
            {/* Composable Parts */}
          </span>
        </div>
        <div className="flex ml-auto mr-4">
          <select
            className="flex mr-1"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {aiModels.map((model, index) => (
              <option key={index} value={model.value}>
                {model.name}
              </option>
            ))}
          </select>
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
