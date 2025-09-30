import { defineConfig } from "build/config";

export default defineConfig({
  headers: {
    name: "Fast Save",
    match: "https://neal.fun/infinite-craft/*",
    version: "1.0",
    description: "Download your savefile using Ctrl+S shortcut",
  },
});
