import React from "react";
import { version } from "@/lib/version";
// import { Icon } from "@iconify/react";
// import heartFill from "@iconify/icons-ph/heart-fill";

const Footer = () => {
  return (
    <footer className=" z-50 w-full border-t shadow-sm transition-all duration-300 opacity-85 dark:border-gray-700 dark:bg-black-900 dark:text-gray-300 flex">
      <div className="opacity-75 px-4 md:flex md:items-center md:justify-between py-1 prose dark:prose-invert text-sm">
        <div className="text-center md:text-left font-serif flex">
          Made with{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            className="mx-1 px-1"
            viewBox="0 0 256 256"
          >
            <path
              fill="#aaa"
              d="M240 94c0 70-103.79 126.66-108.21 129a8 8 0 0 1-7.58 0C119.79 220.66 16 164 16 94a62.07 62.07 0 0 1 62-62c20.65 0 38.73 8.88 50 23.89C139.27 40.88 157.35 32 178 32a62.07 62.07 0 0 1 62 62Z"
            />
          </svg>{" "}
          in Darien, CT{" "}
          <a
            href="https://twitter.com/bri4nr33d"
            className="hover:underline mx-1"
          >
            @bri4nr33d
          </a>
        </div>
      </div>
      <div className="opacity-50 text-xs font-serif md:text-right prose dark:prose-invert text-center flex ml-auto mr-2 items-center">
        {"v" + version}
      </div>
    </footer>
  );
};

export default Footer;
