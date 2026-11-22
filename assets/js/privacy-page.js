"use strict";

// Navigation de retour depuis la page de confidentialité.

const backButton = document.getElementById("privacy-back");

backButton.addEventListener("click", () => {

    window.close();

    window.location.href = "./index.html";

});