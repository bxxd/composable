import React from "react";
import { Icon } from "@iconify/react";
import heartIcon from "@iconify/icons-ic/baseline-favorite";

const Footer = () => {
  return (
    <footer className=" z-50 w-full border-t shadow-sm transition-all duration-300 opacity-85 bg-white text-black dark:border-gray-700 dark:bg-black-900 dark:text-gray-300">
      <div className="opacity-75 px-4 md:flex md:items-center md:justify-between py-1 prose dark:prose-invert">
        <div className="text-center md:text-left font-serif flex">
          Made with{" "}
          <Icon
            icon="ph:heart-fill"
            color="#aaaa"
            className="flex my-1 mx-1 mt-1"
          />{" "}
          by{" "}
          <a
            href="https://twitter.com/bri4nr33d"
            className="hover:underline mx-1"
          >
            @bri4nr33d
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
