"use strict";

// Le scroll est natif ; GSAP ne déplace les plans que sur l'axe de profondeur.
(() => {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const project = document.querySelector("#projects");
    const projectInner = project?.querySelector("[data-scroll-scene-content]");
    const cue = document.querySelector(".hero-scroll");
    const main = document.querySelector("main");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shortScreen = window.innerHeight < 480;
    let introStarted = false;
    let released = false;

    // Three.js utilise ce même objet pour faire avancer le vortex en rythme.
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

    // Sans GSAP ou avec le mouvement réduit, les contenus restent dans leur mise en page normale.
    if (!window.gsap || !window.ScrollTrigger || !hero || !heroInner ||
        !project || !projectInner || !main || reducedMotion || shortScreen) {
        motion.intro = 1;
        motion.scroll = 0;
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Les contenus sont placés dans un plateau fixe : les sections restent dans le flux pour les ancres.
    const stage = document.createElement("div");
    stage.className = "depth-stage";
    const heroPanel = document.createElement("div");
    heroPanel.className = "depth-stage-panel depth-stage-panel--hero";
    const projectPanel = document.createElement("div");
    projectPanel.className = "depth-stage-panel depth-stage-panel--project";
    heroPanel.appendChild(heroInner);
    // La souris partage le plan de l'accueil pour avancer vers la caméra, pas glisser vers le haut.
    if (cue) heroPanel.appendChild(cue);
    projectPanel.appendChild(projectInner);
    stage.append(heroPanel, projectPanel);
    main.appendChild(stage);

    // Les projets démarrent loin de la caméra pour ne pas apparaître avant le scroll.
    gsap.set(projectInner, {
        z: -850,
        scale: 0.32,
        autoAlpha: 0,
        transformOrigin: "center center"
    });

    // Une seule timeline pilote les deux plans et la caméra ; remonter rejoue le même trajet à l'envers.
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

        // L'accueil avance puis quitte le champ, sans translation verticale.
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
            // La souris suit la profondeur de l'accueil et peut sortir du cadre par le bas.
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

        // Les projets arrivent du fond au centre de l'écran.
        story.to(projectInner, {
            z: 0,
            scale: 1,
            autoAlpha: 1,
            duration: 0.65
        }, 0.35);

        ScrollTrigger.refresh();
    }

    // L'intro démarre quand le loader commence à disparaître, pour laisser voir le mouvement du fond.
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
    if (!document.getElementById("loading-screen")) startIntro();
})();
