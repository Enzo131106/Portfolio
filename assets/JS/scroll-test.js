/* Démo temporaire : travelling de type intro, piloté en continu par le scroll, avec snap après une pause proche d'un repère. */
(() => {
    const section = document.querySelector("#projects.scroll-test-section");
    if (!section) return;

    const panels = Array.from(section.querySelectorAll(".scroll-test-panel"));
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    let introFinished = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("portfolio-hero-arrived", () => {
        introFinished = true;
        scheduleTravelVisual();
    }, { once: true });
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

    // offsetTop donne la position de mise en page, indépendamment des transforms 3D.
    // Lire getBoundingClientRect() ici créerait une boucle : le transform influencerait
    // la mesure utilisée pour calculer le transform suivant.
    const getLayoutTop = (element) => {
        let top = 0;
        let current = element;
        while (current) {
            top += current.offsetTop || 0;
            current = current.offsetParent;
        }
        return top;
    };

    // Simule le travelling de l'intro : chaque panneau part plus petit et
    // vient à l'échelle réelle au centre de l'écran, en fonction du scroll.
    const updateTravelVisual = () => {
        visualFrame = 0;
        const viewportHeight = window.innerHeight;
        const focusY = viewportHeight * 0.52;

        // Le hero avance vers la caméra au scroll, puis s'efface comme si
        // l'utilisateur le traversait. À la remontée, il retrouve sa taille.
        if (hero && heroInner && introFinished && !reducedMotion) {
            const heroRect = hero.getBoundingClientRect();
            const progress = Math.max(0, Math.min(1,
                (-heroRect.top) / Math.max(1, hero.offsetHeight * 0.82)
            ));
            const zoom = 1 + progress * 2.4;
            const opacity = Math.max(0, 1 - Math.max(0, progress - 0.62) / 0.38);
            heroInner.style.transformOrigin = "center center";
            heroInner.style.transform = `scale(${zoom.toFixed(3)})`;
            heroInner.style.opacity = opacity.toFixed(3);
            heroInner.style.willChange = "transform, opacity";
        } else if (heroInner && reducedMotion) {
            heroInner.style.transform = "";
            heroInner.style.opacity = "";
            heroInner.style.willChange = "";
        }

        panels.forEach((panel) => {
            const centerY = getLayoutTop(panel) + panel.offsetHeight / 2 - window.scrollY;
            const signedDistance = (centerY - focusY) / (viewportHeight * 0.85);
            const distance = Math.abs(signedDistance);
            const proximity = Math.max(0, Math.min(1, 1 - distance));
            // Le panneau arrive depuis la profondeur, se redresse au centre,
            // puis repart en perspective. Le signe conserve le sens haut/bas.
            const scale = reducedMotion ? 1 : 0.28 + proximity * 0.72;
            const translateY = reducedMotion ? 0 : -signedDistance * viewportHeight * (1 - proximity * 0.15);
            const rotateX = reducedMotion ? 0 : Math.max(-32, Math.min(32, signedDistance * 34));
            const translateZ = reducedMotion ? 0 : -1100 * (1 - proximity);
            const opacity = reducedMotion ? 1 : 0.58 + proximity * 0.42;
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
            const targetY = getLayoutTop(panel) - 94;
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