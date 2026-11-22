"use strict";

// La scène GSAP anime la profondeur sans remplacer le défilement natif.

function initializeScrollDepth() {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const project = document.querySelector("#projects");
    const projectInner = project?.querySelector("[data-depth-content]");
    const cue = document.querySelector(".hero-scroll");
    const main = document.querySelector("main");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shortScreen = window.innerHeight < 480;
    let introStarted = false;
    let released = false;

    const motion = window._portfolioMotion || (window._portfolioMotion = {
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

    if (!window.gsap || !window.ScrollTrigger || !hero || !heroInner ||
        !project || !projectInner || !main || reducedMotion || shortScreen) {
        motion.intro = 1;
        motion.scroll = 0;
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const stage = document.createElement("div");
    stage.className = "depth-stage";
    const heroPanel = document.createElement("div");
    heroPanel.className = "depth-stage-panel depth-stage-panel--hero";
    const projectPanel = document.createElement("div");
    projectPanel.className = "depth-stage-panel depth-stage-panel--project";
    heroPanel.appendChild(heroInner);
    if (cue) heroPanel.appendChild(cue);
    projectPanel.appendChild(projectInner);
    stage.append(heroPanel, projectPanel);
    main.appendChild(stage);

    gsap.set(projectInner, {
        z: -850,
        scale: 0.32,
        autoAlpha: 0,
        transformOrigin: "center center"
    });

    function setupScroll() {
        const story = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.35,
                invalidateOnRefresh: true
            }
        });

        story.to(motion, { scroll: 1, duration: 1 }, 0);

        story.fromTo(heroInner,
            { z: 0, scale: 1, autoAlpha: 1 },
            {
                z: 570,
                scale: 1.65,
                autoAlpha: 0,
                duration: 0.65,
                immediateRender: false
            }, 0
        );

        if (cue) {
            story.fromTo(cue,
                { z: 0, scale: 1, autoAlpha: 1 },
                {
                    z: 570,
                    scale: 1.65,
                    duration: 0.65,
                    immediateRender: false
                },
                0
            );
        }

        story.to(projectInner, {
            z: 0,
            scale: 1,
            autoAlpha: 1,
            duration: 0.65
        }, 0.35);

        ScrollTrigger.refresh();
    }

    function startIntro() {
        if (introStarted) return;
        introStarted = true;

        gsap.timeline({
            onComplete() {
                gsap.set(heroInner, { z: 0, scale: 1, autoAlpha: 1 });
                release();
                setupScroll();
            }
        })
            .fromTo(heroInner, {
                z: -1050,
                scale: 0.18,
                autoAlpha: 0,
                transformOrigin: "center center"
            }, {
                z: 0,
                scale: 1,
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
    window.addEventListener("portfolio-loader-hidden", startIntro, { once: true });
    const loadingScreen = document.getElementById("loading-screen");
    if (!loadingScreen || loadingScreen.classList.contains("is-hidden")) startIntro();
}

if (window._portfolioGsapReady) {
    window._portfolioGsapReady.then(initializeScrollDepth, initializeScrollDepth);
} else {
    initializeScrollDepth();
}
