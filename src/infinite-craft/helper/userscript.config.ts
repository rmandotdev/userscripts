import { defineConfig } from "build/config";

export default defineConfig({
  headers: {
    name: "Helper: Not-so-budget Edition; Patched by GameRoMan",
    namespace: "nat.is-a.dev",
    match: "https://neal.fun/infinite-craft/",
    grant: ["GM.addStyle", "unsafeWindow"],
    runAt: "document-start",
    version: "1.1.2.69.1",
    author: "Natasquare + GameRoMan",
    description:
      "Adds various QoL features to Infinite Craft - a port of Mikarific's Infinite Craft Helper; Patched by GameRoMan",
  },
});
