"use strict";

/*
 * Scrollytelling 100 % profondeur :
 * un plateau fixe reste centré dans le viewport pendant le scroll.
 * GSAP anime uniquement scale / translateZ / opacité ; jamais X ou Y.
 * Les sections restent dans le flux pour garder les ancres et le scroll natif.
 */
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

    // L'objet partagé est également utilisé par la caméra du fond Three.js.
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

    // Pas de mise en scène fixe lorsque GSAP est indisponible,
    // lorsque le mouvement réduit est demandé ou sur un écran très bas.
    if (!window.gsap || !window.ScrollTrigger || !hero || !heroInner ||
        !project || !projectInner || !main || reducedMotion || shortScreen) {
        motion.intro = 1;
        motion.scroll = 0;
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Déplace uniquement les contenus visuels, sans toucher aux sections
    // #accueil et #projects : elles restent des repères de défilement natif.
    // Le plateau est frère des sections, pas leur descendant : il n'est jamais
    // entraîné vers le haut par le scroll ni par leur CSS perspective.
    const stage = document.createElement("div");
    stage.className = "depth-stage";
    const heroPanel = document.createElement("div");
    heroPanel.className = "depth-stage-panel depth-stage-panel--hero";
    const projectPanel = document.createElement("div");
    projectPanel.className = "depth-stage-panel depth-stage-panel--project";
    heroPanel.appendChild(heroInner);
    // Dans le même plan 3D que l'accueil : au départ près du bas,
    // puis projetée vers la caméra jusqu'à sortir du viewport.
    // On ne l'ancre pas au scroll natif : cela la ferait remonter verticalement.
    if (cue) heroPanel.appendChild(cue);
    projectPanel.appendChild(projectInner);
    stage.append(heroPanel, projectPanel);
    main.appendChild(stage);

    // Le contenu Projets ne peut pas surgir à l'écran avant le premier scroll.
    gsap.set(projectInner, {
        z: -850,
        scale: 0.32,
        autoAlpha: 0,
        transformOrigin: "center center"
    });

    function setupScroll() {
        // Une seule timeline, une seule plage, et zéro translation verticale.
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

        // Le vortex se déplace exactement au rythme des contenus.
        story.to(motion, { scroll: 1, duration: 1 }, 0);

        // Accueil : le plan traverse la caméra en grossissant depuis le centre.
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

        // Même travelling en Z et même zoom que le bloc Accueil.
        // La perspective du plateau projette la souris hors de l'écran
        // PAR LE BAS, sans la remonter ou la masquer prématurément par opacité.
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

        // Projets : arrivée de loin, toujours au CENTRE du même viewport.
        story.to(projectInner, {
            z: 0,
            scale: 1,
            autoAlpha: 1,
            duration: 0.65
        }, 0.35);

        // Quand on remonte, GSAP rejoue exactement la trajectoire inverse.
        ScrollTrigger.refresh();
    }

    function startIntro() {
        if (introStarted) return;
        introStarted = true;

        // Le déplacement du vortex et l'apparition du hero ont même durée.
        gsap.timeline({
            onComplete() {
                // Le plateau fixe conserve sa position, sans saut entre intro et scroll.
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
