"use strict";

// Le message n'apparaît qu'à la première visite enregistrée dans ce navigateur.
const privacyPopup = document.getElementById("privacy-popup");
const privacyButton = document.getElementById("privacy-button");

if (!localStorage.getItem("privacyNoticeShown")) {
    privacyPopup.classList.add("show");
}

// Le choix est mémorisé pour ne pas rouvrir la fenêtre à chaque visite.
privacyButton.addEventListener("click", () => {
    localStorage.setItem("privacyNoticeShown", "true");
    privacyPopup.classList.remove("show");
});