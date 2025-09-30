(function () {
  function getCurrentTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}-${hours}-${minutes}`;
  }

  function downloadSavefile() {
    const vue_container = document.querySelector(".infinite-craft").__vue__;
    const savefileName = getCurrentTime();
    vue_container.downloadSave(vue_container.currSave, savefileName);
  }

  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      downloadSavefile();
    }
  });
})();
