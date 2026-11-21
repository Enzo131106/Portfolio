"use strict";

/*
 * Une seule progression GSAP / ScrollTrigger anime les deux sections
 * et le vortex Three.js. Aucun scroll forcé, pin ou snap :
 * le défilement natif reste entièrement réversible.
 */
(() => {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const project = document.querySelector("#projects");
    const projectInner = project?.querySelector("[data-scroll-scene-content]");
    const cue = document.querySelector(".hero-scroll");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    let introStarted = false;
    let released = false;

    // Lu par Three.js dans sa boucle de rendu, même si le module démarre après GSAP.
    window.__portfolioScrollProgress = 0;

    function release() {
        if (released) return;
        released = true;
        document.body.classList.remove("hero-intro-pending");
        cue?.classList.add("is-ready");
        window.dispatchEvent(new Event("portfolio-hero-arrived"));
    }

    if (!window.gsap || !window.ScrollTrigger) {
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    function setupScroll() {
        if (reducedMotion || !hero || !heroInner || !project || !projectInner) return;

        // L'effet démarre une fois l'introduction terminée, sans toucher au scroll natif.
        const story = gsap.timeline({
            defaults: { ease: "none" },
            onUpdate() {
                // Même playhead amorti pour les contenus ET les particules du fond.
                window.__portfolioScrollProgress = this.progress();
            },
            scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.35,
                invalidateOnRefresh: true
            }
        });

        story.to(heroInner, {
            scale: mobile ? 1.13 : 1.30,
            z: mobile ? 90 : 240,
            y: mobile ? -12 : -35,
            duration: 0.76
        }, 0);

        // Le texte s'efface progressivement, sans disparaître brutalement.
        story.to(heroInner, {
            autoAlpha: 0,
            duration: 0.36
        }, 0.41);

        // Le bloc est masqué dès le départ pour éviter son apparition
        // soudaine au moment où il entre dans le viewport.
        gsap.set(projectInner, {
            scale: mobile ? 0.82 : 0.68,
            z: mobile ? -150 : -360,
            y: mobile ? 48 : 90,
            autoAlpha: 0
        });
        story.to(projectInner, {
            scale: 1,
            z: 0,
            y: 0,
            autoAlpha: 1,
            duration: 0.69
        }, 0.29);

        // Fixe exactement la longueur de l'animation à celle de la transition.
        story.to({ position: 0 }, { position: 1, duration: 1 }, 0);

        // Pour les retours historiques et liens ancrés, synchronise l'état initial.
        story.scrollTrigger.refresh();
        window.__portfolioScrollProgress = story.progress();
    }

    function startIntro() {
        if (introStarted) return;
        introStarted = true;

        if (reducedMotion || !heroInner) {
            if (heroInner) gsap.set(heroInner, { clearProps: "transform,opacity,visibility" });
            release();
            return;
        }

        // Conserve le travelling d'entrée lent déjà validé.
        gsap.timeline({
            onComplete() {
                gsap.set(heroInner, { clearProps: "transform,opacity,visibility" });
                release();
                setupScroll();
            }
        })
            .fromTo(heroInner, {
                scale: 0.18,
                z: -1100,
                autoAlpha: 0,
                transformOrigin: "center center"
            }, {
                scale: 1,
                z: 0,
                autoAlpha: 1,
                duration: 2.65,
                ease: "power2.inOut"
            })
            .fromTo(cue, { autoAlpha: 0 }, {
                autoAlpha: 1,
                duration: 0.55,
                ease: "power2.out",
                clearProps: "opacity,visibility"
            }, "-=0.45");
    }

    window.addEventListener("portfolio-loader-hiding", startIntro, { once: true });
    if (reducedMotion) startIntro();
    if (!document.getElementById("loading-screen") && !introStarted) startIntro();
})();
