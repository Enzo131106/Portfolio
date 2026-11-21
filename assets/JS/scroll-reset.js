"use strict";

(() => {
    // On revient en haut uniquement après un rechargement, pas après un lien ou un retour arrière.
    const navigation = performance.getEntriesByType("navigation")[0];
    const isReload = navigation ? navigation.type === "reload" : false;
    if (!isReload) return;

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    // On répète le réglage sur pageshow pour les restaurations de page.
    const resetToTop = () => {
        window.scrollTo(0, 0);
    };

    resetToTop();
    window.addEventListener("pageshow", resetToTop, { once: true });
})();
