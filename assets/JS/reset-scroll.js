"use strict";

/*
 * Réinitialise la position uniquement lors d'un rechargement explicite.
 * Le script est isolé des animations et des autres fonctionnalités.
 */
(() => {
    if (!("scrollRestoration" in history)) return;

    history.scrollRestoration = "manual";

    const navigation = performance.getEntriesByType("navigation")[0];
    const isReload = navigation ? navigation.type === "reload" : false;

    if (!isReload) return;

    const resetToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };

    // Avant le rendu normal, puis après pageshow pour couvrir le retour du cache BFCache.
    resetToTop();
    window.addEventListener("pageshow", resetToTop, { once: true });
})();
