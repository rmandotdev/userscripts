(function () {
  const green_color = "#00cc1f"; // Color for Proven Elements
  const red_color = "#ff1c1c"; // Color for Disroven Elements

  type ElementsMap = { [key: string]: { color: string } };

  const elementsMap: ElementsMap = {};

  async function loadData(
    type: "proven" | "disproven",
    why: "load" | "update"
  ) {
    const api_url = "https://colorproven.gameroman.workers.dev";
    const url = `${api_url}/get?type=${type}&why=${why}`;
    const response = await fetch(url);
    const data = await response.json();
    return data as string[];
  }

  async function storeColorData(green: string[], red: string[]) {
    for (const elem of green) {
      elementsMap[elem.toLowerCase()] = { color: green_color };
    }
    for (const elem of red) {
      elementsMap[elem.toLowerCase()] = { color: red_color };
    }
  }

  function handleNode(node: Node) {
    if (!(node instanceof HTMLElement)) return;

    if (
      node.classList.contains("instance") &&
      node.querySelector(".instance-emoji")
    ) {
      const this_node = node as ICInstanceDivElement;
      const instance = IC.getInstances().find((x) => x.element == this_node);
      if (!instance) return;
      const text = instance.text.toLowerCase();
      const elem = elementsMap[text];
      if (text.length > 30) {
        this_node.style.color = red_color;
      } else if (elem && elem.color) {
        this_node.style.color = elem.color;
      }
    } else if (
      node.classList.contains("item-wrapper") &&
      node.querySelector(".item")
    ) {
      const this_node = node as ICItemWrapperDivElement;
      const item = Array.from(this_node.querySelectorAll(".item")).find(
        (x) => x == this_node.children[0]
      );
      if (!item) return;
      const textContent = item.childNodes[1].textContent;
      if (!textContent) throw new Error("Something went wrong!");
      const text = textContent.trim().toLowerCase();
      const elem = elementsMap[text];
      if (text.length > 30) {
        this_node.style.color = red_color;
      } else if (elem && elem.color) {
        this_node.style.color = elem.color;
      }
    }
  }

  window.addEventListener("load", async () => {
    const proven = await loadData("proven", "load");
    const disproven = await loadData("disproven", "load");

    const interval = setInterval(() => {
      if (!IC) return;
      clearInterval(interval);
    }, 3000);

    storeColorData(proven, disproven);

    const instanceObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (!mutation.addedNodes.length) return;

        for (const node of mutation.addedNodes) {
          handleNode(node);
        }
      }
    });

    instanceObserver.observe(document.querySelector(".infinite-craft"), {
      childList: true,
      subtree: true,
    });

    const buttonUpdateData = document.createElement("button");
    buttonUpdateData.textContent = "Update data";
    buttonUpdateData.addEventListener("click", async () => {
      const proven = await loadData("proven", "update");
      const disproven = await loadData("disproven", "update");
      storeColorData(proven, disproven);
    });

    const sideControls = document.querySelector(".side-controls");

    sideControls.append(buttonUpdateData);
  });
})();
