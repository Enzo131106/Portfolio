"use strict";

const privacyPopup = document.getElementById("privacy-popup");
const privacyButton = document.getElementById("privacy-button");

if (!localStorage.getItem("privacyNoticeShown")) {
    privacyPopup.classList.add("show");
}

privacyButton.addEventListener("click", () => {
    localStorage.setItem("privacyNoticeShown", "true");
    privacyPopup.classList.remove("show");
});