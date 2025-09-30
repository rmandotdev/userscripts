import { addCss } from "./css";

(function () {
  "use strict";

  let saveTimeout: number;
  function saveSettings() {
    window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
      GM_setValue<Settings>("sandwhich_settings", settings);
      // console.log("SandwhichMod: Settings saved.");
    }, 500);
  }

  interface Settings {
    selection: {
      enabled: boolean;
      customColor: string;
      borderStyle: string;
      borderWidth: number;
      chromaSpeed: number;
      scale: number;
    };
    tabs: {
      enabled: boolean;
      customColor: string;
      animationSpeed: number;
    };
    spawn: {
      copy: boolean;
      paste: boolean;
      columnSplit: number;
      columnDistance: number;
      rowDistance: number;
      ghosts: boolean;
      fromSelected: boolean;
    };
    unicode: {
      searchEnabled: boolean;
      searchCheckbox: boolean;
      searchDebounceDelay: number;
      searchAmount: number;
      searchCompact: boolean;
      searchMultiCharacter: boolean;
      infoInRecipeModal: boolean;
    };
  }

  const defaultSettings: Settings = {
    selection: {
      enabled: false,
      customColor: "#ff00ff",
      borderStyle: "ridge",
      borderWidth: 5,
      chromaSpeed: 0,
      scale: 50,
    },
    tabs: {
      enabled: false,
      customColor: "#cccccc",
      animationSpeed: 10,
    },
    spawn: {
      copy: false,
      paste: false,
      columnSplit: 100,
      columnDistance: 200,
      rowDistance: 50,
      ghosts: false,
      fromSelected: false,
    },
    unicode: {
      searchEnabled: false,
      searchCheckbox: false,
      searchDebounceDelay: 200,
      searchAmount: 15,
      searchCompact: false,
      searchMultiCharacter: false,
      infoInRecipeModal: true,
    },
  };
  const settings = createReactiveProxy(
    mergeSettings(
      GM_getValue<Settings>("sandwhich_settings", {} as Settings),
      defaultSettings
    ),
    saveSettings
  );
  saveSettings(); // Initial save

  function mergeSettings(saved: Settings, defaults: Settings) {
    for (let k in defaults) {
      const key = k as keyof Settings;
      if (defaults.hasOwnProperty(key)) {
        if (
          typeof defaults[key] === "object" &&
          !Array.isArray(defaults[key])
        ) {
          saved[key] = mergeSettings(saved[key] || {}, defaults[key]);
        } else if (saved[key] === undefined) {
          saved[key] = defaults[key];
        }
      }
    }
    return saved;
  }

  // --- Reactive Proxy ---
  function createReactiveProxy<T>(target: T, onChange: () => void): T {
    if (typeof target !== "object" || target === null) return target;
    const handler = {
      set(obj, prop, value) {
        if (obj[prop] !== value) {
          const success = Reflect.set(obj, prop, value);
          if (success) onChange();
          return success;
        }
        return true;
      },
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (typeof value === "object" && value !== null) {
          return createReactiveProxy(value, onChange);
        }
        return value;
      },
      deleteProperty(obj, prop) {
        if (prop in obj) {
          const success = Reflect.deleteProperty(obj, prop);
          if (success) onChange();
          return success;
        }
        return true;
      },
    };
    return new Proxy(target, handler);
  }

  type TabDataElement = [string, number, number];

  interface TabDataTab {
    elements: TabDataElement[];
    name: string;
  }

  interface TabData {
    currTab: number;
    tabs: TabDataTab[];
  }

  type Mods = {
    selection: {
      init: () => void;
      enable: () => void;
      disable: () => void;
      update: () => void;
    };
    spawn: {
      mouseData: {
        x: number;
        y: number;
      };
      ghostElements: Set<unknown>;
      ghostInitialized: boolean;

      init: () => void;
      spawnInstance: (element: string, x: number, y: number) => void;
      ghostInit: () => void;
      handleClipboardPaste: (lineage: string) => void;
      handleSpawnFromSelected: () => void;
      handleSpawnAlphabet: (text: string, x: number, y: number) => unknown;
      getAllAlphabets: (minCount: number) => string[];
      handleSpawnUnicode: (
        text: string,
        x: number,
        y: number,
        rows?: number
      ) => unknown;
    };
    tabs: {
      tabData: TabData;
      defaultTabData: TabData;
      draggedTabIndex: number | unknown | null;
      cleanupResizeObserver: ResizeObserver | null;

      init: () => void;
      enable: () => void;
      disable: () => void;
      updateColors: () => void;
      updateCurrentTabElements: () => void;
      saveTabData: () => void;
      addTab: (index?: number, data?: TabDataTab) => void;
      loadTab: (index: number) => void;
      switchTab: (index: number) => void;
      deleteTab: (index: number) => void;
      duplicateTab: (index: number) => void;
      renameTab: (index: number) => void;
      downloadTab: (index: number) => void;
      uploadTab: () => void;
      getVisualTabFromId: (index: number) => HTMLButtonElement;
      createVisualTabButton: (index: number, name: string) => void;
      refreshVisualTabButtons: () => void;
      showContextMenu: (
        event: MouseEvent,
        options: [string, unknown][]
      ) => void;
    };
    unicode: {
      unicodeData: {
        [key: string]: [string, string];
      } | null;
      unicodeElements:
        | ((IC_Container_VUE_CraftApiResponse & ICItemData) | ICItemData)[]
        | null;
      segmenter: Intl.Segmenter | null;
      recipeModalObserver: unknown;
      itemScopedDataAttribute: string | null;
      searchDiscoveries: boolean;

      nealSortFunctions: {
        [key: string]: (a: ICItemData, b: ICItemData) => number;
      };
      categoryMap: unknown;

      init: () => void;
      enableCheckbox: () => void;
      disableCheckbox: () => void;
      enableSearch: () => void;
      disableSearch: () => void;
      startRecipeModalObserver: () => void;
      stopRecipeModalObserver: () => void;
      fetchUnicodeData: () => void;
      parseUnicodeData: (unicodeText: string) => {
        [key: string]: [string, string];
      };
      isUnicode: (text: string) => boolean;
      updateUnicodeElements: () => void;
      updateUnicodeElementsSort: () => void;
      findItemScopedDataAttribute: () => string;
      createItemElement: (item: ICItemData, wrap?: boolean) => HTMLDivElement;
      updateSearch: () => void;
      performSearch: (amount?: number) => void;

      updateSearchTimeoutId?: number;
      rightClickUpListener?: (e: MouseEvent) => void;
    };
  };

  const mods: Mods = {
    //
    //            _______ _________ _____    _________   ______ _________ _____   ____   ____  _____
    //           /  ___  |_   ___  |_   _|  |_   ___  |./ ___  |  _   _  |_   _|.'    \.|_   \|_   _|
    //          |  (__ \_| | |_  \_| | |      | |_  \_| ./   \_|_/ | | \_| | | /  .--.  \ |   \ | |
    //           '.___\-.  |  _|  _  | |   _  |  _|  _| |          | |     | | | |    | | | |\ \| |
    //          |\\____) |_| |___/ |_| |__/ |_| |___/ | \.___.'\  _| |_   _| |_\  \--'  /_| |_\   |_
    //          |_______.'_________|________|_________|\._____.' |_____| |_____|\.____.'|_____|\____|
    selection: {
      init: function () {
        if (settings.selection.enabled) this.enable();
      },

      enable: function () {
        settings.selection.enabled = true;
        document
          .querySelector("#select-box")
          .classList.add("sandwhich-select-box");
        document.body.classList.add("sandwhich-sel-active"); // flag to style elements
        this.update();
      },
      disable: function () {
        settings.selection.enabled = false;
        document
          .querySelector("#select-box")
          .classList.remove("sandwhich-select-box");
        document.body.classList.remove("sandwhich-sel-active");
      },
      update: function () {
        document.documentElement.style.setProperty(
          "--sandwhich-sel-border",
          `${settings.selection.borderWidth}px ${settings.selection.borderStyle} ${settings.selection.customColor}`
        );
        document.documentElement.style.setProperty(
          "--sandwhich-sel-background",
          `hsl(from ${settings.selection.customColor} h s l / 0.3)`
        );
        document.documentElement.style.setProperty(
          "--sandwhich-sel-scale",
          `${settings.selection.scale}%`
        );

        const chromaSpeed = 10 / settings.selection.chromaSpeed;
        document.documentElement.style.setProperty(
          "--sandwhich-sel-chroma-animation",
          `sandwhich-chromaCycleBorder ${Math.abs(
            chromaSpeed
          )}s infinite linear${chromaSpeed < 0 ? " reverse" : ""}, ` +
            `sandwhich-chromaCycleBackground ${Math.abs(
              chromaSpeed
            )}s infinite linear${chromaSpeed < 0 ? " reverse" : ""}` +
            `${
              settings.selection.borderWidth >= 30
                ? `, sandwhich-rotateBorder ${Math.abs(
                    chromaSpeed
                  )}s infinite linear${chromaSpeed < 0 ? " reverse" : ""}`
                : ""
            }`
        );
      },
    },
    //
    //              ___           ___         ___           ___           ___                    ___                                                 ___
    //             /  /\         /  /\       /  /\         /__/\         /__/\                  /__/\          ___       ___                        /  /\
    //            /  /:/_       /  /::\     /  /::\       _\_ \:\        \  \:\                 \  \:\        /  /\     /  /\                      /  /:/_
    //           /  /:/ /\     /  /:/\:\   /  /:/\:\     /__/\ \:\        \  \:\                 \  \:\      /  /:/    /  /:/      ___     ___    /  /:/ /\
    //          /  /:/ /::\   /  /:/~/:/  /  /:/~/::\   _\_ \:\ \:\   _____\__\:\            ___  \  \:\    /  /:/    /__/::\     /__/\   /  /\  /  /:/ /::\
    //         /__/:/ /:/\:\ /__/:/ /:/  /__/:/ /:/\:\ /__/\ \:\ \:\ /__/::::::::\          /__/\  \__\:\  /  /::\    \__\/\:\__  \  \:\ /  /:/ /__/:/ /:/\:\
    //         \  \:\/:/~/:/ \  \:\/:/   \  \:\/:/__\/ \  \:\ \:\/:/ \  \:\~~\~~\/          \  \:\ /  /:/ /__/:/\:\      \  \:\/\  \  \:\  /:/  \  \:\/:/~/:/
    //          \  \::/ /:/   \  \::/     \  \::/       \  \:\ \::/   \  \:\  ~~~            \  \:\  /:/  \__\/  \:\      \__\::/   \  \:\/:/    \  \::/ /:/
    //           \__\/ /:/     \  \:\      \  \:\        \  \:\/:/     \  \:\                 \  \:\/:/        \  \:\     /__/:/     \  \::/      \__\/ /:/
    //             /__/:/       \  \:\      \  \:\        \  \::/       \  \:\                 \  \::/          \__\/     \__\/       \__\/         /__/:/
    //             \__\/         \__\/       \__\/         \__\/         \__\/                  \__\/                                               \__\/
    spawn: {
      mouseData: { x: null, y: null },
      ghostElements: new Set(),
      ghostInitialized: false,

      init: function () {
        document.addEventListener("mousemove", (e) => {
          this.mouseData.x = e.clientX;
          this.mouseData.y = e.clientY;
        });

        let ctrlCHandled = false;
        let ctrlVHandled = false;
        document.addEventListener("keydown", (e) => {
          if (
            settings.spawn.paste &&
            e.ctrlKey &&
            e.shiftKey &&
            e.key.toUpperCase() === "V" &&
            !ctrlVHandled
          ) {
            navigator.clipboard
              .readText()
              .then((text) => this.handleClipboardPaste(text));
            ctrlVHandled = true;
            e.preventDefault();
          }

          if (
            settings.spawn.copy &&
            e.ctrlKey &&
            e.key.toUpperCase() === "C" &&
            !ctrlCHandled
          ) {
            const hoveredElement = document.elementFromPoint(
              this.mouseData.x,
              this.mouseData.y
            );

            if (!hoveredElement) {
              throw new Error("!hoveredElement");
            }

            let copyText;
            if (hoveredElement.matches(".item")) {
              copyText = hoveredElement.childNodes[1].textContent!.trim();
            } else if (hoveredElement.matches(".instance")) {
              const selectedInstances = unsafeWindow.IC.getInstances().filter(
                (x) => x.element.classList.contains("instance-selected")
              );
              if (selectedInstances.length <= 1) {
                copyText = hoveredElement.childNodes[1].textContent!.trim();
              } else {
                let { x, y } = unsafeWindow.IC.screenToWorld(
                  this.mouseData.x,
                  this.mouseData.y
                );
                copyText = selectedInstances
                  .map(
                    (element) =>
                      `${element.text}  ${(element.x - x).toFixed(2)} ${(
                        element.y - y
                      ).toFixed(2)}`
                  )
                  .join("\n");
              }
            }
            if (copyText) {
              navigator.clipboard.writeText(copyText);
              console.log(`copied to clipboard: "${copyText}"`);
              e.preventDefault();
            }
            ctrlCHandled = true;
          }

          if (
            settings.spawn.fromSelected &&
            e.ctrlKey &&
            e.key.toUpperCase() === "B"
          ) {
            this.handleSpawnFromSelected();
            e.preventDefault();
          }
        });

        document.addEventListener("keyup", function (e) {
          if (e.key.toUpperCase() === "C") ctrlCHandled = false;
          if (e.key.toUpperCase() === "V") ctrlVHandled = false;
        });
      },

      spawnInstance: function (element, x, y) {
        const item = document
          .querySelector(".container")
          .__vue__.items.find((x) => x.text === element);
        if (item) {
          IC.createInstance({
            text: item.text,
            itemId: item.id,
            emoji: item.emoji,
            discovery: item.discovery,
            x,
            y,
            animate: true,
          });
        } else if (settings.spawn.ghosts) {
          // Spawn as ghost!
          const ghostElement = IC.createInstance({
            text: element,
            itemId: -1,
            emoji: "",
            x,
            y,
          });
          ghostElement.disabled = true;
          ghostElement.element.style.opacity = "0.2";

          const onlyAllowRightClick = (event: MouseEvent) => {
            if (event.button !== 2) {
              event.stopPropagation();
              event.preventDefault();
            }
          };
          // Attach the listener to the ghost element
          ghostElement.element.addEventListener(
            "mousedown",
            onlyAllowRightClick,
            { capture: true }
          );

          this.ghostElements.add(element);
          if (!this.ghostInitialized) this.ghostInit();
        }
      },

      ghostInit: function () {
        this.ghostInitialized = true;

        const modsSpawn = this;

        const v_container = document.querySelector(".container").__vue__;
        const craftApi = v_container.craftApi;
        v_container.craftApi = async function (...args) {
          let response = await craftApi(...args);

          if (response && modsSpawn.ghostElements.has(response.text)) {
            modsSpawn.ghostElements.delete(response.text);
            let updateInstances = unsafeWindow.IC.getInstances().filter(
              (x) =>
                x.disabled === true &&
                x.itemId === -1 &&
                x.text === response.text
            );
            if (updateInstances.length > 0)
              setTimeout(() => {
                unsafeWindow.IC.removeInstances(updateInstances);
                for (const instance of updateInstances) {
                  const { x, y } = unsafeWindow.IC.worldToScreen(
                    instance.x,
                    instance.y
                  );
                  modsSpawn.spawnInstance(response.text, x, y);
                }
              }, 0);
          }

          return response;
        };
      },

      handleClipboardPaste: function (lineage) {
        let coordLessCounter = 0;

        let actualColumnDist =
          settings.spawn.columnDistance * unsafeWindow.IC.getZoom();
        let actualRowDist =
          settings.spawn.rowDistance * unsafeWindow.IC.getZoom();

        for (const line of lineage.split(`\n`).filter(Boolean)) {
          let column =
            Math.floor(coordLessCounter / settings.spawn.columnSplit) *
            actualColumnDist;
          let row =
            (coordLessCounter % settings.spawn.columnSplit) * actualRowDist;

          // check if last part is '  number number'
          const lastIndex = line.lastIndexOf("  ");
          if (lastIndex !== -1) {
            const part2 = line.slice(lastIndex + 2);
            const [x, y] = part2.split(" ", 2).map(Number) as [number, number];
            if (!isNaN(x) && !isNaN(y)) {
              const part1 = line.slice(0, lastIndex);
              this.spawnInstance(
                part1,
                this.mouseData.x + x,
                this.mouseData.y + y
              );
              continue;
            }
          }
          coordLessCounter++;

          if (
            line.includes(" = ") ||
            line.includes(" => ") ||
            line.includes(" -> ")
          ) {
            const [ings, result] = line
              .split(/ \/\/| ::/)[0]!
              .split(/ = | => | -> /, 2)
              .map((x) => x.trim()) as [string, string];
            const plusIndex = ings.indexOf(" + ");
            const [first, second] = [
              ings.slice(0, plusIndex),
              ings.slice(plusIndex + 3),
            ].map((x) => x.trim()) as [string, string];

            // lineages split 3.5 further
            column *= 3.5;

            [first, second, result].forEach((element, i) => {
              this.spawnInstance(
                element,
                this.mouseData.x + column + i * actualColumnDist,
                this.mouseData.y + row
              );
            });
            continue;
          }

          this.spawnInstance(
            line,
            this.mouseData.x + column,
            this.mouseData.y + row
          );
        }
      },

      handleSpawnFromSelected: function () {
        const selectedInstances = unsafeWindow.IC.getInstances().filter((x) =>
          x.element.classList.contains("instance-selected")
        );
        if (selectedInstances.length >= 2) {
          alert(`More than 1 Element is selected: ${selectedInstances.length}`);
          return;
        }

        const selectedInstance = selectedInstances[0];
        if (selectedInstance) {
          if (/[a-zA-Z]/.test(selectedInstance.text)) {
            const { x, y } = unsafeWindow.IC.worldToScreen(
              selectedInstance.x,
              selectedInstance.y
            );
            if (this.handleSpawnAlphabet(selectedInstance.text, x, y)) {
              // successfully spawned alphabet
              unsafeWindow.IC.removeInstances([selectedInstance]);
            }
          } else if (Array.from(selectedInstance.text).length === 1) {
            const { x, y } = unsafeWindow.IC.worldToScreen(
              selectedInstance.x,
              selectedInstance.y
            );
            if (this.handleSpawnUnicode(selectedInstance.text, x, y)) {
              // successfully spawned unicodes
              unsafeWindow.IC.removeInstances([selectedInstance]);
            }
          }
        } else {
          // no selectedInstance, let user decide
          let input = prompt(
            `You didn't have anything selected, so here is a generic menu.\nSelect one:\n a - Spawn Alphabet(s)\n u - Spawn Unicode(s)`
          );
          if (input?.toLowerCase() === "a") {
            let promptAlphabets = prompt(
              `Generic Alphabet Spawn:` +
                `\n - Enter Alphabets separated by Double Spaces (e.g. 'X   .x   _x   X!)` +
                `\nOR\n - Enter ALL to spawn ALL of your alphabets (might lag)`
            );
            if (!promptAlphabets) {
              throw new Error("promptAlphabets");
            }
            if (promptAlphabets.toUpperCase() === "ALL") {
              promptAlphabets = this.getAllAlphabets(5).join("  ");
            }
            promptAlphabets
              .split("  ")
              .forEach((x, i) =>
                this.handleSpawnAlphabet(
                  x,
                  this.mouseData.x + (i * settings.spawn.columnDistance) / 2,
                  this.mouseData.y
                )
              );
          }
          if (input?.toLowerCase() === "u") {
            let promptCodepoint =
              prompt(
                `Generice Unicode Spawn:\n - Enter a Unicode Codepoint or a Unicode Character! (e.g. U+0069 or 0069 or i)`
              ) ?? "";
            const maybeNum = parseInt(
              promptCodepoint.replace(/^[Uu]\+/, ""),
              16
            );
            if (!isNaN(maybeNum)) {
              promptCodepoint = String.fromCodePoint(maybeNum);
            }
            if (Array.from(promptCodepoint).length === 1)
              this.handleSpawnUnicode(
                promptCodepoint,
                this.mouseData.x,
                this.mouseData.y
              );
            else if (promptCodepoint !== "")
              alert(`${promptCodepoint} is not valid :(`);
          }
        }
      },

      handleSpawnAlphabet: function (text, x, y) {
        const choices = [...text].reduce<[string, number][]>(
          (map, char, index) => {
            if (/[a-zA-Z]/.test(char)) map.push([char, index]);
            return map;
          },
          []
        );

        const positionsMessage = choices
          .map((item, i) => ` ${i + 1} - ${item[0]}`)
          .join("\n");
        const choiceIndex =
          choices.length === 1
            ? 0
            : Number(
                prompt(
                  `Alphabet Spawn: ${text}\nWhich letter do you want to cycle?\n${positionsMessage}`
                )
              ) - 1;
        const choice = choices[choiceIndex];

        if (choice) {
          const [char, index] = choice;
          const lower = char === char.toLowerCase();

          const alphabet = "abcdefghijklmnopqrstuvwxyz";
          for (let i = 0; i < alphabet.length; i++) {
            const letter = lower ? alphabet[i] : alphabet[i]!.toUpperCase();

            const newElement =
              text.slice(0, index) + letter + text.slice(index + 1);
            this.spawnInstance(
              newElement,
              x,
              y + i * settings.spawn.rowDistance
            );
          }
          return true;
        } else if (choiceIndex != -1)
          alert(`${choiceIndex + 1} was not one of the options :(`);
      },

      getAllAlphabets: function (minCount) {
        const entries = Object.entries(
          IC.getItems().reduce<{ [key: string]: number }>((total, x) => {
            const letters = x.text.match(/[a-zA-Z]/g);
            if (letters?.length === 1) {
              const key = x.text.replace(
                letters[0],
                letters[0] === letters[0].toLowerCase() ? "x" : "X"
              );
              total[key] = (total[key] || 0) + 1;
            }
            return total;
          }, {})
        );
        return entries
          .filter(([key, value]) => value >= minCount)
          .sort((a, b) => b[1] - a[1])
          .map(([key]) => key);
      },

      handleSpawnUnicode: function (text, x, y, rows) {
        if (!rows)
          rows = Number(
            prompt(
              `Unicode Spawn: ${text}  U+${text
                .codePointAt(0)!
                .toString(16)
                .padStart(
                  4,
                  "0"
                )}\nHow many rows after this element should it spawn?`
            )
          );
        if (!rows) return;

        const codepoint = text.codePointAt(0)!;
        const baseCode = codepoint & 0xffff0;

        for (let row = 0; row < rows; row++) {
          for (let step = 0; step < 16; step++) {
            const charCode = baseCode + step + row * 16;

            this.spawnInstance(
              String.fromCodePoint(charCode),
              x + (step * settings.spawn.columnDistance) / 2,
              y + row * settings.spawn.rowDistance
            );
          }
        }

        return true;
      },
    },
    //
    //             _________      __      ______    _______
    //            |  _   _  |    /  \    |_   _ \  /  ___  |
    //            |_/ | | \_|   / /\ \     | |_) ||  (__ \_|
    //                | |      / ____ \    |  __/. '.___\-.
    //               _| |_   _/ /    \ \_ _| |__) |\\____) |
    //              |_____| |____|  |____|_______/|_______.'
    tabs: {
      tabData: null,
      defaultTabData: { currTab: 0, tabs: [{ elements: [], name: "Tab 1" }] },
      draggedTabIndex: null,

      cleanupResizeObserver: null,

      init: function () {
        if (settings.tabs.enabled) this.enable();
      },

      enable: function () {
        const infiniteCraftContainer =
          document.querySelector(".infinite-craft");

        const container = document.createElement("div");
        container.id = "sandwhich-tab-container";
        infiniteCraftContainer.appendChild(container);

        const list = document.createElement("div");
        list.id = "sandwhich-tab-list";
        container.appendChild(list);

        const addButton = document.createElement("button");
        addButton.className = "sandwhich-tab-add-button";
        addButton.textContent = "+";
        addButton.title = "Add New Tab";
        addButton.onclick = () => this.addTab();
        addButton.oncontextmenu = (e) => {
          e.preventDefault();
          this.showContextMenu(e, [["Upload Tab", () => this.uploadTab()]]);
        };
        container.appendChild(addButton);

        const sidebar = document.querySelector("#sidebar");

        const positionTabBar = function () {
          container.style.left = `200px`;
          container.style.right = `${
            sidebar.getBoundingClientRect().width + 150
          }px`;
        };

        this.cleanupResizeObserver = new ResizeObserver(() => positionTabBar());
        this.cleanupResizeObserver.observe(sidebar);
        positionTabBar();

        const contextMenuElement = document.createElement("div");
        contextMenuElement.id = "sandwhich-tab-contextmenu";
        contextMenuElement.style.display = "none"; // Start hidden
        infiniteCraftContainer.appendChild(contextMenuElement);

        this.tabData = GM_getValue("tabData", this.defaultTabData);
        this.refreshVisualTabButtons();

        this.updateColors();
        settings.tabs.enabled = true;
      },

      disable: function () {
        const container = document.getElementById("sandwhich-tab-container");
        if (container) container.remove();

        const contextMenu = document.getElementById(
          "sandwhich-tab-contextmenu"
        );
        if (contextMenu) contextMenu.remove();

        if (this.cleanupResizeObserver) {
          this.cleanupResizeObserver.disconnect();
          this.cleanupResizeObserver = null;
        }

        settings.tabs.enabled = false;
      },

      updateColors: function () {
        document.documentElement.style.setProperty(
          "--sandwhich-tab-color",
          settings.tabs.customColor
        );
      },

      updateCurrentTabElements: function () {
        const elements: TabDataElement[] =
          unsafeWindow.IC.getInstances().map<TabDataElement>((instance) => {
            const { x, y } = unsafeWindow.IC.worldToScreen(
              instance.x,
              instance.y
            );
            return [instance.text, x, y];
          });
        this.tabData.tabs[this.tabData.currTab]!.elements = elements;
      },

      saveTabData: function () {
        GM_setValue("tabData", this.tabData);
      },

      addTab: function (index, data) {
        this.updateCurrentTabElements();
        const newTab: TabDataTab = data ?? {
          elements: [],
          name: `Tab ${this.tabData.tabs.length + 1}`,
        };
        let newIndex = index;
        if (index === undefined || index >= this.tabData.tabs.length) {
          // normal add new tab at the end
          this.tabData.tabs.push(newTab);
          newIndex = this.tabData.tabs.length - 1;
        } else {
          // splice tab in
          this.tabData.tabs.splice(index, 0, newTab);
        }

        this.refreshVisualTabButtons();
        this.switchTab(newIndex);

        const animatedTab = this.getVisualTabFromId(newIndex);
        animatedTab.style.animation = `slideIn ${
          settings.tabs.animationSpeed / 50
        }s ease-out`;
      },

      loadTab: function (index) {
        if (index >= this.tabData.tabs.length) index = 0;
        const tab = this.tabData.tabs[index]!;

        unsafeWindow.IC.clearInstances();

        for (const [text, x, y] of tab.elements) {
          mods.spawn.spawnInstance(text, x, y);
        }

        this.tabData.currTab = index;
      },

      switchTab: function (index) {
        this.updateCurrentTabElements();
        if (this.tabData.currTab == index) return;

        this.loadTab(index);
        document
          .querySelectorAll(".sandwhich-tab")
          .forEach((button) => button.classList.remove("active"));
        this.getVisualTabFromId(index).classList.add("active");

        this.saveTabData();
      },

      deleteTab: function (index) {
        if (this.tabData.tabs.length <= 1) {
          unsafeWindow.IC.clearInstances();
          this.tabData.tabs = this.defaultTabData.tabs;
          this.refreshVisualTabButtons();
        } else {
          this.tabData.tabs.splice(index, 1);
          if (this.tabData.currTab > index) {
            this.tabData.currTab--;
          } else if (this.tabData.currTab === index) {
            if (this.tabData.currTab > 0) this.tabData.currTab--;
            this.loadTab(this.tabData.currTab);
          }

          const deletedTabWidth = this.getVisualTabFromId(index).offsetWidth;
          this.refreshVisualTabButtons();

          const sizer = document.createElement("div");
          sizer.className = "sandwhich-tab-sizer";
          sizer.style.width = `${deletedTabWidth}px`;
          sizer.style.transition = `width ${
            settings.tabs.animationSpeed / 50
          }s ease-out`;
          sizer.addEventListener("transitionend", () => sizer.remove());
          setTimeout(() => (sizer.style.width = "0"), 0);

          const tabList = document.querySelector(
            "#sandwhich-tab-list"
          ) as HTMLDivElement;
          tabList.insertBefore(
            sizer,
            this.getVisualTabFromId(index) ??
              tabList.querySelector(".addButton")
          );
        }

        this.saveTabData();
      },

      duplicateTab: function (index) {
        this.switchTab(index);
        const toDuplicateTab = this.tabData.tabs[index]!;
        this.addTab(index + 1, {
          elements: toDuplicateTab.elements.slice(),
          name: toDuplicateTab.name,
        }); // .slice() -> cloning

        this.saveTabData();
      },

      renameTab: function (index) {
        const newName = prompt(
          `Enter a new name! (${this.tabData.tabs[index]!.name})`
        );
        if (newName) {
          this.tabData.tabs[index]!.name = newName;
          this.getVisualTabFromId(index).textContent = newName;
        }
        this.saveTabData();
      },

      downloadTab: function (index) {
        this.updateCurrentTabElements();

        const tab = this.tabData.tabs[index]!;
        const blob = new Blob([JSON.stringify(tab, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ICTAB ${tab.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
      },

      uploadTab: function () {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.style.display = "none";

        input.addEventListener("change", (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            alert("No file selected.");
            document.body.removeChild(input);
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const tab = JSON.parse(e.target.result);
              // Success!
              this.addTab(undefined, tab);
            } catch (error) {
              console.error(
                `Error parsing JSON file: ${(error as Error).message}`
              );
            } finally {
              document.body.removeChild(input); // Clean up input after processing
            }
          };
          reader.onerror = () => {
            alert(`Error reading file: ${reader.error}`);
            document.body.removeChild(input);
          };
          reader.readAsText(file);
        });
        document.body.appendChild(input);
        input.click();
      },

      getVisualTabFromId: (index) =>
        document.querySelector(
          `.sandwhich-tab[data-tab-id="${index}"]`
        ) as HTMLButtonElement,

      createVisualTabButton: function (index, name) {
        const tabList = document.querySelector(
          "#sandwhich-tab-list"
        ) as HTMLDivElement;
        const tabButton = document.createElement("button");
        tabButton.className = "sandwhich-tab";
        tabButton.dataset.tabId = index;
        if (this.tabData.currTab === index) tabButton.classList.add("active");

        tabButton.textContent = name || `Tab ${index + 1}`;
        tabButton.draggable = true;

        tabButton.addEventListener("dragstart", (e) => {
          this.draggedTabIndex = index;
        });
        tabButton.addEventListener("dragover", (e) => {
          e.preventDefault();
          const targetTab = (
            e.target as HTMLButtonElement
          ).closest<HTMLButtonElement>(".sandwhich-tab");
          if (
            targetTab &&
            parseInt(targetTab.dataset["tabId"]!, 10) !== this.draggedTabIndex
          ) {
            targetTab.classList.add("drag-over");
          }
        });
        tabButton.addEventListener("dragleave", (e) => {
          const targetTab = (e.target as HTMLButtonElement).closest(
            ".sandwhich-tab"
          );
          if (targetTab) targetTab.classList.remove("drag-over");
        });
        tabButton.addEventListener("drop", (e) => {
          e.preventDefault();
          const draggedTab = this.tabData.tabs.splice(
            this.draggedTabIndex,
            1
          )[0]!;
          this.tabData.tabs.splice(index, 0, draggedTab);
          this.tabData.currTab = index;

          this.refreshVisualTabButtons();
          this.saveTabData();
        });

        tabButton.onmousedown = () => this.switchTab(index);
        tabButton.oncontextmenu = (e) => {
          e.preventDefault();
          this.showContextMenu(e, [
            ["Rename", () => this.renameTab(index)],
            ["Duplicate", () => this.duplicateTab(index)],
            ["Download", () => this.downloadTab(index)],
            ["Delete", () => this.deleteTab(index)],
          ]);
        };

        tabButton.addEventListener("animationend", () => {
          tabButton.style.animation = "none";
        });

        const referenceNode =
          this.getVisualTabFromId(index + 1) ??
          tabList.querySelector(".addButton");
        tabList.insertBefore(tabButton, referenceNode);
      },

      refreshVisualTabButtons: function () {
        const tabList = document.querySelector(
          "#sandwhich-tab-list"
        ) as HTMLDivElement;
        // clear all children
        tabList.innerHTML = "";
        this.tabData.tabs.forEach((tab, index) =>
          this.createVisualTabButton(index, tab.name)
        );
      },

      showContextMenu: function (event, options) {
        const contextMenu = document.querySelector(
          "#sandwhich-tab-contextmenu"
        ) as HTMLDivElement;
        contextMenu.innerHTML = "";

        for (const [name, func] of options) {
          const contextmenuOption = document.createElement("div");
          contextmenuOption.className =
            "sandwhich-tab-contextmenu-option " + name.toLowerCase();
          contextmenuOption.textContent = name;
          contextmenuOption.onclick = () => {
            func.call(this);
            contextMenu.style.display = "none";
          };
          contextMenu.appendChild(contextmenuOption);
        }

        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.display = "block";

        document.addEventListener(
          "click",
          (clickEvent) => (contextMenu.style.display = "none"),
          { once: true, capture: true }
        );
      },
    },
    //
    //            _____  _____ ____  _____ _____   ______   ____   ________   _________      _______ _________      __      _______      ______ ____  ____
    //           |_   _||_   _|_   \|_   _|_   _|./ ___  |.'    \.|_   ___ \.|_   ___  |    /  ___  |_   ___  |    /  \    |_   __ \   ./ ___  |_   ||   _|
    //             | |    | |   |   \ | |   | | / ./   \_|  .--.  \ | |   \. \ | |_  \_|   |  (__ \_| | |_  \_|   / /\ \     | |__) | / ./   \_| | |__| |
    //             | '    ' |   | |\ \| |   | | | |      | |    | | | |    | | |  _|  _     '.___\-.  |  _|  _   / ____ \    |  __ /  | |        |  __  |
    //              \ \--' /   _| |_\   |_ _| |_\ \.___.'\  \--'  /_| |___.' /_| |___/ |   |\\____) |_| |___/ |_/ /    \ \_ _| |  \ \_\ \.___.'\_| |  | |_
    //               \.__.'   |_____|\____|_____|\._____.'\.____.'|________.'|_________|   |_______.'_________|____|  |____|____| |___|\._____.'____||____|
    unicode: {
      unicodeData: null,
      unicodeElements: null,
      segmenter: null,
      recipeModalObserver: null,
      itemScopedDataAttribute: null,
      searchDiscoveries: false,

      nealSortFunctions: {
        time: function (a, b) {
          return a.id - b.id;
        },
        // modified for unicode
        name: function (a, b) {
          return (
            a.text.codePointAt(0) - b.text.codePointAt(0) ||
            a.text.localeCompare(b.text)
          );
        },
        // fixed
        emoji: function (a, b) {
          return (a?.emoji ?? "").localeCompare(b?.emoji ?? "");
        },
        new: function (a, b) {
          return b.id - a.id;
        },
        length: function (a, b) {
          return a.text.length - b.text.length;
        },
        random: function () {
          return Math.random() - 0.5;
        },
      },
      categoryMap: {
        Cc: "Other, Control",
        Cf: "Other, Format",
        Cn: "Other, Not Assigned", // (no characters in the file have this property)
        Co: "Other, Private Use",
        Cs: "Other, Surrogate",
        LC: "Letter, Cased",
        Ll: "Letter, Lowercase",
        Lm: "Letter, Modifier",
        Lo: "Letter, Other",
        Lt: "Letter, Titlecase",
        Lu: "Letter, Uppercase",
        Mc: "Mark, Spacing Combining",
        Me: "Mark, Enclosing",
        Mn: "Mark, Nonspacing",
        Nd: "Number, Decimal Digit",
        Nl: "Number, Letter",
        No: "Number, Other",
        Pc: "Punctuation, Connector",
        Pd: "Punctuation, Dash",
        Pe: "Punctuation, Close",
        Pf: "Punctuation, Final quote", // (may behave like Ps or Pe depending on usage)
        Pi: "Punctuation, Initial quote", // (may behave like Ps or Pe depending on usage)
        Po: "Punctuation, Other",
        Ps: "Punctuation, Open",
        Sc: "Symbol, Currency",
        Sk: "Symbol, Modifier",
        Sm: "Symbol, Math",
        So: "Symbol, Other",
        Zl: "Separator, Line",
        Zp: "Separator, Paragraph",
        Zs: "Separator, Space",
      },

      init: function () {
        if (typeof Intl === "object" && Intl.Segmenter) {
          this.segmenter = new Intl.Segmenter(undefined, {
            granularity: "grapheme",
          });
        }

        if (settings.unicode.infoInRecipeModal) this.startRecipeModalObserver();

        if (settings.unicode.searchEnabled) this.enableSearch();

        document
          .querySelector(".sort-direction")
          .addEventListener("click", () => {
            this.unicodeElements.reverse();
            this.performSearch();
          });

        document
          .querySelector(".sidebar-discoveries")
          .addEventListener("click", () => {
            this.searchDiscoveries = !this.searchDiscoveries;
            this.performSearch();
          });

        document
          .querySelector(".sidebar-input")
          .addEventListener("input", this.updateSearch.bind(this));

        const modsUnicode = this;
        const v_sidebar = document.querySelector("#sidebar").__vue__;
        const changeSort = v_sidebar.changeSort;
        v_sidebar.changeSort = function (...args) {
          setTimeout(() => {
            modsUnicode.updateUnicodeElementsSort();
            modsUnicode.performSearch();
          }, 0);
          return changeSort(...args);
        };

        const v_container = document.querySelector(".container").__vue__;
        const craftApi = v_container.craftApi;
        v_container.craftApi = async function (...args) {
          const response = await craftApi(...args);

          if (
            response &&
            modsUnicode.unicodeElements &&
            modsUnicode.isUnicode(response.text) &&
            !modsUnicode.unicodeElements.find(
              ({ text }) => text === response.text
            )
          ) {
            modsUnicode.unicodeElements.push(response);
            modsUnicode.updateUnicodeElementsSort();
            modsUnicode.performSearch();
          }

          return response;
        };
      },

      enableCheckbox: function () {
        this.updateUnicodeElements();
      },

      disableCheckbox: function () {
        (
          document.querySelector(
            ".sandwhich-unicode-items-inner"
          ) as HTMLDivElement
        ).innerHTML = "";
        (
          document.querySelector(
            ".sandwhich-unicode-header-label"
          ) as HTMLLabelElement
        ).textContent = `Unicode Search`;
        this.unicodeElements = null;
      },

      enableSearch: function () {
        const unicodeContainer = document.createElement("div");
        unicodeContainer.className = "sandwhich-unicode-items";
        const itemContainer = document.createElement("div");
        itemContainer.className = "sandwhich-unicode-items-inner";

        const header = document.createElement("div");
        header.className = "sandwhich-unicode-header";

        const checkbox = document.createElement("input");
        checkbox.className = "sandwhich-unicode-checkbox";
        checkbox.type = "checkbox";
        checkbox.checked = settings.unicode.searchCheckbox;

        checkbox.addEventListener("change", (e) => {
          settings.unicode.searchCheckbox = (
            e.target as HTMLInputElement
          ).checked;
          if ((e.target as HTMLInputElement).checked) {
            this.enableCheckbox();
          } else {
            this.disableCheckbox();
          }
        });

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = "Unicode Search";
        label.className = "sandwhich-unicode-header-label";

        header.appendChild(checkbox);
        header.appendChild(label);

        unicodeContainer.appendChild(header);
        unicodeContainer.appendChild(itemContainer);

        document.querySelector(".items").before(unicodeContainer);

        this.fetchUnicodeData();
        if (unsafeWindow.IC) this.enableCheckbox();
        else {
          const modsUnicode = this;
          const v_container = document.querySelector(".container").__vue__;
          const addAPI = v_container.addAPI;
          v_container.addAPI = function () {
            // elements loaded!!!
            setTimeout(() => {
              if (
                settings.unicode.searchEnabled &&
                settings.unicode.searchCheckbox
              )
                modsUnicode.enableCheckbox();
            }, 0);

            v_container.addAPI = addAPI;
            return addAPI.apply(this, arguments);
          };
        }
        settings.unicode.searchEnabled = true;
      },

      disableSearch: function () {
        (
          document.querySelector(".sandwhich-unicode-items") as HTMLDivElement
        ).remove();

        settings.unicode.searchEnabled = false;
      },

      startRecipeModalObserver: function () {
        if (this.recipeModalObserver) return;

        const modalElement = document.querySelector<HTMLDialogElement>(
          "dialog.recipe-modal"
        );
        if (!modalElement) {
          console.error(
            "Helper not installed, can't add a subtitle to the recipe modal..."
          );
          return;
        }
        const header = document.querySelector(".recipe-modal-header");

        const subtitleElement = document.createElement("a");
        subtitleElement.className = "recipe-modal-subtitle";
        subtitleElement.addEventListener("click", () => {
          if (
            subtitleElement.classList.contains(
              "sandwhich-unicode-info-expanded"
            )
          ) {
            return;
          }

          const itemText = modalElement
            .querySelector(".recipe-modal-title")
            ?.childNodes[1]?.textContent.trim();
          subtitleElement.innerHTML = Array.from(itemText)
            .map((char) => {
              const codepoint = char
                .codePointAt(0)!
                .toString(16)
                .toUpperCase()
                .padStart(4, "0");
              const unicodeName =
                this.unicodeData[codepoint]?.[0] ?? "no name found...";
              const unicodeCategory =
                this.categoryMap[this.unicodeData[codepoint]?.[1]] ??
                "no category found...";
              return `${char}${
                unicodeCategory === "Mark, Nonspacing" ? " " : ""
              } - U+${codepoint} - ${unicodeName} - ${unicodeCategory}`;
            })
            .join("<br>");
          subtitleElement.classList.add("sandwhich-unicode-info-expanded");
        });
        header.appendChild(subtitleElement);

        this.rightClickUpListener = function (e) {
          if (e.button === 2) {
            subtitleElement.textContent = "Show Unicode Info";
            subtitleElement.classList.remove("sandwhich-unicode-info-expanded");
          }
        };

        document.addEventListener("mouseup", this.rightClickUpListener);
        this.fetchUnicodeData();
      },

      stopRecipeModalObserver: function () {
        document.querySelector(".recipe-modal-subtitle").remove();
        document.removeEventListener("mouseup", this.rightClickUpListener!);
      },

      fetchUnicodeData: function () {
        if (this.unicodeData) return;

        GM.xmlHttpRequest({
          method: "GET",
          url: "https://unicode.org/Public/UNIDATA/UnicodeData.txt",
          onload: (response) => {
            if (response.status === 200)
              this.unicodeData = this.parseUnicodeData(response.responseText);
            else
              console.error(
                "Failed to load Unicode data:",
                response.status,
                response.statusText
              );
          },
          onerror: (error) => {
            console.error("Error fetching Unicode data:", error);
          },
        });
      },

      parseUnicodeData: function (unicodeText) {
        return unicodeText
          .trim()
          .split("\n")
          .reduce<{ [key: string]: [string, string] }>((acc, line) => {
            const [codePoint, name, category] = line.split(";", 3) as [
              string,
              string,
              string
            ];
            acc[codePoint] = [name, category];
            return acc;
          }, {});
      },

      isUnicode: function (text) {
        if (!settings.unicode.searchMultiCharacter || !this.segmenter) {
          const utf16Length = text.length;

          // guaranteed to be one code point
          return (
            utf16Length === 1 ||
            // If UTF-16 length is 2, check if it's a surrogate pair (one code point)
            (utf16Length === 2 && Array.from(text).length === 1)
          );
          // If length > 2, it cannot be a single code point
        }
        // [ -~] any ascii character -> if it has 2 or more ascii character its not going to appear 1 long.
        else
          return (
            !/[ -~].*[ -~]/.test(text) &&
            Array.from(this.segmenter.segment(text)).length === 1
          );
      },

      updateUnicodeElements: function () {
        if (!settings.unicode.searchCheckbox) return;

        console.time("updateUnicodeElements");
        this.unicodeElements = unsafeWindow.IC.getItems().filter(({ text }) =>
          this.isUnicode(text)
        );
        this.updateUnicodeElementsSort();
        this.performSearch();
        console.timeEnd("updateUnicodeElements");
      },

      updateUnicodeElementsSort: function () {
        if (!settings.unicode.searchCheckbox) return;

        const v_sidebar = document.querySelector("#sidebar").__vue__;
        const sortBy = v_sidebar.sortBy?.name;
        const sortFunction = this.nealSortFunctions[sortBy];
        if (sortFunction) {
          this.unicodeElements = this.unicodeElements.sort(sortFunction);
        } else {
          console.log("could not find sortFunction", sortBy);
        }
      },

      findItemScopedDataAttribute: function () {
        if (!this.itemScopedDataAttribute) {
          const sampleItem = document.querySelector(".item");
          if (!sampleItem) {
            console.warn(
              "SandwichMod: No '.item' element found to determine scoped attribute."
            );
          }

          for (const attr of sampleItem.attributes) {
            if (attr.name.startsWith("data-v-")) {
              this.itemScopedDataAttribute = attr.name;
              break;
            }
          }
        }
        return this.itemScopedDataAttribute;
      },

      createItemElement: function (item, wrap = false) {
        const itemDiv = document.createElement("div");
        itemDiv.setAttribute(this.findItemScopedDataAttribute(), "");
        itemDiv.setAttribute("data-item-emoji", item.emoji);
        itemDiv.setAttribute("data-item-text", item.text);
        itemDiv.setAttribute("data-item-id", item.id);
        itemDiv.setAttribute("data-item", "");
        itemDiv.classList.add("item");
        if (item.discovery) {
          itemDiv.setAttribute("data-item-discovery", "");
          itemDiv.classList.add("item-discovery");
        }

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
      },

      updateSearch: function () {
        window.clearTimeout(this.updateSearchTimeoutId);

        const modsUnicode = this;
        this.updateSearchTimeoutId = window.setTimeout(
          () => modsUnicode.performSearch(),
          settings.unicode.searchDebounceDelay
        );
      },

      performSearch: function (amount = settings.unicode.searchAmount) {
        if (!settings.unicode.searchCheckbox) return;

        const searchQuery =
          document.querySelector("#sidebar").__vue__.searchQuery;
        const upperSearchQuery = searchQuery.toUpperCase();
        const itemsContainer = document.querySelector(
          ".sandwhich-unicode-items-inner"
        ) as HTMLDivElement;
        itemsContainer.innerHTML = "";

        const fragment = document.createDocumentFragment();
        let added = 0;

        for (const element of this.unicodeElements) {
          let isMatch = false;

          if (this.searchDiscoveries && !element.discovery) continue;

          const elementText = element.text;
          if (elementText.toUpperCase().includes(upperSearchQuery))
            isMatch = true;
          else {
            const codepoint = elementText
              .codePointAt(0)!
              .toString(16)
              .toUpperCase()
              .padStart(4, "0");
            if (codepoint.includes(upperSearchQuery)) {
              isMatch = true;
            } else {
              const unicodeEntry = this.unicodeData[codepoint] ?? []; // [name, category]
              if (
                unicodeEntry[0]?.includes(upperSearchQuery) ||
                this.categoryMap[unicodeEntry[1]]
                  ?.toUpperCase()
                  ?.includes(upperSearchQuery)
              ) {
                isMatch = true;
              }
            }
          }

          if (isMatch && added++ < amount) {
            fragment.appendChild(
              this.createItemElement(element, !settings.unicode.searchCompact)
            );
          }
        }

        itemsContainer.appendChild(fragment);
        (
          document.querySelector(
            ".sandwhich-unicode-header-label"
          ) as HTMLDivElement
        ).textContent = `Unicode Search - ${added}`;

        if (added > amount) {
          const showAll = document.createElement("a");
          showAll.className = "sandwhich-unicode-showall";
          showAll.textContent = "Show All";
          showAll.addEventListener("click", () => this.performSearch(Infinity));
          itemsContainer.appendChild(showAll);
        }
      },
    },
  };

  // expose everything to window
  unsafeWindow.sandwhichModStuff = mods;

  // --- Init Mods ---
  unsafeWindow.addEventListener("load", () => {
    for (const [name, mod] of Object.entries(mods)) {
      mod.init();
    }
  });

  type SettingEntryInput =
    | {
        label: string;
        description?: string;
        type: "colorPicker";
        content: () => string;
        handle: (elements: HTMLInputElement) => unknown;
      }
    | {
        label: string;
        description?: string;
        type: "dropdown";
        options: string[];
        content: () => string;
        handle: (elements: string) => unknown;
      }
    | {
        label: string;
        description?: string;
        type: "number";
        content: () => number;
        handle: (elements: HTMLInputElement) => unknown;
      }
    | {
        label: string;
        description?: string;
        type: "toggle";
        content: () => boolean;
        handle: (elements: HTMLInputElement) => unknown;
      };

  type SettingEntry =
    | {
        name: string;
        description: string;
        toggle: true;
        toggleState: () => boolean;
        toggleHandle: (elements: HTMLInputElement) => void;
        inputs: SettingEntryInput[];
      }
    | {
        name: string;
        description: string;
        toggle?: false;
        inputs: SettingEntryInput[];
      };

  const settingsEntries: SettingEntry[] = [
    {
      name: "Selection Utils",
      description: "Style the Selection Box!",
      toggle: true,
      toggleState: () => settings.selection.enabled,
      toggleHandle: (elements) =>
        elements.checked ? mods.selection.enable() : mods.selection.disable(),
      inputs: [
        {
          label: "Color: ",
          type: "colorPicker",
          content: () => settings.selection.customColor,
          handle(elements) {
            settings.selection.customColor = elements.value;
            mods.selection.update();
          },
        },
        {
          label: "Border Style: ",
          type: "dropdown",
          options: [
            "solid",
            "dashed",
            "dotted",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset",
          ],
          content: () => settings.selection.borderStyle,
          handle(value) {
            settings.selection.borderStyle = value;
            mods.selection.update();
          },
        },
        {
          label: "Border Width: ",
          type: "number",
          content: () => settings.selection.borderWidth,
          handle(elements) {
            settings.selection.borderWidth = Math.min(elements.value, 30);
            mods.selection.update();
          },
        },
        {
          label: "Chroma Speed: ",
          type: "number",
          content: () => settings.selection.chromaSpeed,
          handle(elements) {
            settings.selection.chromaSpeed = Number(elements.value);
            mods.selection.update();
          },
        },
        {
          label: "Scale: ",
          type: "number",
          content: () => settings.selection.scale,
          handle(elements) {
            settings.selection.scale = Number(elements.value);
            mods.selection.update();
          },
        },
      ],
    },
    {
      name: "Tab Utils",
      description:
        "Saves all elements on screen into one Tab.\nTabs save on reloading/reopening Infinite Craft!",
      toggle: true,
      toggleState: () => settings.tabs.enabled,
      toggleHandle: (elements) =>
        elements.checked ? mods.tabs.enable() : mods.tabs.disable(),
      inputs: [
        {
          label: "Color: ",
          type: "colorPicker",
          content: () => settings.tabs.customColor,
          handle(elements) {
            settings.tabs.customColor = elements.value;
            mods.tabs.updateColors();
          },
        },
      ],
    },
    {
      name: "Spawn Utils",
      description: "A bunch of helpful element spawning things!",
      inputs: [
        {
          label: "Copy Element(s) - Ctrl + C: ",
          description:
            "copies the element you are hovering over (works with selections)",
          type: "toggle",
          content: () => settings.spawn.copy,
          handle(elements) {
            settings.spawn.copy = elements.checked;
          },
        },
        {
          label: "Paste Element(s)/Lineages - Ctrl + Shift + V: ",
          type: "toggle",
          content: () => settings.spawn.paste,
          handle(elements) {
            settings.spawn.paste = elements.checked;
          },
        },
        {
          label: "Spawn non-crafted Elements as Ghosts: ",
          description:
            "Ghost Elements can't be moved or combined.\nThey turn into real elements once they're crafted!",
          type: "toggle",
          content: () => settings.spawn.ghosts,
          handle(elements) {
            settings.spawn.ghosts = elements.checked;
          },
        },
        {
          label: "Spawn from Selected - Ctrl + B: ",
          description:
            "Spawns entire alphabets/unicode rows from the selected element.",
          type: "toggle",
          content: () => settings.spawn.fromSelected,
          handle(elements) {
            settings.spawn.fromSelected = elements.checked;
          },
        },
      ],
    },
    {
      name: "Unicode Search",
      description:
        "Enables searching in:\n- the Unicode Codepoint (e.g. U+0069)\n- the Unicode Name (e.g. LATIN CAPITAL LETTER A)",
      toggle: true,
      toggleState: () => settings.unicode.searchEnabled,
      toggleHandle: (elements) =>
        elements.checked
          ? mods.unicode.enableSearch()
          : mods.unicode.disableSearch(),
      inputs: [
        {
          label: "Search Elements Amount:",
          type: "number",
          content: () => settings.unicode.searchAmount,
          handle(elements) {
            settings.unicode.searchAmount = Number(elements.value);
            mods.unicode.performSearch();
          },
        },
        {
          label: "Search Debounce Delay (in ms):",
          type: "number",
          content: () => settings.unicode.searchDebounceDelay,
          handle(elements) {
            settings.unicode.searchDebounceDelay = Number(elements.value);
          },
        },
        {
          label: "Search Compact Mode:",
          type: "toggle",
          content: () => settings.unicode.searchCompact,
          handle(elements) {
            settings.unicode.searchCompact = elements.checked;
            mods.unicode.performSearch();
          },
        },
        {
          label: "Allow Multi-character Stuff:",
          type: "toggle",
          content: () => settings.unicode.searchMultiCharacter,
          handle(elements) {
            settings.unicode.searchMultiCharacter = elements.checked;
            mods.unicode.updateUnicodeElements();
          },
        },
      ],
    },
    {
      name: "Unicode Utils",
      description: "",
      inputs: [
        {
          label: "Show Unicode Info in Recipe Menu:",
          description:
            "e.g. U+0069 - LATIN SMALL LETTER I\nRequires the Helper Script",
          type: "toggle",
          content: () => settings.unicode.infoInRecipeModal,
          handle(elements) {
            settings.unicode.infoInRecipeModal = elements.checked;
            elements.checked
              ? mods.unicode.startRecipeModalObserver()
              : mods.unicode.stopRecipeModalObserver();
          },
        },
      ],
    },
  ];

  function addSandwhichButtonToModal(modal: HTMLDialogElement) {
    if (modal.querySelector(".sandwhich-settings-trigger-button")) return; // Prevent duplicates

    const button = document.createElement("div");
    button.textContent = "🥪 Sandwhich Settings";
    button.className = "sandwhich-settings-trigger-button";

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      // console.log("SandwhichMod: Sandwhich Settings button clicked inside modal.");

      modal.innerHTML = "";
      modal.classList.add("sandwhich-settings"); // Use class to toggle CSS
      renderSettingsUI(modal);
    });

    modal.appendChild(button);
    // console.log("SandwhichMod: Added settings trigger button to modal.");
  }

  // --- Observe for Modal Appearance (Define Observer - keep the existing one) ---
  const modalObserver = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node *is* the modal or *contains* the modal
          if (node.nodeType === Node.ELEMENT_NODE) {
            // The modal itself might be added, or it might be inside another added container
            const modal = (node as HTMLElement).matches(".modal")
              ? node
              : (node as HTMLElement).querySelector(".modal");
            if (modal) {
              addSandwhichButtonToModal(modal as HTMLDialogElement);
            }
          }
        });
      }
    }
  });
  modalObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // --- Settings UI Rendering ---
  function renderSettingsUI(container: HTMLDialogElement) {
    container.innerHTML = ""; // Clear previous content
    container.classList.add("sandwhich-settings-container"); // Add a class for styling

    // Add a title
    const title = document.createElement("h2");
    title.textContent = "🥪 Sandwhich Utils Mod Settings";
    title.style.textAlign = "center";
    title.style.marginTop = "0";
    title.style.marginBottom = "20px"; // Add some space below title
    container.appendChild(title);

    settingsEntries.forEach((entry) => {
      const section = document.createElement("div");
      section.className = "sandwhich-setting-section";

      const header = document.createElement("div");
      header.className = "sandwhich-setting-header";

      const name = document.createElement("h3");
      name.textContent = entry.name;
      header.appendChild(name);

      let inputsContainer: HTMLDivElement = null;

      // Main toggle for the section (if applicable)
      if (entry.toggle) {
        const toggleLabel = document.createElement("label");
        toggleLabel.className = "sandwhich-toggle-switch";
        const toggleInput = document.createElement("input");
        toggleInput.type = "checkbox";
        toggleInput.checked = entry.toggleState();
        toggleInput.addEventListener("change", (e) => {
          entry.toggleHandle(e.target as HTMLInputElement); // Pass the checkbox element
          if (inputsContainer) {
            // Check if inputs container exists
            if ((e.target as HTMLInputElement).checked)
              inputsContainer.classList.remove("sandwhich-inputs-collapsed");
            else inputsContainer.classList.add("sandwhich-inputs-collapsed");
          }
        });
        const slider = document.createElement("span");
        slider.className = "sandwhich-slider";

        toggleLabel.appendChild(toggleInput);
        toggleLabel.appendChild(slider);
        header.appendChild(toggleLabel);
      }

      section.appendChild(header);

      if (entry.description) {
        const description = document.createElement("p");
        description.className = "sandwhich-setting-description";
        description.innerHTML = entry.description.replace(/\n/g, "<br>"); // Preserve line breaks
        section.appendChild(description);
      }

      // Inputs for the section
      if (entry.inputs && entry.inputs.length > 0) {
        inputsContainer = document.createElement("div");
        inputsContainer.className = "sandwhich-inputs-container";

        entry.inputs.forEach((inputDef) => {
          const inputRow = document.createElement("div");
          inputRow.className = "sandwhich-input-row";

          const label = document.createElement("label");
          label.textContent = inputDef.label || "";
          inputRow.appendChild(label);

          let inputElement: HTMLInputElement | HTMLSelectElement;

          switch (inputDef.type) {
            case "toggle":
              const toggleLabel = document.createElement("label");
              toggleLabel.className = "sandwhich-toggle-switch small"; // smaller toggle
              inputElement = document.createElement("input");
              inputElement.type = "checkbox";
              inputElement.checked = inputDef.content(); // Get initial state
              inputElement.addEventListener("change", (e) => {
                // Assume handle modifies the proxied 'settings' object
                inputDef.handle(e.target as HTMLInputElement);
              });
              const slider = document.createElement("span");
              slider.className = "sandwhich-slider";
              toggleLabel.appendChild(inputElement);
              toggleLabel.appendChild(slider);
              inputRow.appendChild(toggleLabel); // Add the whole switch not just the input
              break; // Break here, inputElement is handled inside the label

            case "colorPicker":
              inputElement = document.createElement("input");
              inputElement.type = "color";
              inputElement.value = inputDef.content(); // Get initial color
              inputElement.addEventListener("input", (e) => {
                // Assume handle modifies the proxied 'settings' object
                inputDef.handle(e.target as HTMLInputElement); // Pass the input element
              });
              inputRow.appendChild(inputElement);
              break;

            case "dropdown":
              inputElement = document.createElement("select");
              const currentValue = inputDef.content();
              inputDef.options.forEach((optionValue) => {
                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionValue;
                if (optionValue === currentValue) {
                  option.selected = true;
                }
                inputElement.appendChild(option);
              });
              inputElement.addEventListener("change", (e) => {
                // Assume handle modifies the proxied 'settings' object
                inputDef.handle((e.target as HTMLSelectElement).value); // Pass the selected value
              });
              inputRow.appendChild(inputElement);
              break;

            case "number":
              inputElement = document.createElement("input");
              inputElement.type = "number";
              inputElement.value = inputDef.content(); // Get initial number
              inputElement.addEventListener("input", (e) => {
                // Assume handle modifies the proxied 'settings' object
                inputDef.handle(e.target as HTMLInputElement); // Pass the input element
              });
              inputRow.appendChild(inputElement);
              break;

            default:
              console.warn(
                `SandwhichMod: Unknown input type "${inputDef.type}"`
              );
              const span = document.createElement("span");
              span.textContent = ` [Unsupported type: ${inputDef.type}]`;
              inputRow.appendChild(span);
          }

          // Add description for the specific input if present
          if (inputDef.description) {
            const inputDesc = document.createElement("p");
            inputDesc.className = "sandwhich-input-description";
            inputDesc.innerHTML = inputDef.description.replace(/\n/g, "<br>");
            inputRow.appendChild(inputDesc); // Append description within the row
          }

          inputsContainer.appendChild(inputRow);
        });
        section.appendChild(inputsContainer);
      }

      container.appendChild(section);
    });
  }

  addCss();
})();
