import Navigation from "./Navigation";
import Image from "next/image";
import { ReactNode } from "react";
// import ThemePicker from "./ThemePicker";

type HeaderProps = { childrenComponents?: ReactNode[] };

export default function Header({ childrenComponents = [] }: HeaderProps) {
  const routes = [
    { path: "/work", label: "Workspace" },
    { path: "/docs", label: "Docs" },
    { path: "/hub", label: "Hub" },
    // ... add more routes as necessary
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b shadow-sm transition-all duration-300 opacity-85 bg-white text-black dark:border-gray-700 dark:bg-black-900 dark:text-gray-300">
      <div className="px-4 md:flex md:items-center md:justify-between py-1">
        <div className="px-4 md:flex md:items-center md:justify-between py-1">
          <div className="flex select-none justify-center pt-0">
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
              Composable Parts
              <span className="text-xs italic">&nbsp;wip</span>
            </div>
          </div>
          <div className="font-serif">
            <Navigation routes={routes} />
          </div>
        </div>
        {childrenComponents.length > 0 && (
          <div className=" ml-auto inline-flex flex-shrink-0">
            <div className="flex ml-1 mr-1 ">
              {childrenComponents.map((component, index) => (
                <div key={index} className="mr-2">
                  {component}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* <ThemePicker /> */}
      </div>
    </header>
  );
}
