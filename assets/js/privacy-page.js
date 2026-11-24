"use strict";

const backButton = document.getElementById("privacy-back");

backButton.addEventListener("click", () => {

    window.close();

    window.location.href = "./index.html";

});