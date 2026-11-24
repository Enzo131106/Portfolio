"use strict";

(() => {
    const button = document.querySelector(".contact-copy");
    const email = document.querySelector(".contact-email");
    const status = document.querySelector(".contact-copy-status");
    if (!button || !email || !status || !navigator.clipboard?.writeText) return;

    button.hidden = false;
    email.disabled = false;
    let resetTimer;
    let clearTimer;

    async function copyEmail() {
        clearTimeout(resetTimer);
        clearTimeout(clearTimer);
        const icon = button.querySelector("i");
        try {
            await navigator.clipboard.writeText(email.textContent.trim());
            status.classList.remove("is-error");
            status.textContent = "Adresse copiée";
            icon.className = "bi bi-check2";
        } catch {
            status.classList.add("is-error");
            status.textContent = "Copie impossible";
            icon.className = "bi bi-copy";
        }
        status.classList.add("is-visible");
        resetTimer = setTimeout(() => {
            status.classList.remove("is-visible");
            icon.className = "bi bi-copy";
            clearTimer = setTimeout(() => {
                status.textContent = "";
            }, 260);
        }, 2300);
    }

    email.addEventListener("click", copyEmail);
    button.addEventListener("click", copyEmail);
})();
