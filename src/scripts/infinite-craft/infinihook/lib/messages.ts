import type { LineageType } from "infinibrowser";

async function sendMessage(
  webhookUrl: string,
  message: string,
  alertForSuccess = true,
) {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify({ content: message }),
      headers: { "Content-Type": "application/json" },
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
  joinCharacterLength = 3,
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

function getFormattedMessage(stepsJson: LineageType) {
  const steps = convertToSteps(stepsJson);
  const message = convertToMessage(steps);
  const messageWithLengthCount = addStepCount(message, steps);
  const wrappedMessage = wrapMessage(messageWithLengthCount);
  const formattedMessage = addHeader(wrappedMessage, stepsJson);
  return formattedMessage;
}

export { sendMessage, getFormattedMessage, handleBigLineage };
