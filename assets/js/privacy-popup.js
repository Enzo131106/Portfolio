"use strict";

const privacyPopup = document.getElementById("privacy-popup");
const privacyButton = document.getElementById("privacy-button");
const privacyMore = privacyPopup.querySelector(".privacy-more");
const privacyBackground = [...document.querySelectorAll("body > header, body > main, body > footer")];
let privacyNoticeShown = false;

try {
    privacyNoticeShown = Boolean(localStorage.getItem("privacyNoticeShown"));
} catch (_) {}

function focusPrivacyNotice() {
    if (privacyPopup.classList.contains("show") && !document.getElementById("loading-screen")) {
        privacyButton.focus({ preventScroll: true });
    }
}

function closePrivacyNotice() {
    privacyBackground.forEach(element => { element.inert = false; });
    privacyPopup.classList.remove("show");
    document.querySelector('.navbar .nav-link[href="#accueil"]')?.focus({ preventScroll: true });
    privacyPopup.inert = true;
    privacyPopup.setAttribute("aria-hidden", "true");

    try {
        localStorage.setItem("privacyNoticeShown", "true");
    } catch (_) {}
}

if (!privacyNoticeShown) {
    privacyBackground.forEach(element => { element.inert = true; });
    privacyPopup.inert = false;
    privacyPopup.removeAttribute("aria-hidden");
    privacyPopup.classList.add("show");
    window.addEventListener("portfolio-loader-hidden", focusPrivacyNotice, { once: true });
    focusPrivacyNotice();
}

privacyButton.addEventListener("click", closePrivacyNotice);

privacyPopup.addEventListener("keydown", event => {
    event.stopPropagation();
    if (event.key === "Escape") {
        event.preventDefault();
        closePrivacyNotice();
    } else if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === privacyButton) {
            event.preventDefault();
            privacyMore.focus();
        } else if (!event.shiftKey && document.activeElement === privacyMore) {
            event.preventDefault();
            privacyButton.focus();
        }
    }
});
