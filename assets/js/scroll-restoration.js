"use strict";

// Au rechargement de la page, restaurer le défilement au début de l'accueil.

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
