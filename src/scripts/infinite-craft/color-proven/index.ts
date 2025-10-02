type ElementsMap = Record<string, { color: string }>;
type ElementsData = { proven: string[]; disproven: string[] };
type UserscriptMetaHeaders = {
  name: string;
  match: string;
  version: string;
  description: string;
};
type UserscriptMeta = { headers: UserscriptMetaHeaders };

(function () {
  const colors = {
    /** Color for Proven Elements */
    proven: "#00cc1f",
    /** Color for Disproven Elements */
    disproven: "#ff1c1c",
  } as const;

  const elementsMap: ElementsMap = {};

  const __VERSION__ = GM.info.script.version;

  async function loadData(why: "load" | "update"): Promise<ElementsData> {
    const api_url = "https://colorproven.gameroman.workers.dev";
    const url = `${api_url}/get?why=${why}`;
    const response = await fetch(url);
    const data: ElementsData = await response.json();
    return data;
  }

  function storeColorData(green: string[], red: string[]): void {
    for (const elem of green) {
      elementsMap[elem.toLowerCase()] = { color: colors.proven };
    }
    for (const elem of red) {
      elementsMap[elem.toLowerCase()] = { color: colors.disproven };
    }
  }

  function isDeadNumber(text: string): boolean {
    if (!/^\d+$/.test(text)) return false;
    const num = Number(text);
    if (isNaN(num)) return false;
    return num >= 1_000_000;
  }

  function handleDivColor(div: ICInstanceDivElement | ICItemDivElement): void {
    const textContent = div.childNodes[1].textContent;
    if (!textContent) throw new Error("Something went wrong!");
    const text = textContent.trim().toLowerCase();
    const elem = elementsMap[text];
    if (text.length > 30) {
      div.style.color = colors.disproven;
    } else if (isDeadNumber(text)) {
      div.style.color = colors.disproven;
    } else if (elem && elem.color) {
      div.style.color = elem.color;
    }
  }

  function handleInstanceColor(instance: ICInstanceDivElement): void {
    return handleDivColor(instance);
  }

  function handleItemColor(item: ICItemDivElement): void {
    return handleDivColor(item);
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
        ["Updating..", "Updating..."],
        300
      );

      let success = false;
      try {
        const { proven, disproven } = await loadData("update");

        storeColorData(proven, disproven);

        document.querySelectorAll(".instance").forEach((instance) => {
          handleInstanceColor(instance);
        });

        document.querySelectorAll(".item").forEach((item) => {
          handleItemColor(item);
        });

        success = true;
      } catch (error) {
        console.error("Update failed:", error);
      } finally {
        stopAnimation();
        buttonForUpdatingData.textContent = success
          ? "Data updated successfully ✅"
          : "Failed to update data ❌";
        window.setTimeout(() => {
          buttonForUpdatingData.textContent = "Update data";
        }, 5 * 1000);
        window.setTimeout(() => {
          buttonForUpdatingData.disabled = false;
        }, 120 * 1000);
      }
    });

    const sideControls = document.querySelector(".side-controls");
    sideControls.prepend(buttonForUpdatingData);
  }

  function showToast(message: string | string[]) {
    let container = document.getElementById("userscript-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "userscript-toast-container";
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100vw";
      container.style.height = "100vh";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
      container.style.zIndex = "9999";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.style.background = "hsl(0, 0%, 0%)";
    toast.style.color = "hsl(0, 0%, 100%)";
    toast.style.padding = "1.5rem 2rem";
    toast.style.borderRadius = "0.75rem";
    toast.style.boxShadow = "0 4px 12px hsla(0, 0%, 0%, 0.6)";
    toast.style.fontSize = "1.25rem";
    toast.style.overflowWrap = "break-word";
    toast.style.display = "flex";
    toast.style.flexDirection = "column";
    toast.style.alignItems = "center";
    toast.style.gap = "1rem";

    const textElem = document.createElement("div");
    textElem.textContent = Array.isArray(message)
      ? message.join("\n")
      : message;
    textElem.style.whiteSpace = "pre-wrap";
    textElem.style.textAlign = "left";
    textElem.style.width = "100%";
    textElem.style.fontSize = "1.1rem";
    textElem.style.color = "hsl(0, 0%, 100%)";
    textElem.style.margin = "0";
    textElem.style.padding = "0";
    textElem.style.maxWidth = "360px";
    textElem.style.fontFamily = "monospace";
    toast.appendChild(textElem);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "0.5rem 1rem";
    closeBtn.style.fontSize = "1rem";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "0.5rem";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.background = "hsla(0, 0%, 100%, 0.15)";
    closeBtn.style.color = "white";
    closeBtn.style.alignSelf = "flex-end";
    closeBtn.addEventListener("click", () => {
      toast.remove();
      if (!container!.childElementCount) container!.remove();
    });

    toast.appendChild(closeBtn);
    container.appendChild(toast);

    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });
  }

  async function getLatestUserscriptMeta() {
    const response = await fetch(
      "https://userscripts.rman.dev/infinite-craft/color-proven/meta.json"
    );
    const data: UserscriptMeta = await response.json();
    return data;
  }

  async function getLatestUserscriptVersion() {
    const meta = await getLatestUserscriptMeta();
    return meta.headers.version;
  }

  async function checkUserscriptVersion() {
    const latestVersion = await getLatestUserscriptVersion();
    console.log({ __VERSION__, latestVersion });
    if (__VERSION__ === latestVersion) {
      console.log("Userscript is up to date");
      return;
    }

    showToast([
      "You are using an outdated version of the color-proven userscript.\n",
      "Please update to the latest version.\n",
      `Current version: ${__VERSION__}`,
      `Latest version: ${latestVersion}\n`,
    ]);
  }

  async function init(): Promise<void> {
    checkUserscriptVersion();

    const { proven, disproven } = await loadData("load");
    storeColorData(proven, disproven);

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
        if (!mutation.addedNodes.length) continue;
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
