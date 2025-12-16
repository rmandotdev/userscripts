import { ib } from "infinibrowser";
import type {
  ShareLineageType,
  ShareStepType,
  ElementType,
} from "infinibrowser";

function divToElement(div: HTMLDivElement): ElementType {
  const id = div.childNodes[1]!.textContent!.trim();
  const emoji =
    div.querySelector("img")?.alt ??
    div.getElementsByTagName("span")[0]?.textContent ??
    "";

  return { id, emoji };
}

function liToStep(li: HTMLLIElement): ShareStepType {
  const divs = Array.from(li.querySelectorAll<HTMLDivElement>("div.item")) as [
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement,
  ];

  const step: ShareStepType = [
    divToElement(divs[0]),
    divToElement(divs[1]),
    divToElement(divs[2]),
  ];

  return step;
}

function convertRecipes(ulElement: HTMLUListElement): ShareLineageType {
  const lis = Array.from(ulElement.querySelectorAll("li"));
  return lis.map((li) => liToStep(li));
}

async function shareAndOptimize(): Promise<void> {
  const tree = document.querySelector("#recipe_tree") as HTMLUListElement;
  if (!tree) {
    alert("❌ Could not find recipe tree!");
    return;
  }

  const lineage = convertRecipes(tree);

  const sharedLineage = await ib.shareLineage(lineage);
  if (!sharedLineage.ok) return;
  const optimizedLineage = await ib.optimizeLineage(sharedLineage.data.id);
  if (!optimizedLineage.ok) return;
  await navigator.clipboard.writeText(
    `https://infinibrowser.wiki/item/${optimizedLineage.data.id}`,
  );
}

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "q") {
    e.preventDefault();
    shareAndOptimize();
  }
});
