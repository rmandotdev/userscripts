(function () {
  "use strict";

  interface ICWindow extends Window {
    convert(input: string): string;
    elementStorageSet: Set<string>;
    revivingProgress(): Promise<void>;
    emojiMap: Map<string, IC_Container_VUE_CraftApiResponse>;
    revive(input: string): Promise<void>;
  }

  const icWindow = (unsafeWindow || window) as ICWindow; // change this to window if you are on mobile i guess

  // Settings

  const inverseMethods = false;

  const spacingChars = new Set([" ", "-"]); // the bot splits the line into chunks so its easier to revive: "A Cat Loves-Food" -> "A", "Cat", "Loves", "Food"
  const parallelBots = 26; // more bots = less combining downtime, also means less understanding of what da hell is going on
  const combineTime = 400; // 400ms
  const logMessages = true; // wether it logs what its doing

  const __VUE__ = icWindow.document.querySelector(".infinite-craft").__vue__;

  function splice(str: string, start: number, newSubStr: string, delCount = 0) {
    return (
      str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount))
    );
  }

  icWindow.convert = function (input: string) {
    return input
      .replaceAll("No\t", "No\n")
      .replaceAll("Yes\t", "Yes\n")
      .split("\n")
      .map((x) => x.split("\t"))
      .filter((x) => x[1] === "No")
      .map((x) => x[0])
      .join("\n");
  };

  async function sendMessage(webhookUrl: string, message: string) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: JSON.stringify({
          content: message,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        return true;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // (["Delete", "Remove"], ["The", null], ["Mr."]) -> ["Delete The Mr.", "Delete Mr.", "Remove The Mr.", "Remove Mr." ]
  function generateToolCombinations(...arrays: (string | null)[][]) {
    // Helper to recursively combine arrays
    const recursion = (i: number, prefix: string): string[] => {
      if (i === arrays.length) return [prefix.trim()]; // Base case: return the final string
      return arrays[i]!.flatMap((option) =>
        recursion(i + 1, option ? `${prefix} ${option}` : prefix)
      );
    };
    return recursion(0, ""); // Start combining from the first group
  }

  const spellTools = {
    word: (x: string) => (x !== "" ? [`${x}`, `"${x}"`, `'${x}'`] : []),

    letter2: (x: string) =>
      x !== ""
        ? [
            `${x}`,
            `"${x}"`,
            `'${x}'`,
            `String.append('${x}')`,
            `String.append('${x}');`,
            `String.append("${x}")`,
            `String.append("${x}");`,
            `Append '${x}'`,
            `Append "${x}"`,
            `Append('${x}')`,
            `Append("${x}")`,
            `-${x}`,
            `‘${x}’`,
            `.${x}`,
            `Seq.append('${x}')`,
            `String.append(\`${x}\`)`,
            `Append ${x}`,
            `String.append(${x})`,
            `Mr. String.append('${x}')`,
            `Mr. String.append('${x}');`,
            `Mr. String.append("${x}")`,
            `Mr. String.append("${x}");`,
            `Append ${x}`,
            `-${x}`,
            `.${x}`,
            `String.format('${x}')`,
            `String.format('${x}');`,
            `String.format("${x}")`,
            `String.format("${x}");`,
            `Mr. String.format('${x}')`,
            `Mr. String.format('${x}');`,
            `Mr. String.format("${x}")`,
            `Mr. String.format("${x}");`,
          ]
        : [],

    letter1: (x: string) =>
      x !== ""
        ? [
            ...spellTools.letter2(x), // Everything from 2 letter stuff should also work for 1 letter stuff
            `U+${x.toLowerCase().charCodeAt(0).toString(16).padStart(4, "0")}`,
            `Append U+${x
              .toLowerCase()
              .charCodeAt(0)
              .toString(16)
              .padStart(4, "0")}`,
            `U+${x.toUpperCase().charCodeAt(0).toString(16).padStart(4, "0")}`,
            `Append U+${x
              .toUpperCase()
              .charCodeAt(0)
              .toString(16)
              .padStart(4, "0")}`,
            `The '${x}'`,
            `Mr. '${x}'`,
          ]
        : [],
  };

  const tools = {
    removeMr: [
      ...generateToolCombinations(
        ["Remove", "Removes", "Subtract", "Delete", "Without"],
        [null, "The"],
        ["Mr.", "Mr", "Mister"]
      ),
      // -> [ "Delete The Mr.", "Delete The Mr", "Delete The Mister", "Delete Mr.", "Delete Mr", "Delete Mister", "Remove The Mr.", "Remove The Mr", "Remove The Mister", "Remove Mr.", … ]
      '"remove Mr."',
      '"remove The Mr."',
      '"removes Mr."',
      '"removes The Mr."',
      "Remove Mr. Without Correction",
    ],
    removeAbcd: [
      ...generateToolCombinations(
        ["Delete", "Remove", "Without"],
        ["The", null],
        ["Abcd", "Abcd.", "'abcd'"]
      ),
      '"remove Abcd"',
      "Mr. Delete The Abcd",
    ],
    removeHi: [
      ...generateToolCombinations(
        ["Delete", "Remove", "Without", "Deletes"],
        [null, "The"],
        [null, "Word"],
        ["Hi", "'hi'"]
      ),
      '"remove The Hi"',
      '"delete The Hi"',
      '"remove Hi"',
      'Remove The "hi"',
      "Delete The “hi”",
      "Delete First Word",
      "Remove First Word",
    ],
    removeHiMr: [
      ...generateToolCombinations(
        ["Delete", "Remove"],
        ["The", null],
        ["Hi Mr.", "Hi Mr", "Hi Mrs."]
      ),
      '"delete The Hi Mr. "',
    ],
    removeThe: [
      ...generateToolCombinations(
        ["Remove", "Delete", "Without"],
        ["The The", "The", "The The The"]
      ),
      "Delete First Word",
      "Remove First Word",
      '"remove The The"',
      '"delete The The"',
      "Delete The With Spacing",
    ],
    removeQuote: [
      ...generateToolCombinations(
        ["Delete", "Remove", "Without"],
        ["The", null],
        ["Quotation Mark", "Quotation Marks"]
      ),
    ],
    removeHyphens: [
      ...generateToolCombinations(
        ["Delete", "Remove", "Without"],
        ["The", null],
        ["Hyphen", "Hyphens"]
      ),
      ...generateToolCombinations(
        ["Replace Hyphen With"],
        ["Empty", "Spaces", "Spacing", "Nothing"]
      ),
      "With Spacing",
      "With Spaces",
      "Subtract The Hyphen",
    ],
    removeFirstCharacter: [
      ...generateToolCombinations(
        ["Delete", "Remove", "Without"],
        [null, "The"],
        ["First"],
        ["Character", "Letter", "Characters", "Letters", "Deleter"]
      ),
    ],
    removeChar: (char: string) => [
      ...generateToolCombinations(
        ["Delete", "Remove", "Without"],
        ["The", null],
        [null, "Letter", "Character"],
        [char, `"${char}"`, `'${char}'`]
      ),
      `String.remove(${char})`,
      `String.remove("${char}")`,
      `String.remove('${char}')`,
      `Seq.remove(${char})`,
      `Seq.remove("${char}")`,
      `Seq.remove('${char}')`,
    ],
    removeHashtag: [
      "Unplural",
      "Unpluralize",
      "Delete The Hyphen",
      "Remove The Hyphen",
      "Delete The Hashtag",
      "Remove The Hashtag",
      "Capitalize",
    ],
    prependHashtag: [
      "Prepend Hashtag :3",
      "Pweaseprependhashtag",
      "Prepend Hashtag <3",
      "Prepend Hashtag :)",
      "Prepend Hashtag",
      "Pweaseprependhashtagorelse",
      "#pweaseprependhashtag",
      "Prepend Hashtag :) :<3",
      "Write A Hashtag In Front",
      "Hashtag The Hashtag",
      "Put This In Hashtag",
    ],
    prependMr: [
      ...generateToolCombinations(
        ["Prepend", "Prepends"],
        ["The", null],
        ["Mr", "Mr."]
      ),
      "Mr. &",
      "Mr. .",
      "Mr. _",
      "Mr. '",
      "Mr.mr.",
    ],
    prependAt: [
      "@convert.to.twitter.handle",
      "@word",
      "String.prepend('@')",
      'String.prepend("@")',
      "String.prepend('@');",
      'String.prepend("@");',
      "@element",
      "@water",
      "@fire",
      "@earth",
      "@wind",
    ],
    customAppendCharacterTools: {
      " ": [
        "Append Space",
        "U+0020",
        "Append U+0020",
        "Append The Space",
        "Append The U+0020",
        "U++0020",
        "Prepend Space",
        "Prepend U+0020",
      ],
      "-": ["Append Hyphen", "Append-hyphen", "Add Hyphen", "Insert Dash"],
    } as { [key: string]: string[] },
    customAppendCharacter(char: string) {
      // Return tools for the specific character or an empty array if not found
      return (
        (this.customAppendCharacterTools[char] as string[] | undefined) || []
      );
    },
    quirkyQuote: (quote: string) => [
      quote,
      splice(quote, -1, " "),
      splice(quote, -1, "quotation Mark"),
      splice(quote, -1, "quotation Marks"),
      splice(quote, -1, "put This In Quotation Marks"),
      splice(quote, -1, "put Them In Quotation Marks"),
      splice(quote, -1, "prepend Quotation Mark"),
      splice(quote, -1, "prepend Quotation Marks"),
      splice(quote, -1, "prepend Quote"),
      splice(quote, -1, "prepend Quotation"),
      splice(quote, -1, "[/inst]"),
      splice(quote, -1, "[/st]"),
      splice(quote, -1, "[/nst]"),
      ..."abcdefghijklmnopqrstuvwxyz!\"#$%&'()*+,-./0123456789"
        .split("")
        .flatMap((x) => splice(quote, -1, x)),
      `Append(${quote})`,
    ],
    addParentheses: (parent: string) => [
      parent,
      splice(parent, -1, "prepend Left Parenthesis"),
      splice(parent, -1, "prepend Left Parentheses"),
      splice(parent, -1, "prepend Opening Parenthesis"),
      splice(parent, -1, "prepend Opening Parentheses"),
      ...generateToolCombinations(
        ["Prepend"],
        ["Left", "Opening", null],
        ["Parenthesis", "Parentheses", "Bracket", "Braces"]
      ),
      "Prepend " + splice(parent, -1, "parenthesis"),
      "Prepend " + splice(parent, -1, "parentheses"),
      "Append " + splice(parent, -1, "parenthesis"),
      "Append " + splice(parent, -1, "parentheses"),
      splice(parent, -1, " "),
      splice(parent, -1, "parenthesis"),
      splice(parent, -1, "put This In Parenthesis"),
      splice(parent, -1, "put This In Parentheses"),
    ],
  };

  interface DeSpellTech {
    start: string;
    goal?: string;
    tools: string[];
  }

  interface SpellTech {
    trigger?: (elem: string) => boolean;
    tech: string;
    deSpell: (elem: string) => string[] | DeSpellTech[];
    modifyElement?: (elem: string) => string;
    stopAfter?: boolean;
    disabled: boolean;
  }

  // every single spellTech the bot uses is listed here.
  const spellTechs: SpellTech[] = [
    {
      // convertable quote stuff
      trigger: (elem) => elem.startsWith("“") && elem.endsWith("”"),
      tech: '""',
      deSpell: (line) => [...tools.quirkyQuote("“”")],
      modifyElement: (elem) => elem.slice(1, -1),
      stopAfter: true,
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("❝") && elem.endsWith("❞"),
      tech: '""',
      deSpell: (line) => [...tools.quirkyQuote("❝❞")],
      modifyElement: (elem) => elem.slice(1, -1),
      stopAfter: true,
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("‘") && elem.endsWith("’"),
      tech: '""',
      deSpell: (line) => [...tools.quirkyQuote("‘’")],
      modifyElement: (elem) => elem.slice(1, -1),
      stopAfter: true,
      disabled: false,
    },
    {
      // normal quote stuff
      trigger: (elem) => elem.startsWith('"') && elem.endsWith('"'),
      tech: '""',
      deSpell: (line) => [],
      modifyElement: (elem) => elem.slice(1, -1),
      stopAfter: true,
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("'") && elem.endsWith("'"),
      tech: "''",
      deSpell: (line) => [],
      modifyElement: (elem) => elem.slice(1, -1),
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("`") && elem.endsWith("`"),
      tech: "``",
      deSpell: (line) => [],
      modifyElement: (elem) => elem.slice(1, -1),
      disabled: false,
    },
    {
      // parentheses
      trigger: (elem) => elem.startsWith("(") && elem.endsWith(")"),
      tech: '""',
      deSpell: (line) => [...tools.addParentheses("()")],
      modifyElement: (elem) => elem.slice(1, -1),
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("[") && elem.endsWith("]"),
      tech: '""',
      deSpell: (line) => [...tools.addParentheses("[]")],
      modifyElement: (elem) => elem.slice(1, -1),
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("{") && elem.endsWith("}"),
      tech: '""',
      deSpell: (line) => [...tools.addParentheses("{}")],
      modifyElement: (elem) => elem.slice(1, -1),
      disabled: false,
    },

    {
      // #element
      trigger: (elem) => elem.startsWith("#"),
      tech: '""',
      deSpell: () => [...tools.prependHashtag],
      modifyElement: (elem) => elem.slice(1),
      disabled: false,
    },
    {
      // @element
      trigger: (elem) => elem.startsWith("@"),
      tech: '""',
      deSpell: (elem) => [
        ...tools.prependAt,
        "@" + elem.slice(0, 1),
        "@" + elem.slice(0, 2),
      ],
      modifyElement: (elem) => elem.slice(1),
      disabled: false,
    },

    {
      // Mr. Element
      trigger: (elem) => elem.startsWith("Mr. "),
      tech: '"hi Mr. "',
      deSpell: (elem) => [...tools.removeHi],
      modifyElement: (elem) => elem.slice(4),
      disabled: false,
    },
    {
      trigger: (elem) => elem.startsWith("Mr. "),
      tech: '""',
      deSpell: (elem) => [
        { start: `"${elem}"`, tools: [...tools.prependMr] },

        {
          start: `"${elem}"`,
          goal: `#${elem}`,
          tools: [...tools.prependHashtag],
        },
        { start: `#${elem}`, tools: [...tools.prependMr] },
      ],
      modifyElement: (elem) => elem.slice(4),
      disabled: false,
    },

    {
      tech: '"hi "',
      deSpell: (elem) => [...tools.removeHi],
      disabled: false,
    },
    {
      tech: '"hi Mr. "',
      deSpell: (elem) => [
        {
          start: `"hi Mr. ${elem}"`,
          tools: [...tools.removeMr, ...tools.removeHiMr],
        },

        {
          start: `"hi Mr. ${elem}"`,
          goal: `Mr. ${elem}`,
          tools: [...tools.removeHi],
        },

        { start: `Mr. ${elem}`, tools: [...tools.removeMr] },
      ],
      disabled: false,
    },
    {
      tech: '"abcd"',
      deSpell: (elem) => [
        { start: `"abcd${elem}"`, tools: [...tools.removeAbcd] },

        // too many steps... :(
        // { start: `"abcd${elem}"`, goal: `"bcd${elem}"`,
        //  tools: [...tools.removeFirstCharacter, ...tools.removeChar('a')] },
        // { start: `"bcd${elem}"`, goal: `"cd${elem}"`,
        //  tools: [...tools.removeFirstCharacter, ...tools.removeChar('b')] },
        // { start: `"cd${elem}"`, goal: `"d${elem}"`,
        //  tools: [...tools.removeFirstCharacter, ...tools.removeChar('c')] },
        // { start: `"d${elem}"`, goal: `"${elem}"`,
        //  tools: [...tools.removeFirstCharacter, ...tools.removeChar('d')] },
      ],
      disabled: false,
    },
    {
      tech: '"the "',
      deSpell: (elem) => [...tools.removeThe],
      disabled: true,
    },
    {
      tech: '"a"',
      deSpell: (elem) => [
        ...tools.removeChar("a"),
        ...tools.removeFirstCharacter,
      ],
      disabled: true,
    },
    {
      tech: '"b"',
      deSpell: (elem) => [
        ...tools.removeChar("b"),
        ...tools.removeFirstCharacter,
      ],
      disabled: true,
    },
    {
      tech: '"0"',
      deSpell: (elem) => [
        ...tools.removeChar("0"),
        ...tools.removeFirstCharacter,
      ],
      disabled: true,
    },
    {
      tech: '""',
      deSpell: (elem) => [
        {
          start: `"${elem}"`,
          tools: [
            ...tools.removeQuote,
            elem[0]!,
            elem.slice(0, 2)!,
            elem.slice(0, 3)!,
            elem.slice(0, 4)!,
            elem.split(" ")[0]!,
          ],
        },

        { start: `${elem}`, goal: `Mr. ${elem}`, tools: [...tools.prependMr] },

        {
          start: `"${elem}"`,
          goal: `#${elem}`,
          tools: [...tools.prependHashtag],
        },
        {
          start: `#${elem}`,
          tools: [
            ...tools.removeHashtag,
            elem[0]!,
            elem.slice(0, 2),
            elem.slice(0, 3),
            elem.slice(0, 4),
            elem.split(" ")[0]!,
          ],
        },
        { start: `#${elem}`, goal: `Mr. ${elem}`, tools: [...tools.prependMr] },

        { start: `Mr. ${elem}`, tools: [...tools.removeMr] },
      ],
      disabled: true,
    },
    {
      trigger: (elem) => elem.indexOf("-") === -1, // element doesn't have Hyphens
      tech: '""',
      deSpell: (elem) => [...tools.removeHyphens],
      modifyElement: (elem) => elem.replace(/ /g, "-"),
      disabled: true,
    },
  ];

  const recipesIng: Map<string, string> = new Map();
  const recipesRes: Map<string, [string, string][]> = new Map();
  // const aliveSet = new Set();   // elements from results or ingredients of recipes (not implementing because zombies mess this up sometimes :(( )
  const emojiMap: Map<string, IC_Container_VUE_CraftApiResponse> = new Map();
  const failedSpellingsMap: Map<string, string[]> = new Map();
  let elementStorageSet: Set<string> = new Set();

  const processedElementsList: string[] = [];

  async function reviveElements(elements: string[]) {
    // parallelizing stuff (very gamer)
    const queue = [...elements];
    let processedElements = 0;

    const interval = setInterval(() => {
      if (logMessages)
        console.log(
          `${processedElements}/${elements.length} elements processed (${
            Math.round((processedElements / elements.length) * 100 * 100) / 100
          }%)`
        );
    }, 30 * 1000); // 30 seconds

    async function worker() {
      while (queue.length > 0) {
        const elem = queue.shift()!;
        await reviveElement(elem);
        processedElements++;
        processedElementsList.push(elem);
      }
    }

    const workers = Array(parallelBots)
      .fill(null)
      .map(() => worker());
    await Promise.all(workers);
    clearInterval(interval);
  }

  async function reviveElement(element: string) {
    if (logMessages) console.log("Starting to revive element:", element);

    for (const spellTech of spellTechs) {
      const modifiedElement = spellTech.modifyElement
        ? spellTech.modifyElement(element)
        : element;

      // == Patched by GameRoMan ==

      if (
        spellTech.disabled !== inverseMethods ||
        (spellTech.trigger && !spellTech.trigger(nealCase(element))) ||
        modifiedElement.length + spellTech.tech.length > 30
      ) {
        continue;
      }

      // == Patched by GameRoMan ==

      await chunkRevive(spellTech, modifiedElement, element);
      await deSpell(spellTech, modifiedElement, element);

      if (finishedSpelling(element)) return;
      if (spellTech.stopAfter) {
        failedToSpell(element);
        return;
      }
    }
    failedToSpell(element);
  }

  async function chunkRevive(
    spellTech: SpellTech,
    element: string,
    realElement: string
  ) {
    const goal = splice(spellTech.tech, -1, element);
    let currentWordStart = 0;
    let currentWordEnd = 0;

    let lastExistingSpelling = spellTech.tech;

    for (let i = 0; i < element.length; i++) {
      const char = element[i]!; // Current character
      if (spacingChars.has(char) || i === 0) {
        currentWordStart = i + Number(i !== 0);
        currentWordEnd =
          i +
          1 +
          (element + " ")
            .slice(i + 1)
            .split("")
            .findIndex((x) => spacingChars.has(x));
      }

      const word = element.slice(currentWordStart, currentWordEnd); // current word
      const startWord = element.slice(currentWordStart, i); // already spelled part of the word
      const finishWord = element.slice(i, currentWordEnd); // Remaining part of the word
      const next2Chars = char + (element[i + 1] || "");
      const lastChar = element[i - 1] || "";
      const currentSpelling = splice(spellTech.tech, -1, element.slice(0, i));

      // console.log({spellTech: spellTech, element: element, realElement: realElement},
      //             {word: word, goal: goal, lastExistingSpelling: lastExistingSpelling, startWord: startWord, finishWord: finishWord, char: char, next2Chars: next2Chars, lastChar: lastChar, currentSpelling: currentSpelling})

      if (i === 0 || i < 2 || resultExists(currentSpelling)) {
        await tryCombine(
          [currentSpelling],
          [
            // only do the first 3 in each 'category'
            word, // spelling "catstone" and KIT already spelled "cat"
            ...(spacingChars.has(lastChar)
              ? spellTools.letter2(lastChar + char).slice(0, 3)
              : []),
            ...tools.customAppendCharacter(char).slice(0, 3), // "s"
            ...spellTools.letter2(next2Chars).slice(0, 3), // "st"
            ...spellTools.word(word).slice(1, 3), // "catstone"
            ...spellTools.word(element.slice(0, currentWordEnd)).slice(0, 3), // "i am catstone"
            ...spellTools.word(finishWord).slice(0, 3), // "stone"
            ...spellTools.letter1(char).slice(0, 3), // "s"
            ...spellTools.word(startWord + char).slice(0, 3), // "cats"
            ...spellTools.word(startWord + next2Chars).slice(0, 3), // "catst"
            ...spellTools.word(word.slice(0, -1)).slice(0, 3), // "catston"
            ...spellTools.word(finishWord.slice(0, -1)).slice(0, 3), // "ston"

            // Again, but this time do EVERYTHING
            ...(spacingChars.has(lastChar)
              ? spellTools.letter2(lastChar + char).slice(3)
              : []),
            ...tools.customAppendCharacter(char).slice(3), // "s"
            ...spellTools.letter2(next2Chars).slice(3), // "st"
            ...spellTools.word(word).slice(3), // "catstone"
            ...spellTools.word(element.slice(0, currentWordEnd)).slice(3), // "i am catstone"
            ...spellTools.word(finishWord).slice(3), // "stone"
            ...spellTools.letter1(char).slice(3), // "s"
            ...spellTools.word(startWord + char).slice(3), // "cats"
            ...spellTools.word(startWord + next2Chars).slice(3), // "catst"
            ...spellTools.word(word.slice(0, -1)).slice(3), // "catston"
            ...spellTools.word(finishWord.slice(0, -1)).slice(3), // "ston"
          ],
          [
            ...allStringsFromAUntilB(
              currentSpelling.slice(1, -1),
              goal.slice(1, -1)
            )
              .slice(1)
              .map(
                (x) =>
                  spellTech.tech[0] +
                  x +
                  spellTech.tech[spellTech.tech.length - 1]
              ),
            realElement,
          ]
        );
      }
      if (resultExists(realElement) || resultExists(goal)) return;
      if (resultExists(currentSpelling)) lastExistingSpelling = currentSpelling;
    }
    // if this point was reached, it failed.
    addFailedSpelling(realElement, lastExistingSpelling);
  }

  async function deSpell(
    spellTech: SpellTech,
    element: string,
    realElement: string
  ) {
    let deSpellSteps = spellTech.deSpell(element);

    const currentElement = splice(spellTech.tech, -1, element);

    // if there is no fancy deSpellStep stuff make it fancy
    if (!deSpellSteps[0] || !deSpellSteps[0].tools) {
      deSpellSteps = [{ tools: deSpellSteps }] as DeSpellTech[];
    }

    for (const deSpellStep of deSpellSteps as DeSpellTech[]) {
      const start = deSpellStep.start
        ? (deSpellStep.start as string)
        : currentElement;
      const goal = deSpellStep.goal ? (deSpellStep.goal as string) : null;

      if (resultExists(start)) {
        if (logMessages)
          console.log("Attempting deSpell:", deSpellStep, "for", start, "->", [
            goal,
            realElement,
          ]);
        await tryCombine(
          [start],
          deSpellStep.tools as string[],
          [goal, realElement].filter(Boolean)
        );
        addFailedSpelling(realElement, start);
      }
      if (resultExists(realElement)) return;
    }
  }

  function finishedSpelling(element: string) {
    if (resultExists(element)) {
      element = nealCase(element);
      console.log(`Finished spelling: ${element}${makeLineage(element)}`);
      // if (addSuccessfulSpellingsToElements) addElementToStorage(element);
      return true;
    }
  }

  function addFailedSpelling(element: string, failedSpelling: string) {
    element = nealCase(element);
    if (!failedSpellingsMap.has(element)) failedSpellingsMap.set(element, []);
    failedSpellingsMap.get(element)!.push(failedSpelling);
  }

  function failedToSpell(element: string) {
    element = nealCase(element);
    if (failedSpellingsMap.has(element)) {
      const failedSpellings = [
        ...new Set(failedSpellingsMap.get(element)!.map((x) => nealCase(x))),
      ];
      console.log(
        `Failed to spell ${element} with all kinds of tools... I guess i'm not powerful enough :(\nThese were the failed spellings:\n${failedSpellings.join(
          "\n"
        )}`
      );
      // if (addFailedSpellingsToElements) failedSpellings.forEach((x) => addElementToStorage(x));
    }
  }

  function makeLineage(
    element: string,
    visited: Set<string> = new Set()
  ): string {
    element = nealCase(element);
    if (recipesRes.has(element)) {
      visited.add(element);
      const [first, second] = recipesRes
        .get(element)![0]!
        .map((x) => nealCase(x));
      if (
        first &&
        second &&
        first !== element &&
        second !== element &&
        !visited.has(first) &&
        !visited.has(second)
      ) {
        return (
          makeLineage(first, visited) +
          makeLineage(second, visited) +
          `\n${first} + ${second} = ${element}`
        );
      }
    }
    return "";
  }

  async function tryCombine(
    inputs1: string[],
    inputs2: string[],
    expected: (string | null)[]
  ): Promise<string | boolean> {
    for (let i = 0; i < expected.length; i++) {
      if (resultExists(expected[i]!)) return true;
      expected[i] = nealCase(expected[i]!);
    }
    inputs1 = inputs1.map((x) => nealCase(x));
    inputs2 = inputs2.map((x) => nealCase(x));

    if (logMessages)
      console.log("\nTrying", inputs1, "+", inputs2, "=", expected);
    for (const input1 of inputs1) {
      for (const input2 of inputs2) {
        const response = await combine(input1, input2);
        if (response && expected.some((exp) => response === exp))
          return response;
      }
    }
    return false;
  }

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let lastCombination = Date.now();
  const currentRequests: Map<string, Promise<string | undefined>> = new Map(); // no duplicate requests

  async function combine(
    first: string,
    second: string
  ): Promise<string | undefined> {
    // console.log("combine", first, "+", second);
    if (!first || !second) return;
    if (first.length > 30 || second.length > 30) return;
    [first, second] = [first.trim(), second.trim()].sort() as [string, string];

    const combString = `${first}=${second}`;

    let recExists = recipeExists(first, second);
    if (recExists) return recExists;

    // if recipe is already requested
    if (currentRequests.has(combString)) {
      return currentRequests.get(combString)!;
    }

    const promise = (async () => {
      const waitingDelay = Math.max(
        0,
        combineTime - (Date.now() - lastCombination)
      );
      lastCombination = Date.now() + waitingDelay;
      await delay(waitingDelay);

      recExists = recipeExists(first, second);
      if (recExists) return recExists;

      const response = await __VUE__.craftApi(first, second);

      const text = response?.text;

      if (text) {
        recipesIng.set(combString, text);
        if (!recipesRes.has(text)) recipesRes.set(text, []);
        recipesRes.get(text)!.push([first, second]);

        if (text !== "Nothing") {
          emojiMap.set(text, response);
        }

        addElementToStorage(text); // == Patched by GameRoMan ==

        return text;
      }
    })();

    currentRequests.set(combString, promise);
    const text = await promise;
    currentRequests.delete(combString);
    return text;
  }

  function createElementInStorage(elementText: string) {
    const items = __VUE__.items;

    const toPush = {
      id: items.length,
      saveId: 0,
      text: elementText,
      emoji: "⬜",
      discovery: false,
      recipes: [],
    };

    items.push(toPush);

    // Add to IndexedDB
    const request = indexedDB.open("infinite-craft");

    request.onsuccess = (event) => {
      const db = (event.target as typeof request).result;
      const transaction = db.transaction("items", "readwrite");
      const store = transaction.objectStore("items");
      store.put(toPush);
    };
  }

  function addElementToStorage(elementText: string) {
    if (
      !elementText ||
      !emojiMap.has(elementText) ||
      elementStorageSet.has(elementText) ||
      icWindow.IC.getItems().filter((e) => e.text === elementText).length !== 0 // == Patched by GameRoMan ==
    ) {
      return;
    }

    elementStorageSet.add(elementText);

    const element = emojiMap.get(elementText)!;

    const items = __VUE__.items;

    const recipesForElement: [number, number][] = [];

    for (const recipe of recipesRes.get(element.text)!) {
      let firstElementId = items.findIndex((x) => x.text === recipe[0]);
      let secondElementId = items.findIndex((x) => x.text === recipe[1]);

      if (firstElementId === -1) {
        createElementInStorage(recipe[0]);
        firstElementId = items.findIndex((x) => x.text === recipe[0]);
      }

      if (secondElementId === -1) {
        createElementInStorage(recipe[1]);
        secondElementId = items.findIndex((x) => x.text === recipe[1]);
      }

      if (firstElementId >= 0 && secondElementId >= 0) {
        recipesForElement.push([firstElementId, secondElementId]);
      }
    }

    const toPush = {
      id: items.length,
      saveId: 0,
      text: element.text,
      emoji: element.emoji,
      discovery: element.discovery ?? false,
      recipes: [...recipesForElement],
    };

    items.push(toPush);

    // Add to IndexedDB
    const request = indexedDB.open("infinite-craft");

    request.onsuccess = (event) => {
      const db = (event.target as typeof request).result;
      const transaction = db.transaction("items", "readwrite");
      const store = transaction.objectStore("items");
      store.put(toPush);
    };
  }

  function recipeExists(first: string, second: string) {
    // first and second have to already be in nealCase() and Sorted
    return recipesIng.get(`${first}=${second}`) || undefined;
  }

  function resultExists(result: string, ret = false) {
    return ret
      ? recipesRes.get(nealCase(result))
      : recipesRes.has(nealCase(result));
  }

  function allStringsFromAUntilB(a: string, b: string) {
    const aUntilB = [a];
    for (let i = 0; i < b.length - a.length; i++) {
      aUntilB.push(aUntilB[i]! + b[a.length + i]);
    }
    return aUntilB;
  }

  const nealCasedLookup: Map<string, string> = new Map(); // optimization to store nealCased Elements
  function nealCase(input: string) {
    if (nealCasedLookup.has(input)) return nealCasedLookup.get(input)!;

    let result = "";
    const len = input.length;

    for (let i = 0; i < len; i++) {
      const char = input[i]!;
      result +=
        i === 0 || input[i - 1] === " "
          ? char.toUpperCase()
          : char.toLowerCase();
    }

    nealCasedLookup.set(input, result);
    return result;
  }

  window.addEventListener("load", async () => {
    // == Patched by GameRoMan ==

    while (!icWindow.IC) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    const items = icWindow.IC.getItems();

    elementStorageSet = new Set(items.map((x) => x.text));
    icWindow.elementStorageSet = elementStorageSet;

    items.forEach((item) => {
      emojiMap.set(item.text, {
        text: item.text,
        emoji: item.emoji,
        discovery: item.discovery ?? false,
      });
    });

    console.log(emojiMap.size);
    icWindow.emojiMap = emojiMap;
    // == Patched by GameRoMan ==

    icWindow.revive = async function (input: string) {
      const elems = input
        .split("\n")
        .filter(Boolean)
        .map((x) => x.trim());
      console.log("Revive called with words:", elems);
      console.time();

      await reviveElements(elems);

      // == Patched by GameRoMan ==
      const success = elems.reduce(
        (acc, line) => (resultExists(line) ? acc + line + "\n" : acc),
        ""
      );
      const fail = elems.reduce(
        (acc, line) => (!resultExists(line) ? acc + line + "\n" : acc),
        ""
      );

      console.log(`✅ Successfully Revived Words:\n${success}`);
      console.log(`❌ Failed to Revive Words:\n${fail}`);

      await sendMessage(
        "https://webhooks.gameroman.workers.dev/send/kit",
        `✅ Successfully Revived Words:\n${success}`.substr(0, 1900)
      );
      await sendMessage(
        "https://webhooks.gameroman.workers.dev/send/kit",
        `❌ Failed to Revive Words:\n${fail}`.substr(0, 1900)
      );
      // == Patched by GameRoMan ==

      icWindow.revivingProgress();
      console.timeEnd();
    };

    icWindow.revivingProgress = async function () {
      const groupLineages = ["%cLineages", "background: purple; color: white"];
      const lineageMessage = processedElementsList
        .filter((x) => resultExists(x))
        .map((x) => `Revived: ${x}${makeLineage(x)}`)
        .join("\n\n");
      console.groupCollapsed(...groupLineages);
      if (lineageMessage) console.log(lineageMessage);
      console.groupEnd();

      const successMessage = processedElementsList.filter((x) =>
        resultExists(x)
      );
      const groupSuccess = [
        `%cSuccessfully Revived Elements: (${successMessage.length})`,
        "background: green; color: white",
      ];
      console.groupCollapsed(...groupSuccess);
      if (successMessage.length > 0) console.log(successMessage.join("\n"));
      console.groupEnd();

      const failedMessage = processedElementsList.filter(
        (x) => !resultExists(x)
      );
      const groupFailed = [
        `%cFailed to Revive Elements: (${failedMessage.length})`,
        "background: red; color: white",
      ];
      console.groupCollapsed(...groupFailed);
      if (failedMessage.length > 0) console.log(failedMessage.join("\n"));
      console.groupEnd();
    };
  });
})();
