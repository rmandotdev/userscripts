window.addEventListener("load", () => {
  if (window.location.host == "neal.fun") {
    $initInfiniteCraft();
  } else if (window.location.pathname.startsWith("/item")) {
    $initIBItemView();
  } else if (window.location.pathname == "/") {
    $initIBSearch();
  }
});

/** Add a footer to the element on InfiniBrowser */
function setFooter(...content: (Node | string)[]) {
  document.querySelectorAll(".aib_footer").forEach((x) => x.remove());
  if (!content.length) return;

  const list = document.querySelector(".recipes") as HTMLUListElement;
  const footer = document.createElement("div");

  footer.classList.add("aib_footer");
  footer.style.color = "#aaa";
  footer.append(...content);

  list.parentElement!.insertBefore(footer, list);
}

interface IB_HTMLDivElement_Item extends HTMLDivElement {
  getAttribute(qualifiedName: string): string | null;
  getAttribute(qualifiedName: "data-id"): string;
}

interface IB_HTMLDivElement_ResultItem extends IB_HTMLDivElement_Item {}

interface IB_HTMLDivElement_TargetItem extends IB_HTMLDivElement_Item {}

interface IB_HTMLLIElement_Step extends HTMLLIElement {
  children: HTMLCollection &
    [
      HTMLSpanElement,
      IB_HTMLDivElement_Item,
      IB_HTMLDivElement_Item,
      IB_HTMLDivElement_ResultItem
    ];
}

/** Adjust a lineage on InfiniBrowser */
async function adjustLineage(stepSelector: string) {
  setFooter();

  const stepList =
    document.querySelectorAll<IB_HTMLLIElement_Step>(stepSelector);
  const steps = new Set(stepList);
  if (!steps.size) return;

  const elements = new Set((await GM.getValue("elements", "")).split("\x00"));
  const resultStep = stepList[stepList.length - 1]!;
  const result = resultStep.children[3].getAttribute("data-id");

  if (elements.has(result.toLowerCase())) {
    setFooter("You already have this element");
    return;
  }

  // remove all steps for elements that the player has
  let removedSteps = 0;
  for (const step of steps) {
    const result = step.children[3].getAttribute("data-id");
    if (elements.has(result.toLowerCase())) {
      // hide the step instead of removing it
      // so that the "copy lineage" button works properly
      step.style.display = "none";
      steps.delete(step);
      removedSteps++;
    }
  }

  if (removedSteps == 0) return;

  // remove all unused steps
  while (true) {
    const unused: Map<string, IB_HTMLLIElement_Step> = new Map();
    for (const step of steps) {
      unused.delete(step.children[1].getAttribute("data-id"));
      unused.delete(step.children[2].getAttribute("data-id"));

      if (step != resultStep) {
        unused.set(step.children[3].getAttribute("data-id"), step);
      }
    }

    if (!unused.size) break;
    for (const step of unused.values()) {
      step.style.display = "none";
      steps.delete(step);
      removedSteps++;
    }
  }

  // update step numbers
  let n = 0;
  for (const step of steps) {
    step.children[0].textContent = `${++n}.`;
  }

  // add a footer
  const btn = document.createElement("a");
  btn.textContent = "Show original";
  btn.onclick = () => {
    setFooter();

    let n = 0;
    for (const step of stepList) {
      step.style.display = null;
      step.children[0].textContent = `${++n}.`;
    }
  };

  setFooter(`Removed ${removedSteps} steps. `, btn);
}

/** Initialize on InfiniBrowser's element view page */
function $initIBItemView() {
  const recipeTree = document.getElementById("recipe_tree") as HTMLUListElement;
  if (document.getElementById("lineage_loader")) {
    const observer = new MutationObserver((e) => {
      if (e[0]!.removedNodes) {
        setTimeout(() => adjustLineage("#recipe_tree li"));
        observer.disconnect();
      }
    });

    observer.observe(recipeTree, { childList: true });
  } else {
    adjustLineage("#recipe_tree li");
  }
}

/** Initialize on InfiniBrowser's search page */
function $initIBSearch() {
  if (!document.getElementById("recipes")) return;
  let item_descr: HTMLElement | null;
  if ((item_descr = document.getElementById("item_descr"))) item_descr.remove();

  new MutationObserver(() => {
    adjustLineage("#recipes li");
  }).observe(document.getElementById("recipes") as HTMLUListElement, {
    childList: true,
  });
}

/** Initialize on Infinite Craft */
function $initInfiniteCraft() {
  const API = document.querySelector(".container").__vue__;

  let elementCount = 0;
  const storeElements = () => {
    elementCount = API.items.length;
    GM.setValue(
      "elements",
      API.items.map((x) => x.text.toLowerCase()).join("\x00")
    );
  };

  const craftApi = API.craftApi;
  API.craftApi = async function () {
    const result = await craftApi.apply(this, arguments);
    setTimeout(() => {
      if (elementCount != API.items.length) {
        storeElements();
      }
    });

    return result;
  };

  const switchSave = API.switchSave;
  API.switchSave = async function () {
    const res = await switchSave.apply(this, arguments);
    setTimeout(storeElements, 16);
    return res;
  };

  const addAPI = API.addAPI;
  API.addAPI = function () {
    setTimeout(storeElements, 16);

    API.addAPI = addAPI;
    return addAPI.apply(this, arguments);
  };
}
