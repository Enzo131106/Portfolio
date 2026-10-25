/* Démo temporaire : snap discret uniquement dans #projects.
   Supprimer ce fichier pour désactiver entièrement le comportement de test. */
(() => {
    const section = document.querySelector("#projects.scroll-test-section");
    if (!section) return;

    const panels = Array.from(section.querySelectorAll(".scroll-test-panel"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scrollTimer = 0;
    let snapInProgress = false;

    const cancelSnap = () => {
        window.clearTimeout(scrollTimer);
        if (snapInProgress) {
            snapInProgress = false;
        }
    };

    const tryGentleSnap = () => {
        snapInProgress = false;
        const viewportAnchor = 94;
        let nearest = null;
        let nearestDistance = Infinity;

        panels.forEach((panel) => {
            const targetY = window.scrollY + panel.getBoundingClientRect().top - viewportAnchor;
            const distance = Math.abs(targetY - window.scrollY);
            if (distance < nearestDistance) {
                nearest = { targetY, distance };
                nearestDistance = distance;
            }
        });

        // Aucun rattrapage si l'utilisateur n'est pas déjà tout près d'un repère.
        if (!nearest || nearest.distance < 8 || nearest.distance > 64) return;

        snapInProgress = true;
        window.scrollTo({
            top: Math.max(0, nearest.targetY),
            behavior: reducedMotion ? "auto" : "smooth"
        });
        window.setTimeout(() => { snapInProgress = false; }, reducedMotion ? 0 : 280);
    };

    window.addEventListener("scroll", () => {
        if (snapInProgress) return;
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(tryGentleSnap, 180);
    }, { passive: true });

    // Un nouveau geste reprend immédiatement la main à l'utilisateur.
    window.addEventListener("wheel", cancelSnap, { passive: true });
    window.addEventListener("touchstart", cancelSnap, { passive: true });
    window.addEventListener("pointerdown", cancelSnap, { passive: true });
    window.addEventListener("keydown", (event) => {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) cancelSnap();
    });
})();