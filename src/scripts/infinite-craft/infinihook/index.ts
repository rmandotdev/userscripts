import { LineageType, LineageDataType } from "infinibrowser";

(function () {
  // ---------- Webhook setup functions ----------

  async function newWebhook() {
    const webhook = prompt("Enter webhook url");
    if (!webhook) return newWebhook();
    await GM.setValue("webhook", webhook);
    return webhook;
  }

  async function getWebhook() {
    const webhook = (await GM.getValue("webhook")) as string | undefined;
    if (!webhook) return newWebhook();
    return webhook;
  }

  // ---------- Webhook setup functions ----------

  // ---------- Message handling ----------

  async function sendMessage(
    webhookUrl: string,
    message: string,
    alertForSuccess = true
  ) {
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
        alert("Something went wrong, check Console for more information");
      } else {
        if (alertForSuccess) alert("Lineage successfully sent to your webhook");
        return true;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function convertToSteps(stepsJson: LineageType) {
    const steps = [];

    for (const item of stepsJson) {
      const { a, b, result } = item;
      steps.push(`${a.id} + ${b.id} = ${result.id}`);
    }

    return steps;
  }

  function convertToMessage(steps: string[]) {
    return steps.join("\n");
  }

  function addStepCount(message: string, steps: string[]) {
    return `${message}  // ${steps.length} :: `;
  }

  function addHeader(message: string, stepsJson: LineageType) {
    const elementUrl = `<${window.location.href}>`;
    const lastElementId = stepsJson[stepsJson.length - 1]!.result.id;

    return `Recipe for [\`${lastElementId}\`](${elementUrl})\n${message}`;
  }

  function wrapMessage(message: string) {
    return `
\`\`\`adoc
${message}
\`\`\`
`;
  }

  async function handleBigLineage(webhookUrl: string, stepsJson: LineageType) {
    const steps = convertToSteps(stepsJson);
    const messages = splitIntoSeparateMessage(steps);

    for (let i = 0, len = messages.length; i < len; i++) {
      const stepsForThisMessage = messages[i]!;
      const message = convertToMessage(stepsForThisMessage);

      let formattedMessage;

      if (i === len - 1) {
        const messageWithLengthCount = addStepCount(message, steps);
        const wrappedMessage = wrapMessage(messageWithLengthCount);
        formattedMessage = wrappedMessage;
      } else if (i === 0) {
        const wrappedMessage = wrapMessage(message);
        formattedMessage = addHeader(wrappedMessage, stepsJson);
      } else {
        const wrappedMessage = wrapMessage(message);
        formattedMessage = wrappedMessage;
      }

      const success = await sendMessage(webhookUrl, formattedMessage, false);
      console.log(success);
    }
  }

  function splitIntoSeparateMessage(
    steps: string[],
    maxLength = 2000,
    joinCharacterLength = 3
  ) {
    const messages: string[][] = [];
    let currentArray: string[] = [];
    let currentLength = 0;

    for (const step of steps) {
      const newLength = currentLength + step.length + joinCharacterLength;
      if (newLength > maxLength) {
        messages.push(currentArray);
        currentArray = [step];
        currentLength = step.length;
      } else {
        currentArray.push(step);
        currentLength = newLength;
      }
    }

    if (currentArray.length > 0) {
      messages.push(currentArray);
    }

    return messages;
  }

  // ---------- Message handling ----------

  // ---------- Element handling ----------

  function getElementUrl() {
    const element = window.location.search
      ? window.location.href.split("=")[1]
      : window.location.href.split("/")[4];

    const itemFooter = document.getElementById("item_footer");
    const isUserSubmitted =
      itemFooter &&
      itemFooter.textContent === "This is an unverified user-submitted element";

    if (isUserSubmitted) {
      return `https://infinibrowser.wiki/api/recipe/custom?id=${element}`;
    } else {
      return `https://infinibrowser.wiki/api/recipe?id=${element}`;
    }
  }

  async function getLineage(elementUrl: string) {
    try {
      const response = await fetch(elementUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const data: LineageDataType = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // ---------- Element handling ----------

  // ---------- Discord button setup functions ----------

  async function handleDiscordButtonClick() {
    if (!localStorage.getItem("webhookEncoded")) {
      newWebhook();
    }

    const webhook = await getWebhook();

    const elementUrl = getElementUrl();
    // const _data = ib.getLineage();
    const data = await getLineage(elementUrl);

    if (data) {
      const stepsJson = data.steps;

      const steps = convertToSteps(stepsJson);
      const message = convertToMessage(steps);

      const messageWithLengthCount = addStepCount(message, steps);
      const wrappedMessage = wrapMessage(messageWithLengthCount);
      const formattedMessage = addHeader(wrappedMessage, stepsJson);

      if (formattedMessage.length <= 2000) {
        await sendMessage(webhook, formattedMessage);
      } else {
        const sendBigMessage = confirm(
          `Lineage is too big\nMax: 2000 characters\nLineage: ${
            formattedMessage.length
          } characters\n\nDo you want the lineage to get sent in ${Math.ceil(
            formattedMessage.length / 2000
          )} separate messages?`
        );
        if (sendBigMessage) handleBigLineage(webhook, stepsJson);
      }
    }
  }

  function setupDiscordButton() {
    const discordButtonImageUrl =
      "https://img.icons8.com/ios7/512/FFFFFF/discord-logo.png";

    const buttonMenu = document.querySelector(".ibuttons") as HTMLDivElement;

    const discordButton = document.createElement("button");

    const discordButtonImage = document.createElement("img");
    discordButtonImage.id = "discord-button-image";
    discordButtonImage.src = discordButtonImageUrl;
    discordButtonImage.draggable = false;

    discordButton.appendChild(discordButtonImage);

    buttonMenu.appendChild(discordButton);

    discordButton.addEventListener("click", handleDiscordButtonClick);
  }

  // ---------- Discord button setup functions ----------

  // ---------- Main program ----------

  if (window.location.href.startsWith("https://infinibrowser.wiki/item")) {
    setupDiscordButton();
  }

  // ---------- Main program ----------
})();
