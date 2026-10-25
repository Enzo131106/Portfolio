"use strict";

/* Réinitialise la page en haut uniquement lors d'un rechargement explicite. */
(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const isReload = navigation ? navigation.type === "reload" : false;
    if (!isReload) return;

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    const resetToTop = () => {
        window.scrollTo(0, 0);
    };

    resetToTop();
    window.addEventListener("pageshow", resetToTop, { once: true });
})();
