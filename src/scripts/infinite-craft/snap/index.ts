import type { ICInstanceData } from "@infinite-craft/dom-types";

const snappingGap = 8;
const snappingDistance = 16;

function getInstance(element: HTMLElement) {
  const regex = /calc\(-50% (. \d+\.?\d*)px\) calc\(-50% (. \d+\.?\d*)px\)/;
  const matches = element.style.translate.match(regex);
  if (!matches) {
    return null;
  }
  return unsafeWindow.IC.getInstances().find(
    (instance) =>
      instance.x == matches[1].replace(/\s/g, "") &&
      instance.y == matches[2].replace(/\s/g, ""),
  );
}

function snap(a: ICInstanceData) {
  const aLeft = a.x - a.element.offsetWidth / 4;
  const aRight = aLeft + a.element.offsetWidth / 2;
  const aTop = a.y;
  const aBottom = aTop + a.element.offsetHeight / 2;

  let newLeft = aLeft;
  let newTop = aTop;
  const sortedInstances = unsafeWindow.IC.getInstances()
    .map((x) => [x, Math.abs(x.y - aTop)] as const)
    .sort((a, b) => a[1] - b[1])
    .map((x) => x[0])
    .reverse();
  for (const b of sortedInstances) {
    if (a === b) {
      continue;
    }

    const bLeft = b.x - b.element.offsetWidth / 4;
    const bRight = bLeft + b.element.offsetWidth / 2;
    const bTop = b.y;
    const bBottom = bTop + b.element.offsetHeight / 2;
    let snapped = false;

    if (Math.abs(aTop - bTop) < snappingDistance) {
      if (Math.abs(bLeft - aRight) < snappingDistance) {
        newLeft = bLeft - snappingGap - a.element.offsetWidth / 2;
        newTop = bTop;
        snapped = true;
      }
      if (Math.abs(aLeft - bRight) < snappingDistance) {
        newLeft = bRight + snappingGap;
        newTop = bTop;
        snapped = true;
      }
    }
    if (
      (bLeft < aRight && aRight < bRight) ||
      (aLeft < bRight && bRight < aRight)
    ) {
      if (0 < aTop - bBottom && aTop - bBottom < snappingDistance) {
        newTop = bBottom + snappingGap;
        snapped = true;
      }
      if (0 < bTop - aBottom && bTop - aBottom < snappingDistance) {
        newTop = bTop - snappingGap - a.element.offsetHeight / 2;
        snapped = true;
      }
    }

    if (snapped) {
      b.element.setAttribute("data-snapped", "true");
    } else {
      b.element.setAttribute("data-snapped", "false");
    }
  }

  a.x = newLeft + a.element.offsetWidth / 4;
  a.y = newTop;
  a.element.style.translate = `calc(-50% + ${a.x}px) calc(-50% + ${a.y}px)`;
}

function observeSnap() {
  const instances = document.querySelector("#instances");
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName !== "data-snapped") continue;
      const element = mutation.target;
      if (!(element instanceof HTMLElement)) continue;
      const instance = getInstance(element);
      if (!instance) continue;

      if (element.getAttribute("data-snapped") === "true") {
        instance.disabled = true;
      } else {
        instance.disabled = false;
      }
    }
  });

  observer.observe(instances, {
    attributes: true,
    subtree: true,
    childList: true,
  });
}

function observePosition(element: HTMLElement) {
  const positionObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName !== "style") {
        continue;
      }
      const instance = getInstance(element);
      if (!instance) {
        continue;
      }
      snap(instance);
    }
  });

  positionObserver.observe(element, { attributes: true });
  return positionObserver;
}

function observeDrag() {
  let positionObserver: MutationObserver;
  const instancesTop = document.querySelector("#instances-top");
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const element of mutation.addedNodes) {
        if (!(element instanceof HTMLElement)) continue;
        const instance = getInstance(element);
        if (!instance) {
          continue;
        }
        positionObserver = observePosition(element);
      }
      if (mutation.removedNodes.length > 0) {
        positionObserver.disconnect();
        const instances = document.querySelector("#instances");
        for (const el of instances.childNodes) {
          el.setAttribute("data-snapped", "false");
        }
      }
    }
  });

  observer.observe(instancesTop, { subtree: true, childList: true });
}

unsafeWindow.addEventListener("load", async () => {
  observeDrag();
  observeSnap();
});
