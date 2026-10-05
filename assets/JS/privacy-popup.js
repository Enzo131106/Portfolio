"use strict";

// Pop-up de confidentialité
const privacyPopup = document.getElementById("privacy-popup");
const privacyButton = document.getElementById("privacy-button");

// Affiche la pop-up si elle n'a pas encore été validée
if (!localStorage.getItem("privacyNoticeShown")) {
    privacyPopup.classList.add("show");
}

// Ferme la pop-up et mémorise le choix
privacyButton.addEventListener("click", () => {
    localStorage.setItem("privacyNoticeShown", "true");
    privacyPopup.classList.remove("show");
});