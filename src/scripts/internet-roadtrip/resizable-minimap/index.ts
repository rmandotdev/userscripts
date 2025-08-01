(function () {
  const miniMap = document.getElementById("mini-map") as HTMLDivElement;

  const expandButton = document.querySelector(
    ".expand-button"
  ) as HTMLDivElement;
  expandButton.style.display = "none";

  const resizer = document.createElement("div");
  resizer.style.cssText = `
    width: 15px;
    height: 15px;
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
    top: 0;
    right: 0;
    cursor: nesw-resize;
    z-index: 10;
  `;

  miniMap.appendChild(resizer);

  let isResizing = false;
  let lastX: number, lastY: number;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    const currentWidth = miniMap.offsetWidth;
    const currentHeight = miniMap.offsetHeight;

    miniMap.style.width = currentWidth + deltaX + "px";
    miniMap.style.height = currentHeight - deltaY + "px";

    lastX = e.clientX;
    lastY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
  });

  if (window.getComputedStyle(miniMap).position === "static") {
    miniMap.style.position = "relative";
  }
})();
