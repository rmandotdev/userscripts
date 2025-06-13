// ==UserScript==
//
// @name            Resizable minimap
// @namespace       rman.dev
//
// @match           https://neal.fun/internet-roadtrip/*
//
// @version         1.0.2
// @author          GameRoMan
// @description     Allows you to resize the minimap to any size you want!
//
// @downloadURL     https://userscripts.rman.dev/internet-roadtrip/resizable-minimap/index.user.js
// @updateURL       https://userscripts.rman.dev/internet-roadtrip/resizable-minimap/index.user.js
//
// @supportURL      https://rman.dev/discord
// @homepageURL     https://rman.dev/discord
//
// @license         MIT
//
// ==/UserScript==

(function () {
  "use strict";

  const miniMap = document.getElementById("mini-map");

  const expandButton = document.querySelector(".expand-button");
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
  let lastX, lastY;

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
