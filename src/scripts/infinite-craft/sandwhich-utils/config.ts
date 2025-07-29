import { defineConfig } from "build/config";

export default defineConfig({
  headers: {
    name: "Sandwhich Utils Mod",
    match: "https://neal.fun/infinite-craft/",
    author: "Catstone",
    namespace: "Catstone",
    version: "2.2",
    description:
      "Adds a ton of utility functionality: Selection, Tab, Spawn, Unicode Utils!",
    grant: ["GM_getValue", "GM_setValue", "GM_addStyle", "GM.xmlHttpRequest"],
  },
});
