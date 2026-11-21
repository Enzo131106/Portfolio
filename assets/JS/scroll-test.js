"use strict";

/*
 * GSAP anime une seule traversée entre l'accueil et les projets.
 * Three.js lit la même progression que les sections, y compris à l'intro.
 * Le défilement du navigateur reste natif et entièrement réversible.
 */
(() => {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const project = document.querySelector("#projects");
    const projectInner = project?.querySelector("[data-scroll-scene-content]");
    const cue = document.querySelector(".hero-scroll");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    let introStarted = false;
    let released = false;

    // Objet partagé : la caméra WebGL suit exactement l'animation GSAP.
    // Ne jamais le remplacer : le module Three.js peut démarrer avant ou après.
    const motion = window.__portfolioMotion || (window.__portfolioMotion = {
        intro: 0,
        scroll: 0
    });

    function release() {
        if (released) return;
        released = true;
        document.body.classList.remove("hero-intro-pending");
        cue?.classList.add("is-ready");
        window.dispatchEvent(new Event("portfolio-hero-arrived"));
    }

    if (!window.gsap || !window.ScrollTrigger) {
        // CDN indisponible : afficher le contenu et le fond dans leur état normal.
        motion.intro = 1;
        motion.scroll = 0;
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    function setupScroll() {
        if (reducedMotion || !hero || !heroInner || !projectInner) return;

        // La section suivante reste à sa place dans le flux de la page :
        // aucun pin, snap, changement forcé de scroll ou déplacement vertical massif.
        gsap.set(projectInner, {
            scale: isMobile ? 0.94 : 0.85,
            z: isMobile ? 0 : -155,
            autoAlpha: 0,
            transformOrigin: "center center"
        });

        const story = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: isMobile ? 0.14 : 0.25,
                invalidateOnRefresh: true
            }
        });

        // Le vortex, l'accueil et les projets utilisent le MÊME playhead.
        story.to(motion, { scroll: 1, duration: 1 }, 0);

        // Le hero s'approche légèrement puis s'efface, sans zoom disproportionné.
        story.fromTo(heroInner,
            { scale: 1, z: 0, autoAlpha: 1 },
            {
                scale: isMobile ? 1.07 : 1.14,
                z: isMobile ? 0 : 90,
                autoAlpha: 0,
                duration: 0.67,
                immediateRender: false
            }, 0
        );

        // Le nouveau contenu apparaît uniquement lorsqu'il entre dans le champ.
        story.to(projectInner, {
            scale: 1,
            z: 0,
            autoAlpha: 1,
            duration: 0.54
        }, 0.43);

        // Liens d'ancrage, retour arrière navigateur et redimensionnement.
        ScrollTrigger.refresh();
    }

    function startIntro() {
        if (introStarted) return;
        introStarted = true;

        if (reducedMotion || !heroInner) {
            motion.intro = 1;
            motion.scroll = 0;
            if (heroInner) gsap.set(heroInner, {
                clearProps: "transform,opacity,visibility"
            });
            release();
            return;
        }

        // Le vortex avance pendant les mêmes 2,65 secondes que le contenu.
        gsap.timeline({
            onComplete() {
                gsap.set(heroInner, {
                    clearProps: "transform,opacity,visibility"
                });
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
            }, 0)
            .fromTo(motion, { intro: 0 }, {
                intro: 1,
                duration: 2.65,
                ease: "power2.inOut"
            }, 0)
            .fromTo(cue, { autoAlpha: 0 }, {
                autoAlpha: 1,
                duration: 0.55,
                ease: "power2.out",
                clearProps: "opacity,visibility"
            }, 2.2);
    }

    window.addEventListener("portfolio-loader-hiding", startIntro, { once: true });
    // Secours si le loader a déjà commencé à disparaître au chargement du script.
    window.addEventListener("portfolio-loader-hidden", startIntro, { once: true });
    if (reducedMotion) startIntro();
    if (!document.getElementById("loading-screen") && !introStarted) startIntro();
})();
