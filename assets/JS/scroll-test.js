/* Démo temporaire : scroll libre avec travelling discret après une pause près d'un repère. */
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
    let lastScrollY = window.scrollY;
    let programmaticScroll = false;

    const stopTravel = () => {
        window.clearTimeout(idleTimer);
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            // Stop the browser's native smooth scrolling too, if one is active.
            window.scrollTo({ top: window.scrollY, behavior: "auto" });
        }
        programmaticScroll = false;
    };

    const findNearestAnchor = () => {
        const viewportAnchor = 94;
        let nearest = null;
        let nearestDistance = Infinity;

        panels.forEach((panel) => {
            const targetY = window.scrollY + panel.getBoundingClientRect().top - viewportAnchor;
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

            if (progress < 1) {
                animationFrame = requestAnimationFrame(step);
            } else {
                animationFrame = 0;
                programmaticScroll = false;
                lastScrollY = window.scrollY;
            }
        };

        animationFrame = requestAnimationFrame(step);
    };

    const trySnap = () => {
        idleTimer = 0;
        if (programmaticScroll) return;

        const nearest = findNearestAnchor();
        // The user remains completely free to stop anywhere outside this small zone.
        if (!nearest || nearest.distance < 10 || nearest.distance > snapRange) return;

        startTravel(nearest.targetY);
    };

    window.addEventListener("scroll", () => {
        const currentY = window.scrollY;
        if (programmaticScroll) {
            lastScrollY = currentY;
            return;
        }
        lastScrollY = currentY;
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(trySnap, idleDelay);
    }, { passive: true });

    // Any fresh user input interrupts the travelling at the current position.
    const interruptTravel = () => {
        if (programmaticScroll || animationFrame) stopTravel();
        window.clearTimeout(idleTimer);
    };

    window.addEventListener("wheel", interruptTravel, { passive: true });
    window.addEventListener("touchstart", interruptTravel, { passive: true });
    window.addEventListener("pointerdown", interruptTravel, { passive: true });
    window.addEventListener("keydown", (event) => {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
            interruptTravel();
        }
    });
})();
