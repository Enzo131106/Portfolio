"use strict";

const backButton = document.getElementById("privacy-back");

backButton?.addEventListener("click", event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    window.close();
});
