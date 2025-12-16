import { getElementUrl, getLineage } from "./elements";
import { getFormattedMessage, handleBigLineage, sendMessage } from "./messages";
import { getWebhook, newWebhook } from "./webhook";

async function handleDiscordButtonClick() {
  if (!localStorage.getItem("webhookEncoded")) {
    newWebhook();
  }

  const webhook = await getWebhook();

  const elementUrl = getElementUrl();
  const data = await getLineage(elementUrl);

  if (!data) return;

  const steps = data.steps;
  const formattedMessage = getFormattedMessage(steps);

  if (formattedMessage.length <= 2000) {
    await sendMessage(webhook, formattedMessage);
  } else {
    const sendBigMessage = confirm(
      `Lineage is too big\nMax: 2000 characters\nLineage: ${
        formattedMessage.length
      } characters\n\nDo you want the lineage to get sent in ${Math.ceil(
        formattedMessage.length / 2000,
      )} separate messages?`,
    );
    if (sendBigMessage) handleBigLineage(webhook, steps);
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

export { setupDiscordButton };
