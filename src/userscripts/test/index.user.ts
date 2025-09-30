import { defineUserScript } from "bundlemonkey";

export default defineUserScript({
  name: "Adjust InfiniBrowser Lineages",
  match: ["https://infinibrowser.wiki/item*", "https://infinibrowser.wiki/*"],
  author: "zeroptr",
  namespace: "zptr.cc",
  version: "0.5.0",
  description:
    "Adjusts lineages on InfiniBrowser, removing steps for elements that you already have in the game.",
  grant: ["unsafeWindow", "GM.getValue", "GM.setValue"],
  runAt: "document-end",
  main: () => {
    console.log(1);
  },
});
