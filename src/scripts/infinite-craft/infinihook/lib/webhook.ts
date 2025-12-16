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

export { getWebhook, newWebhook };
