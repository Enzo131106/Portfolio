"use strict";

/* Scrollytelling piloté par GSAP + ScrollTrigger, sans caméra Three.js liée au scroll. */
(() => {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const cue = document.querySelector(".hero-scroll");
    const scenes = gsap.utils.toArray("[data-scroll-scene-content]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const release = () => {
        document.body.classList.remove("hero-intro-pending");
        cue?.classList.add("is-ready");
        window.dispatchEvent(new Event("portfolio-hero-arrived"));
    };

    if (!window.gsap || !window.ScrollTrigger) {
        release();
        return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const motion = gsap.matchMedia();

    const intro = () => {
        if (reduced || !heroInner) {
            gsap.set(heroInner, { clearProps: "transform,opacity" });
            release();
            return;
        }
        gsap.timeline({ onComplete: release })
            .fromTo(heroInner,
                { scale: 0.78, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 1.2, ease: "power3.out", clearProps: "transform,opacity" })
            .fromTo(cue, { autoAlpha: 0, y: -12 },
                { autoAlpha: 1, y: 0, duration: .5, clearProps: "transform,opacity" }, "-=.35");
    };

    // L'introduction démarre lorsque l'écran de chargement s'efface.
    window.addEventListener("portfolio-loader-hiding", intro, { once: true });
    if (reduced) release();

    if (!reduced) {
        motion.add("(min-width: 761px)", () => {
            if (hero && heroInner) {
                gsap.to(heroInner, {
                    scale: 1.28, autoAlpha: 0, ease: "none",
                    scrollTrigger: {
                        trigger: hero, start: "top top", end: "bottom 20%",
                        scrub: .8, invalidateOnRefresh: true
                    }
                });
            }
            scenes.forEach((visual) => {
                gsap.fromTo(visual,
                    { scale: .76, y: 110, autoAlpha: 0 },
                    { scale: 1, y: 0, autoAlpha: 1, ease: "none",
                      scrollTrigger: {
                          trigger: visual.closest("[data-scroll-scene]"),
                          start: "top 95%", end: "top 35%",
                          scrub: .8, invalidateOnRefresh: true
                      }
                    });
            });
        });
        motion.add("(max-width: 760px)", () => {
            scenes.forEach((visual) => {
                gsap.from(visual, {
                    y: 45, autoAlpha: 0, duration: .8, ease: "power2.out",
                    scrollTrigger: { trigger: visual, start: "top 90%", toggleActions: "play none none reverse" }
                });
            });
        });
    }
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
})();
