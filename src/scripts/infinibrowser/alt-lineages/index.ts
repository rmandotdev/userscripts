type LineageInfo = { steps: number; lineageId: string };

const API_URL = "https://ib.gameroman.workers.dev/alt-lineages";

async function loadLineages(): Promise<LineageInfo[]> {
  const urlParams = new URLSearchParams(window.location.search);

  const itemId = urlParams.get("id") || window.location.pathname.split("/")[2];

  const type = "all";

  const response = await fetch(`${API_URL}/get?type=${type}&id=${itemId}`);

  try {
    const data = (await response.json()) as LineageInfo[];
    return data;
  } catch {
    return [];
  }
}

function getStatusText() {
  interface StatusText extends HTMLParagraphElement {
    setSuccessMessage: (messsage: string) => void;
    setWarning: (warning: string) => void;
    setError: (error: string) => void;

    setLoading: () => void;
    setProcessing: () => void;
    setInvalidInput: () => void;
  }
  const statusText = document.getElementById("status-text") as StatusText;

  statusText.setSuccessMessage = (messsage: string) => {
    statusText.textContent = messsage;
    statusText.style.color = "#AAFFAA";
  };
  statusText.setWarning = (warning: string) => {
    statusText.textContent = warning;
    statusText.style.color = "#FFCC00";
  };
  statusText.setError = (error: string) => {
    statusText.textContent = error;
    statusText.style.color = "#FFAAAA";
  };

  statusText.setLoading = () => {
    statusText.textContent = "Loading...";
    statusText.style.color = "#777777";
  };
  statusText.setProcessing = () => {
    statusText.textContent = "Processing...";
    statusText.style.color = "#777777";
  };
  statusText.setInvalidInput = () => {
    statusText.setError("Invalid input");
  };

  return statusText;
}

async function handleSubmitLineage() {
  const statusText = getStatusText();
  statusText.setLoading();

  const input = (document.getElementById("lineage-input") as HTMLInputElement)
    .value;

  if (!input.startsWith("https://infinibrowser.wiki/item/01")) {
    statusText.setInvalidInput();
    return;
  }

  const lineageId = input.split("https://infinibrowser.wiki/item/")[1]!;
  if (lineageId.length != 26) {
    statusText.setInvalidInput();
    return;
  }

  const storedData = await GM.getValue<{
    submittedLineages: string[];
    errors: { [key: string]: string };
  }>("lineageData", { submittedLineages: [], errors: {} });

  if (storedData.submittedLineages.includes(lineageId)) {
    statusText.setWarning("You have already submitted this lineage");
    return;
  }

  const storedError = storedData.errors[lineageId];
  if (storedError) {
    statusText.setError(storedError);
    return;
  }

  statusText.setProcessing();

  const response = await fetch(
    `${API_URL}/submit?id=${encodeURIComponent(lineageId)}`,
    { method: "POST" },
  );

  try {
    const data = (await response.json()) as
      | { OK: false; error: string }
      | { OK: true; message: string };

    if (data.OK) {
      statusText.setSuccessMessage(data.message);
      storedData.submittedLineages.push(lineageId);
      await GM.setValue("lineageData", storedData);
    } else {
      statusText.setError(data.error);
      storedData.errors[lineageId] = data.error;
      await GM.setValue("lineageData", storedData);
    }
  } catch (e) {
    const error = e as Error;
    const errorMessage = `An error occurred: ${error.message}`;
    statusText.setError(errorMessage);
    storedData.errors[lineageId] = errorMessage;
    await GM.setValue("lineageData", storedData);
  }
}

function closeModal() {
  (document.getElementById("modal_wrapper") as HTMLDivElement).remove();
}

function openLineageModal() {
  const modalWrapper = document.createElement("div");
  modalWrapper.id = "modal_wrapper";
  modalWrapper.className = "modal_wrapper";
  modalWrapper.style = `
background: rgba(0,0,0,.5);
display: flex;
align-items: center;
justify-content: center;
position: fixed;
z-index: 42;
width: 100%;
height: 100%;
top: 0;
left: 0;
`;

  const modal = document.createElement("div");
  modal.id = "modal";
  modal.className = "modal";
  modal.style = `
padding: 1.5rem;
border-radius: 10px;
max-width: 75%;
max-height: 75vh;
min-width: 28vw!important;
overflow-y: auto;
background-color: #18181b;
border: 1px solid #525252;
display: grid;
grid-auto-rows: minmax(min-content,max-content);
gap: .5rem;
animation: .4s cubic-bezier(.175,.885,.32,1.275) show_modal;
`;

  const modalTop = document.createElement("div");
  modalTop.className = "top";
  modalTop.style = `
display: flex;
align-items: center;
align-content: center;
width: 100%;
gap: 2rem;
`;

  const modalName = document.createElement("h2");
  modalName.textContent = "Submit Alternative LineageInfo";
  modalName.style.margin = "0px";
  modalTop.appendChild(modalName);

  const closeButton = document.createElement("button");
  closeButton.className = "close_modal";
  closeButton.addEventListener("click", closeModal);
  closeButton.style = `
padding: 0;
margin: 0 0 0 auto;
cursor: pointer;
background: 0 0;
outline: 0;
border: none;
opacity: .5;
transition: opacity .2s ease-in-out;
align-self: flex-start;
justify-self: flex-start;
`;

  const closeButtonImage = document.createElement("img");
  closeButtonImage.style.height = "2.5rem";
  closeButtonImage.style.width = "2.5rem";
  closeButtonImage.src = "/static/icon/button/close.svg";
  closeButtonImage.className = "close_modal";
  closeButton.appendChild(closeButtonImage);

  modalTop.appendChild(closeButton);

  modal.appendChild(modalTop);

  const lineageInput = document.createElement("input");
  lineageInput.placeholder =
    "https://infinibrowser.wiki/item/01hsvze7xwghsx1hjrrbe7ea9r";
  lineageInput.id = "lineage-input";
  lineageInput.style = `
resize: none;
font-size: 1rem;
font-family: "Roboto", sans-serif;
border: 1px solid #525252;
transform: translateY(2px);
border-radius: 4px;
padding: 0.5rem;
background: none;
color: #fff;
width: 475px;
`;

  modal.appendChild(lineageInput);

  const statusText = document.createElement("p");
  statusText.id = "status-text";
  statusText.style.margin = "0";
  modal.appendChild(statusText);

  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit";
  submitButton.className = "btn";
  submitButton.addEventListener("click", handleSubmitLineage);
  modal.appendChild(submitButton);

  modalWrapper.appendChild(modal);
  (document.querySelector("body > main") as HTMLElement).appendChild(
    modalWrapper,
  );
}

function createAltLineagesSection() {
  const altLineagesSection = document.createElement("section");
  altLineagesSection.id = "alternative_lineages_section";
  altLineagesSection.style.display = "none";

  const altLineagesSectionTopDiv = document.createElement("div");

  const altLineagesSectionCaption = document.createElement("h3");
  altLineagesSectionCaption.textContent = "Alternative Lineages";
  altLineagesSectionCaption.style.display = "inline";
  altLineagesSectionCaption.style.marginRight = "15px";
  altLineagesSectionTopDiv.appendChild(altLineagesSectionCaption);

  const altLineagesSubmitButton = document.createElement("button");
  altLineagesSubmitButton.className = "btn";
  altLineagesSubmitButton.id = "submit-alt-lineage";
  altLineagesSubmitButton.textContent = "Submit Alt LineageInfo";
  altLineagesSubmitButton.style.display = "inline";
  altLineagesSubmitButton.addEventListener("click", openLineageModal);
  altLineagesSectionTopDiv.appendChild(altLineagesSubmitButton);

  altLineagesSection.appendChild(altLineagesSectionTopDiv);

  return altLineagesSection;
}

function createLineageDiv(lineage: LineageInfo) {
  const lineageDiv = document.createElement("div");
  lineageDiv.className = "item";
  lineageDiv.textContent = `${lineage.steps} steps`;

  lineageDiv.addEventListener("click", () => {
    const itemUrl = `https://infinibrowser.wiki/item/${lineage.lineageId}`;
    const newTab = window.open(itemUrl, "_blank");

    if (newTab) {
      newTab.focus();
    }
  });

  return lineageDiv;
}

function init({
  nav,
  lineages,
}: {
  nav: HTMLDivElement;
  lineages: LineageInfo[];
}) {
  const altLineagesButton = document.createElement("button");
  altLineagesButton.className = "navbtn";
  altLineagesButton.dataset["id"] = "alternative_lineages_section";
  altLineagesButton.textContent = `Alternative Lineages (${lineages.length})`;
  nav.appendChild(altLineagesButton);

  const altLineagesSection = createAltLineagesSection();

  if (lineages.length) {
    const altLineagesDiv = document.createElement("div");
    for (const lineage of lineages) {
      const lineageDiv = createLineageDiv(lineage);
      altLineagesDiv.appendChild(lineageDiv);
    }
    altLineagesSection.appendChild(altLineagesDiv);
  } else {
    const noAltLineagesSpan = document.createElement("span");
    noAltLineagesSpan.className = "noaltlineages";
    noAltLineagesSpan.textContent = "No alternative lineages";
    altLineagesSection.appendChild(noAltLineagesSpan);
  }

  (document.querySelector("body > main") as HTMLElement).appendChild(
    altLineagesSection,
  );
}

const lineagesPromise = loadLineages();

window.addEventListener("load", async () => {
  const nav = document.querySelector<HTMLDivElement>("div.nav");
  if (!nav) return;
  if (window.location.pathname.startsWith("/item")) {
    const lineages = await lineagesPromise;
    init({ nav, lineages });
  }
});
