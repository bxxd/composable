/** @type {import('next').NextConfig} */
const path = require("path");

module.exports = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname, "app");
    return config;
  },
};
