const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// This tells Metro to process your Tailwind CSS
module.exports = withNativeWind(config, { input: "./global.css" });