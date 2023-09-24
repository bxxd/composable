import React from "react";
import { Icon } from "@iconify/react";
import heartIcon from "@iconify/icons-ic/baseline-favorite";

const Footer = () => {
  return (
    <footer className=" z-50 w-full border-t shadow-sm transition-all duration-300 opacity-85 bg-white text-black dark:border-gray-700 dark:bg-black-900 dark:text-gray-300">
      <div className="opacity-75 px-4 md:flex md:items-center md:justify-between py-1">
        <div className="text-center md:text-left font-serif">
          Made with{" "}
          <Icon
            icon="ph:heart-duotone"
            width={18}
            height={18}
            color="rgba(255, 0, 0, 0.5)" // 50% transparent red
            className="inline transition-colors"
          />{" "}
          by{" "}
          <a
            href="https://twitter.com/bri4nr33d"
            className="text-blue-500 hover:underline"
          >
            @bri4nr33d
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
