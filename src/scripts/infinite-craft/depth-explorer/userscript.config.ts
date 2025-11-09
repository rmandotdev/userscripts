import { defineConfig } from "build/config";

export default defineConfig({
  headers: {
    name: "Depth Explorer",
    namespace: "Catstone",
    match: "https://neal.fun/infinite-craft/",
    grant: ["GM_getValue", "GM_setValue"],
    runAt: "document-start",
    version: "1.0",
    author: "Catstone",
    description:
      "Explores the deep depths of InfiniteCraft. Use `depthExplorer()` to start the bot. For all settings/commands, check the code itself!",
  },
});
