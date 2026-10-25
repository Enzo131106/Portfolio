/* Démo temporaire : travelling de type intro, piloté en continu par le scroll, avec snap après une pause proche d'un repère. */
(() => {
    const section = document.querySelector("#projects.scroll-test-section");
    if (!section) return;

    const panels = Array.from(section.querySelectorAll(".scroll-test-panel"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const idleDelay = 360;
    const snapRange = 150;
    const travelDuration = 420;
    let idleTimer = 0;
    let animationFrame = 0;
    let animationStart = 0;
    let animationFrom = 0;
    let animationTo = 0;
    let programmaticScroll = false;
    let visualFrame = 0;

    // Simule le travelling de l'intro : chaque panneau part plus petit et
    // vient à l'échelle réelle au centre de l'écran, en fonction du scroll.
    const updateTravelVisual = () => {
        visualFrame = 0;
        const viewportHeight = window.innerHeight;
        const focusY = viewportHeight * 0.52;

        panels.forEach((panel) => {
            const rect = panel.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const distance = Math.abs(centerY - focusY) / (viewportHeight * 0.72);
            const proximity = Math.max(0, Math.min(1, 1 - distance));
            const scale = reducedMotion ? 1 : 0.72 + proximity * 0.28;
            const translateY = reducedMotion ? 0 : (centerY - focusY) * 0.10;
            const opacity = reducedMotion ? 1 : 0.42 + proximity * 0.58;

            panel.style.setProperty("--travel-scale", scale.toFixed(4));
            panel.style.setProperty("--travel-y", translateY.toFixed(2) + "px");
            panel.style.setProperty("--travel-opacity", opacity.toFixed(3));
        });
    };

    const scheduleTravelVisual = () => {
        if (!visualFrame) visualFrame = requestAnimationFrame(updateTravelVisual);
    };

    const stopTravel = () => {
        window.clearTimeout(idleTimer);
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            window.scrollTo({ top: window.scrollY, behavior: "auto" });
        }
        programmaticScroll = false;
    };

    const findNearestAnchor = () => {
        let nearest = null;
        let nearestDistance = Infinity;
        panels.forEach((panel) => {
            const targetY = window.scrollY + panel.getBoundingClientRect().top - 94;
            const distance = Math.abs(targetY - window.scrollY);
            if (distance < nearestDistance) {
                nearest = { targetY: Math.max(0, targetY), distance };
                nearestDistance = distance;
            }
        });
        return nearest;
    };

    const startTravel = (targetY) => {
        if (reducedMotion) {
            window.scrollTo({ top: targetY, behavior: "auto" });
            return;
        }
        animationFrom = window.scrollY;
        animationTo = targetY;
        animationStart = performance.now();
        programmaticScroll = true;

        const step = (now) => {
            if (!programmaticScroll) return;
            const progress = Math.min(1, (now - animationStart) / travelDuration);
            const eased = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, animationFrom + (animationTo - animationFrom) * eased);
            scheduleTravelVisual();
            if (progress < 1) {
                animationFrame = requestAnimationFrame(step);
            } else {
                animationFrame = 0;
                programmaticScroll = false;
            }
        };
        animationFrame = requestAnimationFrame(step);
    };

    const trySnap = () => {
        idleTimer = 0;
        if (programmaticScroll) return;
        const nearest = findNearestAnchor();
        if (!nearest || nearest.distance < 10 || nearest.distance > snapRange) return;
        startTravel(nearest.targetY);
    };

    window.addEventListener("scroll", () => {
        scheduleTravelVisual();
        if (programmaticScroll) return;
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(trySnap, idleDelay);
    }, { passive: true });

    const interruptTravel = () => {
        if (programmaticScroll || animationFrame) stopTravel();
        window.clearTimeout(idleTimer);
    };
    window.addEventListener("wheel", interruptTravel, { passive: true });
    window.addEventListener("touchstart", interruptTravel, { passive: true });
    window.addEventListener("pointerdown", interruptTravel, { passive: true });
    window.addEventListener("keydown", (event) => {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) interruptTravel();
    });
    window.addEventListener("resize", scheduleTravelVisual, { passive: true });
    updateTravelVisual();
})();