(function () {
  const green_color = "#00cc1f"; // Color for Proven Elements
  const red_color = "#ff1c1c"; // Color for Disroven Elements

  type ElementsMap = { [key: string]: { color: string } };

  const elementsMap: ElementsMap = {};

  async function loadData(
    type: "proven" | "disproven",
    why: "load" | "update"
  ): Promise<string[]> {
    const api_url = "https://colorproven.gameroman.workers.dev";
    const url = `${api_url}/get?type=${type}&why=${why}`;
    const response = await fetch(url);
    const data = await response.json();
    return data as string[];
  }

  function storeColorData(green: string[], red: string[]): void {
    for (const elem of green) {
      elementsMap[elem.toLowerCase()] = { color: green_color };
    }
    for (const elem of red) {
      elementsMap[elem.toLowerCase()] = { color: red_color };
    }
  }

  function isDeadNumber(text: string): boolean {
    if (!/^\d+$/.test(text)) return false;
    const num = Number(text);
    if (isNaN(num)) return false;
    return num >= 1_000_000;
  }

  function handleInstanceColor(instance: ICInstanceDivElement): void {
    const textContent = instance.childNodes[1].textContent;
    if (!textContent) throw new Error("Something went wrong!");
    const text = textContent.trim().toLowerCase();
    const elem = elementsMap[text];
    if (text.length > 30) {
      instance.style.color = red_color;
    } else if (isDeadNumber(text)) {
      instance.style.color = red_color;
    } else if (elem && elem.color) {
      instance.style.color = elem.color;
    }
  }

  function handleItemColor(item: ICItemDivElement): void {
    const textContent = item.childNodes[1].textContent;
    if (!textContent) throw new Error("Something went wrong!");
    const text = textContent.trim().toLowerCase();
    const elem = elementsMap[text];
    if (text.length > 30) {
      item.style.color = red_color;
    } else if (isDeadNumber(text)) {
      item.style.color = red_color;
    } else if (elem && elem.color) {
      item.style.color = elem.color;
    }
  }

  function handleNode(node: Node): void {
    if (!(node instanceof HTMLElement)) return;

    if (
      node.classList.contains("instance") &&
      node.querySelector(".instance-emoji")
    ) {
      const this_node = node as ICInstanceDivElement;
      const instance = IC.getInstances().find((x) => x.element === this_node);
      if (!instance) return;
      handleInstanceColor(instance.element);
    } else if (
      node.classList.contains("item-wrapper") &&
      node.querySelector(".item")
    ) {
      const this_node = node as ICItemWrapperDivElement;
      const item = Array.from(this_node.querySelectorAll(".item")).find(
        (x) => x === this_node.children[0]
      );
      if (!item) return;
      handleItemColor(item);
    }
  }

  function updateButtonText(
    button: HTMLButtonElement,
    texts: readonly string[],
    interval: number
  ): Promise<() => void> {
    let index = 0;
    return new Promise((resolve) => {
      const intervalId = window.setInterval(() => {
        button.textContent = texts[index]!;
        index = (index + 1) % texts.length;
      }, interval);
      resolve(() => {
        window.clearInterval(intervalId);
      });
    });
  }

  function setupButtonForUpdatingData(): void {
    const buttonForUpdatingData = document.createElement("button");
    buttonForUpdatingData.textContent = "Update data";
    buttonForUpdatingData.style.fontSize = "1.25rem";

    buttonForUpdatingData.addEventListener("click", async () => {
      buttonForUpdatingData.disabled = true;
      const stopAnimation = await updateButtonText(
        buttonForUpdatingData,
        ["Updating..", "Updating...", "Updating."],
        250
      );

      try {
        const [proven, disproven] = await Promise.all([
          loadData("proven", "update"),
          loadData("disproven", "update"),
        ]);

        storeColorData(proven, disproven);

        document.querySelectorAll(".instance").forEach((instance) => {
          handleInstanceColor(instance);
        });

        document.querySelectorAll(".item").forEach((item) => {
          handleItemColor(item);
        });

        stopAnimation();
        buttonForUpdatingData.textContent = "Data updated successfully ✅";

        window.setTimeout(() => {
          buttonForUpdatingData.textContent = "Update data";
          buttonForUpdatingData.disabled = false;
        }, 2500);
      } catch (error) {
        stopAnimation();
        buttonForUpdatingData.textContent = "Failed to update data ❌";

        window.setTimeout(() => {
          buttonForUpdatingData.textContent = "Update data";
          buttonForUpdatingData.disabled = false;
        }, 2500);
        console.error("Update failed:", error);
      }
    });

    const sideControls = document.querySelector(".side-controls");
    sideControls.prepend(buttonForUpdatingData);
  }

  async function init(): Promise<void> {
    {
      const [proven, disproven] = await Promise.all([
        loadData("proven", "load"),
        loadData("disproven", "load"),
      ]);

      storeColorData(proven, disproven);
    }

    const interval = window.setInterval(() => {
      try {
        IC;
      } catch {
        return;
      }
      if (!IC) return;
      window.clearInterval(interval);
    }, 2000);

    const instanceObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (!mutation.addedNodes.length) {
          continue;
        }

        for (const node of mutation.addedNodes) {
          handleNode(node);
        }
      }
    });

    instanceObserver.observe(document.querySelector(".infinite-craft"), {
      childList: true,
      subtree: true,
    });

    setupButtonForUpdatingData();
  }

  window.addEventListener("load", async () => {
    init();
  });
})();
