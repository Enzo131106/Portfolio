"use strict";

/* GSAP pilote l'introduction et les transitions réversibles entre sections. */
(() => {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const cue = document.querySelector(".hero-scroll");
    const scenes = Array.from(document.querySelectorAll("[data-scroll-scene-content]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let released = false;
    let started = false;

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
        if (reduced) return;
        // On n'installe les animations de scroll qu'après l'introduction :
        // elles ne peuvent ainsi plus écraser l'état du hero au retour en haut.
        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
            if (hero && heroInner) {
                gsap.fromTo(heroInner,
                    { scale: 1, autoAlpha: 1, z: 0 },
                    {
                        scale: 2.7, autoAlpha: 0, z: 650, ease: "none",
                        immediateRender: false,
                        scrollTrigger: {
                            trigger: hero,
                            start: "top top",
                            end: "bottom 25%",
                            scrub: 0.65,
                            invalidateOnRefresh: true,
                            onLeaveBack: () => gsap.set(heroInner, { autoAlpha: 1 })
                        }
                    }
                );
            }

            scenes.forEach((visual) => {
                const section = visual.closest("[data-scroll-scene]");
                if (!section) return;
                gsap.fromTo(visual,
                    { scale: 0.18, z: -1100, autoAlpha: 0 },
                    {
                        scale: 1, z: 0, autoAlpha: 1, ease: "none",
                        immediateRender: false,
                        scrollTrigger: {
                            trigger: section,
                            start: "top bottom",
                            end: "top 28%",
                            scrub: 0.75,
                            invalidateOnRefresh: true
                        }
                    }
                );
            });
            ScrollTrigger.refresh();
        });
    }

    function intro() {
        if (started) return;
        started = true;
        if (reduced || !heroInner) {
            gsap.set(heroInner, { clearProps: "all" });
            release();
            return;
        }
        // Travelling d'entrée volontairement ample et progressif (~2,8 s).
        gsap.timeline({
            onComplete: () => {
                gsap.set(heroInner, { clearProps: "transform,opacity,visibility" });
                release();
                setupScroll();
            }
        })
            .fromTo(heroInner,
                { scale: 0.18, z: -1100, autoAlpha: 0, transformOrigin: "center center" },
                { scale: 1, z: 0, autoAlpha: 1, duration: 2.65, ease: "power2.inOut" }
            )
            .fromTo(cue,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.55, ease: "power2.out", clearProps: "opacity,visibility" },
                "-=0.45"
            );
    }

    window.addEventListener("portfolio-loader-hiding", intro, { once: true });
    if (reduced) {
        intro();
    }
    // Secours si le loader a déjà disparu avant l'installation de l'écouteur.
    if (!document.getElementById("loading-screen") && !started) intro();
})();
