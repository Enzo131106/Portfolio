"use strict";

(() => {
    const button = document.querySelector(".contact-copy");
    const email = document.querySelector(".contact-email");
    const status = document.querySelector(".contact-copy-status");
    if (!button || !email || !status || !navigator.clipboard?.writeText) return;

    button.hidden = false;
    email.disabled = false;
    let resetTimer;

    async function copyEmail() {
        clearTimeout(resetTimer);
        const icon = button.querySelector("i");
        try {
            await navigator.clipboard.writeText(email.textContent.trim());
            status.textContent = "Adresse copiée";
            icon.className = "bi bi-check2";
        } catch {
            status.textContent = "Copie indisponible. Sélectionnez l’adresse.";
            icon.className = "bi bi-copy";
        }
        resetTimer = setTimeout(() => {
            status.textContent = "";
            icon.className = "bi bi-copy";
        }, 2500);
    }

    email.addEventListener("click", copyEmail);
    button.addEventListener("click", copyEmail);
})();
