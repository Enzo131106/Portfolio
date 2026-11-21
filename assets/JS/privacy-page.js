"use strict";

// On tente de fermer l'onglet ; sinon le bouton ramène à l'accueil.
const backButton = document.getElementById("privacy-back");

backButton.addEventListener("click", () => {

    window.close();

    window.location.href = "./index.html";

});