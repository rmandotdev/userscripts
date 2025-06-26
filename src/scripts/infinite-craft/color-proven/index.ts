(function () {
  const green_color = "#00cc1f"; // Color for Proven Elements
  const red_color = "#ff1c1c"; // Color for Disroven Elements

  let elementsMap: { [key: string]: { color: string } } = {};

  async function load_data(location: "proven" | "disproven") {
    const response = await fetch(
      `https://glcdn.githack.com/gameroman/infinite-craft/-/raw/main/base-elements/${location}.json`,
      { cache: "no-store" }
    );
    return (await response.json()) as string[];
  }

  async function colorElements(green: string[], red: string[]) {
    elementsMap = {};
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
      const elem = elementsMap[instance.text.toLowerCase()];
      if (elem && elem.color) {
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
      const text = item.childNodes[1].textContent;
      if (!text) throw new Error("Something went wrong!");
      const elem = elementsMap[text.trim().toLowerCase()];
      if (elem && elem.color) {
        this_node.style.color = elem.color;
      }
    }
  }

  window.addEventListener("load", async () => {
    const proven = await load_data("proven");
    const disproven = await load_data("disproven");

    const interval = setInterval(() => {
      if (!IC) return;
      clearInterval(interval);
    }, 3000);

    colorElements(proven, disproven);

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
  });
})();
