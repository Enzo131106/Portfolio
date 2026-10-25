/* Démo temporaire : travelling de type intro, piloté en continu par le scroll, avec snap après une pause proche d'un repère. */
(() => {
    const section = document.querySelector("#projects.scroll-test-section");
    if (!section) return;

    const panels = Array.from(section.querySelectorAll(".scroll-test-panel"));
    // Les panneaux servent de repères dans Projets ; Parcours et Contact sont aussi
    // des étapes du trajet et peuvent recevoir le snap discret après une pause.
    const anchors = [
        ...panels,
        document.querySelector("#parcours"),
        document.querySelector("#contact")
    ].filter(Boolean);
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
            const signedDistance = (centerY - focusY) / (viewportHeight * 0.85);
            const distance = Math.abs(signedDistance);
            const proximity = Math.max(0, Math.min(1, 1 - distance));
            // Le panneau arrive depuis la profondeur, se redresse au centre,
            // puis repart en perspective. Le signe conserve le sens haut/bas.
            const scale = reducedMotion ? 1 : 0.62 + proximity * 0.38;
            const translateY = reducedMotion ? 0 : Math.max(-90, Math.min(90, signedDistance * 70));
            const rotateX = reducedMotion ? 0 : Math.max(-24, Math.min(24, signedDistance * 26));
            const translateZ = reducedMotion ? 0 : -260 * (1 - proximity);
            const opacity = reducedMotion ? 1 : 0.18 + proximity * 0.82;
            const blur = reducedMotion ? 0 : (1 - proximity) * 1.2;

            panel.style.setProperty("--travel-scale", scale.toFixed(4));
            panel.style.setProperty("--travel-y", translateY.toFixed(2) + "px");
            panel.style.setProperty("--travel-rotate-x", rotateX.toFixed(2) + "deg");
            panel.style.setProperty("--travel-z", translateZ.toFixed(2) + "px");
            panel.style.setProperty("--travel-blur", blur.toFixed(2) + "px");
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
        anchors.forEach((panel) => {
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