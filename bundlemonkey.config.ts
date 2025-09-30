import type { Config } from "bundlemonkey";

const userscriptURL = ({ scriptName }: { scriptName: string }) =>
  `https://userscript.rman.dev/${scriptName}.user.js`;

const config: Config = {
  srcDir: "./src/userscripts/",
  dist: { production: "./dist/" },
  defaultMeta: {
    author: "GameRoMan",
    namespace: "rman.dev",
    homepage: "https://rman.dev/discord",
    supportURL: "https://rman.dev/discord",
    downloadURL: userscriptURL,
    updateURL: userscriptURL,
  },
} satisfies Config;

export default config;
