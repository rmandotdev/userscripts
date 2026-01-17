import { defineConfig } from "#config";

export default defineConfig({
  headers: {
    name: "Infinihook",
    match: "https://infinibrowser.wiki/item*",
    version: "0.2.2",
    description: "Sends lineages for elements to your Discord webhook",
  },
});
