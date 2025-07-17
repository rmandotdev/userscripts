import * as ib from "infinibrowser";

(function () {
  function convertRecipes(ulElement: HTMLUListElement) {
    const steps: ib.ShareLineageType = [];

    const lis = ulElement.querySelectorAll("li");

    lis.forEach((li) => {
      const divs = li.querySelectorAll("div.item");
      const step = [] as unknown as ib.ShareStepType;

      divs.forEach((div) => {
        const id = div.childNodes[1]!.textContent!.trim();
        const emoji =
          div.querySelector("img")?.alt ??
          div.getElementsByTagName("span")[0]?.textContent ??
          "";

        const obj = { id, emoji };
        step.push(obj);
      });

      steps.push(step);
    });

    return steps;
  }

  async function shareAndOptimize() {
    const tree = document.querySelector("#recipe_tree") as HTMLUListElement;
    if (!tree) {
      alert("❌ Could not find recipe tree!");
      return;
    }

    const lineage = convertRecipes(tree);

    const shareData = await ib.shareLineage(lineage);
    const optimizeData = await ib.optimizeLineage(shareData.id);
    await navigator.clipboard.writeText(
      `https://infinibrowser.wiki/item/${optimizeData.id}`
    );
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "q") {
      e.preventDefault();
      shareAndOptimize();
    }
  });
})();
