import { defineConfig } from "build/config";

export default defineConfig({
  headers: {
    name: "Instance Snapping",
    namespace: "Vancord",
    match: "https://neal.fun/infinite-craft/*",
    version: "0.3",
    description: "Brings back instance snapping from MBS",
    runAt: "document-start",
    author: "Vancord",
    license: undefined,
    grant: ["unsafeWindow"],
  },
});
