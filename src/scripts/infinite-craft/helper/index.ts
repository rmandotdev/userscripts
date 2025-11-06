import type {
  IC_Sidebar_VUE,
  ICItemData,
  IC_DOM,
  IC_Container_VUE,
} from "@infinite-craft/dom-types";

import { css, closeIconSrc, randomIcon, matchSorter } from "./utils";

/*
┌────────────────────────────────────────────────────────────────────────────┐
│   it's recommended to read through these options before using the script   │
└────────────────────────────────────────────────────────────────────────────┘
*/

const settings = {
  // search
  searchDebounceDelay: 200, // basically waits for you to finish inputting before searching, set to 0 to disable
  searchRelevancy: true, // will override other sorting modes if searching

  // recipes
  recipeLookup: true, // if you can't wait until neal actually implements it
  recipeLogging: true, // log the raw result of recipes in console

  // misc
  randomButton: 2, // 0 - disable	1 - classic algorithm	2 - better random button
  elementPinning: true, // alt + left click to pin elements on side bar
  removeDeps: false, // removes some reactivity of vue for performance (MAY BREAK THINGS)
  oldMouseControls: true, // middle click to duplicate, ctrl + left click to pan
  disableParticles: true, // honestly they don't affect performance as much now
  variation: true, // allows you to obtain an element in multiple casings, yay
};

interface Exported {
  settings: any;
  createItemElement: any;
  openRecipeModal: any;
  pinElements: any;
  unpinElements: any;
  resetPinnedElements: any;
  loadPinnedElements: any;
}

const exported = {} as Exported;
exported.settings = settings;

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn.apply(context, args);
    }, delay);
  };
}

function initSearchDebounce({ v_sidebar }: { v_sidebar: IC_Sidebar_VUE }) {
  const oldInput = v_sidebar.$refs.search;
  v_sidebar.$refs.search = oldInput.cloneNode(
    true
  ) as IC_DOM.SidebarInputInputElement;
  oldInput.parentNode.replaceChild(v_sidebar.$refs.search, oldInput);
  v_sidebar.$refs.search.addEventListener(
    "input",
    debounce(function (e) {
      if (!e.target.composing) v_sidebar.searchQuery = e.target.value;
    }, settings.searchDebounceDelay)
  );
  v_sidebar.$refs.search.parentNode
    .querySelector(".sidebar-input-close")
    ?.addEventListener("click", function () {
      v_sidebar.$refs.search.value = "";
    });

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      v_sidebar.searchQuery = "";
      v_sidebar.$refs.search.value = "";
    } else if (document.activeElement?.nodeName !== "INPUT") v_sidebar.$refs.search.focus();
  });

  const oldFiltered = v_sidebar._computedWatchers.filteredElements.getter;
  v_sidebar._computedWatchers.filteredElements.getter = function () {
    const filtered = oldFiltered.apply(this);
    v_sidebar.$refs.search.placeholder = `Search ${
      this.items?.length > 1 ? `(${filtered.length.toLocaleString()}) ` : ""
    }items...`;
    return filtered;
  };
}

function initSearchRelevancy({ v_sidebar }: { v_sidebar: IC_Sidebar_VUE }) {
  const oldSorted = v_sidebar._computedWatchers.sortedElements.getter;
  v_sidebar._computedWatchers.sortedElements.getter = function () {
    return this.searchQuery ? this.items : oldSorted.apply(this);
  };

  let lastQuery: string, lastResults: ICItemData[], lastElementCount: number;
  v_sidebar._computedWatchers.searchResults.getter = function () {
    if (!this.searchQuery) return [];

    // using items length is ok 99% of the time
    if (
      this.searchQuery === lastQuery &&
      this.items.length === lastElementCount
    )
      return lastResults.slice(0, this.limit);

    lastQuery = this.searchQuery;
    lastElementCount = this.items.length;

    const lowerQuery = this.searchQuery.toLowerCase(),
      elements = this.filteredElements,
      results: ICItemData[] = [];

    for (let i = elements.length; i--; ) {
      const e = elements[i]!;
      if (e.text.toLowerCase().indexOf(lowerQuery) > -1) results.push(e);
    }

    lastResults = matchSorter(results, this.searchQuery, {
      keys: ["text"],
      baseSort: (a, b) => (a.rankedValue < b.rankedValue ? -1 : 1),
    });

    return lastResults.slice(0, this.limit);
  };
}

interface Element {
  id: string;
  text: string;
  emoji: string;
  discovery?: boolean;
}

function createItemElement(item: Element | ICItemData, wrap = false) {
  const itemDiv = document.createElement("div");
  itemDiv.setAttribute("data-item-emoji", item.emoji!);
  itemDiv.setAttribute("data-item-text", item.text);
  itemDiv.setAttribute("data-item-id", item.id as string);
  if (item.discovery) itemDiv.setAttribute("data-item-discovery", "");
  itemDiv.setAttribute("data-item", "");
  itemDiv.classList.add("item");

  const emoji = document.createElement("span");
  emoji.classList.add("item-emoji");
  emoji.appendChild(document.createTextNode(item.emoji ?? "⬜"));

  itemDiv.append(emoji, document.createTextNode(` ${item.text} `));

  if (wrap) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("item-wrapper");
    wrapper.appendChild(itemDiv);
    return wrapper;
  }

  return itemDiv;
}
exported.createItemElement = createItemElement;

function traverseUntil(element: HTMLElement, selector: string) {
  let result = element;
  while (true) {
    if (result?.matches(selector)) return result;
    if (!result?.parentElement) return null;
    result = result.parentElement;
  }
}

function initRecipeLookup({
  v_container,
  v_sidebar,
}: {
  v_container: IC_Container_VUE;
  v_sidebar: IC_Sidebar_VUE;
}) {
  const modal = document.createElement("dialog");
  modal.classList.add("recipe-modal");
  const modalTitle = document.createElement("h1");
  modalTitle.classList.add("recipe-modal-title");
  const closeButton = document.createElement("button");
  closeButton.classList.add("recipe-modal-close-button");
  const closeIcon = document.createElement("img");
  closeIcon.src = closeIconSrc;
  closeButton.appendChild(closeIcon);
  closeButton.addEventListener("click", (_) => modal.close());
  const modalHeader = document.createElement("div");
  modalHeader.classList.add("recipe-modal-header");
  modalHeader.append(modalTitle, closeButton);
  const modalBody = document.createElement("div");
  modalBody.classList.add("recipe-modal-body");
  modal.append(modalHeader, modalBody);
  v_container.$el.appendChild(modal);

  ["wheel", "scroll"].forEach((x) =>
    modal.addEventListener(x, (e) => e.stopImmediatePropagation(), true)
  );

  const idMap: Map<number, ICItemData> = new Map();

  function openRecipeModal(itemText: string) {
    let itemId;
    for (const item of v_container.items) {
      idMap.set(item.id, item);
      if (item.text === itemText) itemId = item.id;
    }
    const item = idMap.get(itemId!);

    if (!item) throw new Error("this shouldn't be possible in normal gameplay");

    const itemEmoji = document.createElement("span");
    itemEmoji.classList.add("item-emoji");
    itemEmoji.appendChild(document.createTextNode(item.emoji ?? "⬜"));
    modalTitle.innerHTML = "";
    modalTitle.append(itemEmoji, document.createTextNode(` ${item.text} `));

    modalBody.innerHTML = "";
    if (!item.recipes || item.recipes.length < 1)
      modalBody.appendChild(
        document.createTextNode("No recipes recorded for this element.")
      );
    else
      for (const r of item.recipes) {
        const recipe = document.createElement("div");
        recipe.classList.add("recipe");
        const [itemA, itemB] = r.map((id) => idMap.get(id));
        if (!itemA || !itemB) {
          console.warn("Invalid recipe for " + item.text, r);
          continue;
        }
        recipe.append(
          createItemElement(itemA),
          document.createTextNode("+"),
          createItemElement(itemB)
        );
        modalBody.appendChild(recipe);
      }

    modal.showModal();
  }
  exported.openRecipeModal = openRecipeModal;

  [v_sidebar.$el, modal].forEach((x) =>
    x.addEventListener("contextmenu", function (e) {
      const item = traverseUntil(e.target, ".item");
      if (item) {
        e.preventDefault();
        openRecipeModal(item.getAttribute("data-item-text"));
      }
    })
  );

  let hidden = false;
  modal.addEventListener("mousedown", function (e) {
    if (e.target === e.currentTarget) return modal.close();
    if (e.button === 2) return;
    const item = traverseUntil(e.target, ".item");
    if (!item) return;
    modal.classList.add("hidden");
    hidden = true;
  });
  document.addEventListener("mouseup", function () {
    if (!hidden) return;
    modal.classList.remove("hidden");
    hidden = false;
  });
}

function initRecipeLogging() {
  window.addEventListener("ic-craftapi", function (e) {
    const { a, b, result } = (e as CustomEvent).detail;
    if (result) console.log(`${a} + ${b} = ${result.text}`);
  });
}

function initPinnedContainer({
  v_container,
}: {
  v_container: IC_Container_VUE;
}) {
  const pinnedContainerContainer = document.createElement("div");
  pinnedContainerContainer.classList.add("items-pinned");
  const pinnedContainer = document.createElement("div");
  pinnedContainer.classList.add("items-pinned-inner");
  pinnedContainerContainer.appendChild(pinnedContainer);
  const resizeHandle = document.createElement("div");
  resizeHandle.classList.add("resize-handle-vertical");

  const saveContainerHeight = debounce(function (v: number) {
    return localStorage.setItem("pinned-container-height", v);
  }, 50);

  const savedHeight = localStorage.getItem("pinned-container-height");
  if (savedHeight) pinnedContainer.style.height = savedHeight + "px";

  let resizing = false,
    startY = 0,
    startHeight = 0;

  function handleResize(e: MouseEvent) {
    if (!resizing) return;
    const newHeight = startHeight + e.clientY - startY;
    saveContainerHeight(newHeight);
    pinnedContainer.style.height = newHeight + "px";
  }

  resizeHandle.addEventListener("mousedown", function (e) {
    resizing = true;
    startY = e.clientY;
    startHeight = pinnedContainer.offsetHeight;
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", function () {
      resizing = false;
      document.removeEventListener("mousemove", handleResize);
    });
  });

  pinnedContainerContainer.appendChild(resizeHandle);

  const pinnedIds = new Set();

  function pinElements(elements: Element | Element[], updateStorage = true) {
    if (!Array.isArray(elements)) elements = [elements];

    const es = [];
    const newElements = [];
    for (const e of elements) {
      if (pinnedIds.has(e.id)) continue;
      pinnedIds.add(e.id);
      if (updateStorage) newElements.push(e);
      es.push(createItemElement(e, true));
    }
    pinnedContainer.append(...es);

    if (updateStorage) {
      const data = JSON.parse(
        localStorage.getItem("pinned-elements") ?? "{}"
      ) as {
        [key: number]: Element[];
      };
      const pinnedElements: Element[] = data[v_container.currSave] ?? [];
      pinnedElements.push(...newElements);
      data[v_container.currSave] = pinnedElements;
      localStorage.setItem("pinned-elements", JSON.stringify(data));
    }
  }
  exported.pinElements = pinElements;

  function unpinElements(elements: Element | Element[], updateStorage = true) {
    if (!Array.isArray(elements)) elements = [elements];

    const removed: Set<string> = new Set();

    for (const e of elements) {
      if (!pinnedIds.has(e.id)) continue;
      const div = (
        pinnedContainer.querySelector(
          `.item[data-item-id="${e.id}"]`
        ) as IC_DOM.ItemDivElement | null
      )?.parentNode;
      if (!div) continue;
      pinnedIds.delete(e.id);
      if (updateStorage) removed.add(e.id);
      div.remove();
    }

    if (updateStorage) {
      const data = JSON.parse(
        localStorage.getItem("pinned-elements") ?? "{}"
      ) as {
        [key: number]: Element[];
      };
      const pinnedElements: Element[] = data[v_container.currSave] ?? [];
      data[v_container.currSave] = pinnedElements.filter(
        (e) => !removed.has(e.id)
      );
      localStorage.setItem("pinned-elements", JSON.stringify(data));
    }
  }
  exported.unpinElements = unpinElements;

  // note: does not update storage
  function resetPinnedElements() {
    pinnedIds.clear();
    pinnedContainer.innerHTML = "";
  }
  exported.resetPinnedElements = resetPinnedElements;

  function loadPinnedElements(saveId: number) {
    const pinnedElements = JSON.parse(
        localStorage.getItem("pinned-elements") ?? "[]"
      ),
      curPinnedElements = pinnedElements[saveId];
    if (curPinnedElements?.length > 0) pinElements(curPinnedElements, false);
  }
  exported.loadPinnedElements = loadPinnedElements;

  loadPinnedElements(v_container.currSave);

  const itemsContainer = document.querySelector(".items");
  itemsContainer.before(pinnedContainerContainer);

  pinnedContainer.addEventListener("mousedown", function (e) {
    if (e.altKey && e.button === 0) {
      const item = traverseUntil(e.target, ".item");
      if (!item) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      unpinElements({
        id: item.getAttribute("data-item-id")!,
        text: item.getAttribute("data-item-text")!,
        emoji: item.getAttribute("data-item-emoji")!,
        discovery: item.getAttribute("data-item-discovery") !== null,
      });
    }
  });

  itemsContainer.addEventListener("mousedown", function (e) {
    if (e.altKey && e.button === 0) {
      const item = traverseUntil(e.target, ".item");
      if (!item) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      pinElements({
        id: item.getAttribute("data-item-id")!,
        text: item.getAttribute("data-item-text")!,
        emoji: item.getAttribute("data-item-emoji")!,
        discovery: item.getAttribute("data-item-discovery") !== null,
      });
    }
  });

  window.addEventListener("ic-switchsave", function (e) {
    resetPinnedElements();
    loadPinnedElements((e as CustomEvent).detail.newId);
  });
}

function interceptMouseEvent(e: MouseEvent, type: string, options = {}) {
  e.preventDefault();
  e.stopImmediatePropagation();

  const syntheticEvent = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: e.clientX,
    clientY: e.clientY,
    screenX: e.screenX,
    screenY: e.screenY,
    button: e.button,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    ...options,
  });

  syntheticEvent.synthetic = true;

  e.target.dispatchEvent(syntheticEvent);
}

function initOldMouseControls() {
  let isCtrlDragging = false;

  window.addEventListener(
    "mousedown",
    (e) => {
      if (e.synthetic) return;

      if (e.button === 1 && traverseUntil(e.target, ".instance, .item")) {
        interceptMouseEvent(e, "mousedown", { button: 0, shiftKey: true });
      } else if (e.button === 0 && e.ctrlKey) {
        isCtrlDragging = true;
        interceptMouseEvent(e, "mousedown", { button: 1 });
      }
    },
    true
  );

  window.addEventListener(
    "mouseup",
    (e) => {
      if (!isCtrlDragging) return;
      isCtrlDragging = false;
      interceptMouseEvent(e, "mouseup", { button: 1 });
    },
    true
  );
}

function initSidebarUpdates({ v_sidebar }: { v_sidebar: IC_Sidebar_VUE }) {
  const items = document.querySelector(".items");
  Object.defineProperty(v_sidebar.$el, "scrollTop", {
    get() {
      return items.scrollTop;
    },
    set(value) {
      items.scrollTop = value;
    },
    configurable: true,
  });
  items.addEventListener("scroll", function () {
    const scrollPercentage =
      (items.scrollTop + items.clientHeight) / items.scrollHeight;
    if (scrollPercentage > 0.8727) v_sidebar.limit += 300;
  });

  const oldFilteredElementsCut =
    v_sidebar._computedWatchers.filteredElementsCut.getter;
  v_sidebar._computedWatchers.filteredElementsCut.getter = function (...a) {
    if (this.searchQuery) return [];
    return oldFilteredElementsCut.apply(this, a);
  };

  // fix for sort by emoji (neal where are you)
  const oldSortedELements = v_sidebar._computedWatchers.sortedElements.getter;
  v_sidebar._computedWatchers.sortedElements.getter = function (...a) {
    if (this.sortBy.name === "emoji") {
      const sortFn = this.sortBy.asc
        ? (a, b) => (b.emoji ?? "⬜").localeCompare(a.emoji ?? "⬜")
        : (a, b) => (a.emoji ?? "⬜").localeCompare(b.emoji ?? "⬜");
      return this.items.toSorted(sortFn);
    }
    return oldSortedELements.apply(this, a);
  };
}

function choose<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)]!;
}

function getRandomCirclePos(center: { x: number; y: number }, radius: number) {
  const angle = Math.random() * Math.PI * 2,
    r = Math.sqrt(Math.random()) * radius;
  return {
    x: center.x + Math.cos(angle) * r,
    y: center.y + Math.sin(angle) * r,
  };
}

function initRandomButton({ v_sidebar }: { v_sidebar: IC_Sidebar_VUE }) {
  const sideControls = document.querySelector(".side-controls"),
    randomButton = document.createElement("img");
  randomButton.classList.add("random", "tool-icon");
  randomButton.src = randomIcon;
  sideControls.appendChild(randomButton);

  function chooseRandomElement() {
    let items =
      v_sidebar.searchResults.length > 0
        ? v_sidebar.searchResults
        : v_sidebar.filteredElements.length > 0
        ? v_sidebar.filteredElements
        : v_sidebar.items;

    //! filters out dead elements
    items = items.filter(
      (item) =>
        !(
          (/^\d+$/.test(item.text) && item.text.length > 6) ||
          item.text.length > 30
        )
    );

    if (items.length < 1) return null;
    if (settings.randomButton === 1) return choose(items);
    if (items.length < 32768) {
      const filtered = items.filter((x) => !x.hide && x.text.length < 31);
      return choose(filtered.length > 0 ? filtered : items);
    } else {
      for (let i = 100; i--; ) {
        const choice = choose(items);
        if (!choice.hide && choice.text.length < 31) return choice;
      }
      return choose(items);
    }
  }

  let instanceSound,
    localRate = 0.9;

  function spawnRandomInstance() {
    const element = chooseRandomElement();
    if (!element) return;
    unsafeWindow.IC.createInstance({
      text: element.text,
      emoji: element.emoji ?? "⬜",
      itemId: element.id,
      discovery: element.discovery,
      animate: true,
      ...getRandomCirclePos(
        {
          x: (window.innerWidth - v_sidebar.sidebarWidth) / 2,
          y: window.innerHeight / 2,
        },
        (window.innerWidth - v_sidebar.sidebarWidth) / 6
      ),
    });
    if (
      (instanceSound ??= unsafeWindow.Howler._howls.find((x) =>
        x._src.endsWith("instance.mp3")
      ))
    ) {
      localRate += 0.1;
      if (localRate > 1.3) localRate = 0.9;
      instanceSound.rate(localRate);
      instanceSound.play();
    }
  }

  randomButton.addEventListener("click", function () {
    spawnRandomInstance();
  });
}

function initEvents({ v_container }: { v_container: IC_Container_VUE }) {
  const switchSave = v_container.switchSave;
  v_container.switchSave = function (id) {
    dispatchEvent(
      new CustomEvent("ic-switchsave", {
        detail: { currentId: v_container.currSave, newId: id },
      })
    );
    return switchSave.apply(this, [id]);
  };

  const craftApi = v_container.craftApi;
  v_container.craftApi = async function (a, b) {
    [a, b] = [a, b].sort() as [string, string];
    const result = await craftApi.apply(this, [a, b]);
    dispatchEvent(new CustomEvent("ic-craftapi", { detail: { a, b, result } }));
    return result;
  };
}

function init() {
  GM.addStyle(css);

  const v_container = document.querySelector(".container").__vue__;
  const v_sidebar = document.querySelector("#sidebar").__vue__;
  const v = { v_container, v_sidebar };

  initSidebarUpdates(v);

  if (settings.searchDebounceDelay > 0) initSearchDebounce(v);
  if (settings.searchRelevancy) initSearchRelevancy(v);

  if (settings.recipeLookup) initRecipeLookup(v);
  if (settings.recipeLogging) initRecipeLogging(v);

  if (settings.removeDeps) {
    const addDep = v_sidebar._computedWatchers.sortedElements.addDep;
    (["sortedElements", "filteredElements", "searchResults"] as const).forEach(
      (k) =>
        (v_sidebar._computedWatchers[k].addDep = function (...a) {
          // if (a[0].subs[0]?.value !== undefined) return addDep.apply(this, a);
          if (this.newDepIds.size < 65) return addDep.apply(this, a);
        })
    );
  }
  if (settings.randomButton > 0) initRandomButton(v);
  if (settings.elementPinning) initPinnedContainer(v);
  if (settings.oldMouseControls) initOldMouseControls(v);
  if (settings.disableParticles) {
    const r = window.requestAnimationFrame;
    window.requestAnimationFrame = () => (window.requestAnimationFrame = r);
    v_container.$refs.particles.style.display = "none";
  }
  if (settings.variation) {
    const toLowerCase = String.prototype.toLowerCase;
    const find = Array.prototype.find;
    Array.prototype.find = function (f) {
      if (
        this !== v_container.items ||
        !/function\((\w+?)\){return \1\.text\.toLowerCase\(\)===\w+?\.text\.toLowerCase\(\)}/.test(
          f.toString()
        )
      )
        return find.apply(this, [f]);
      String.prototype.toLowerCase = String.prototype.toString;
      const result = find.apply(this, [f]);
      String.prototype.toLowerCase = toLowerCase;
      return result;
    };
  }

  initEvents(v);

  interface ExportedWindow extends Window {
    ICHelper: Exported;
  }

  const exportedWindow = unsafeWindow as ExportedWindow;

  exportedWindow.ICHelper = exported;
}

window.addEventListener("load", init);
