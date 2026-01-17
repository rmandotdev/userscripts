import { defineConfig } from "#config";

export default defineConfig({
  headers: {
    name: "Alternative Lineages",
    match: "https://infinibrowser.wiki/item*",
    version: "4.0.1",
    description: "Adds alternative lineages to InfiniBrowser",
    grant: ["GM"],
  },
});
