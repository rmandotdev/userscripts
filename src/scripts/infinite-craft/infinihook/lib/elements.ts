import type { LineageDataType } from "infinibrowser";

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
      headers: { "Content-Type": "application/json" },
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

export { getElementUrl, getLineage };
