import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import darkMode from "@iconify/icons-ic/baseline-dark-mode";
import lightMode from "@iconify/icons-ic/baseline-light-mode";

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
            <option value="openai/gpt-3.5-turbo">OpenAI: GPT-3.5 Turbo</option>
            <option value="openai/gpt-3.5-turbo-16k">
              OpenAI: GPT-3.5 Turbo 16k
            </option>
            <option value="openai/gpt-4">OpenAI: GPT-4</option>
            <option value="openai/gpt-4-32k">OpenAI: GPT-4 32k</option>
            <option value="anthropic/claude-2">Anthropic: Claude v2</option>
            <option value="anthropic/claude-instant-v1">
              Anthropic: Claude Instant v1
            </option>
            <option value="google/palm-2-chat-bison">
              Google: PaLM 2 Bison
            </option>
            <option value="google/palm-2-codechat-bison">
              Google: PaLM 2 Bison (Code Chat)
            </option>
            <option value="meta-llama/llama-2-13b-chat">
              Meta: Llama v2 13B Chat (beta)
            </option>
            <option value="meta-llama/llama-2-70b-chat">
              Meta: Llama v2 70B Chat (beta)
            </option>
            <option value="nousresearch/nous-hermes-llama2-13b">
              Nous: Hermes Llama2 13B (beta)
            </option>
            <option value="mancer/weaver">Mancer: Weaver 12k (alpha)</option>
            <option value="gryphe/mythomax-L2-13b">
              Gryphe: MythoMax L2 13B (beta)
            </option>
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
