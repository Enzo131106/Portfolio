"use strict";

// Une scène fixe, pilotée par le défilement natif.

function initializeScrollDepth() {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const project = document.querySelector("#projects");
    const projectInner = project?.querySelector("[data-depth-content]");
    const parcours = document.querySelector("#parcours");
    const parcoursInner = parcours?.querySelector("[data-depth-content]");
    const contact = document.querySelector("#contact");
    const cue = document.querySelector(".hero-scroll");
    const main = document.querySelector("main");
    const viewport = parcoursInner?.querySelector(".parcours-viewport");
    const track = parcoursInner?.querySelector(".parcours-track");
    const line = track?.querySelector(".parcours-line-fill");
    const steps = track ? [...track.querySelectorAll(".parcours-step")] : [];
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
        !project || !projectInner || !parcours || !parcoursInner || !contact ||
        !main || !viewport || !track || !line || !steps.length ||
        reducedMotion || shortScreen) {
        motion.intro = 1;
        motion.scroll = 0;
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const stage = document.createElement("div");
    stage.className = "depth-stage";

    function createPanel(name, content, title) {
        const panel = document.createElement("div");
        panel.className = "depth-stage-panel depth-stage-panel--" + name;
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", title);
        panel.appendChild(content);
        stage.appendChild(panel);
        return panel;
    }

    const heroPanel = createPanel("hero", heroInner, "hero-title");
    if (cue) heroPanel.appendChild(cue);
    const projectPanel = createPanel("project", projectInner, "projects-title");
    const parcoursPanel = createPanel("parcours", parcoursInner, "parcours-title");
    main.appendChild(stage);
    document.body.classList.add("depth-stage-active");

    const distant = { z: -850, scale: 0.32, autoAlpha: 0 };
    const arrived = { z: 0, scale: 1, autoAlpha: 1 };
    const departed = { z: 570, scale: 1.65, autoAlpha: 0 };

    gsap.set([projectInner, parcoursInner], { ...distant, transformOrigin: "center center" });
    projectPanel.inert = true;
    parcoursPanel.inert = true;

    const timelineMotion = { progress: 0 };
    const playhead = { value: 0 };
    const bounds = { start: 0, project: 0, parcours: 0, exit: 0, end: 0 };
    let horizontalDistance = 0;
    let exitLength = 0;
    let story;

    function measure() {
        horizontalDistance = Math.max(0, track.offsetWidth - viewport.clientWidth);
        const height = window.innerHeight;
        const revealLength = Math.max(height * 1.5, height * steps.length * 0.68, horizontalDistance * 1.45);
        exitLength = Math.max(height * 0.8, 320);
        parcours.style.setProperty("--parcours-scroll-length", Math.ceil(revealLength + exitLength) + "px");
    }

    function sectionTop(section) {
        return section.getBoundingClientRect().top + window.scrollY;
    }

    function updateBounds() {
        bounds.start = sectionTop(hero);
        bounds.project = sectionTop(project);
        bounds.parcours = sectionTop(parcours);
        bounds.end = sectionTop(contact);
        bounds.exit = Math.max(bounds.parcours + 1, bounds.end - exitLength);
    }

    function progressBetween(scroll, start, end) {
        return gsap.utils.clamp(0, 1, (scroll - start) / Math.max(1, end - start));
    }

    function scrollTime(scroll) {
        if (scroll < bounds.project) return progressBetween(scroll, bounds.start, bounds.project);
        if (scroll < bounds.parcours) return 1 + progressBetween(scroll, bounds.project, bounds.parcours);
        if (scroll < bounds.exit) return 2 + progressBetween(scroll, bounds.parcours, bounds.exit);
        return 3 + progressBetween(scroll, bounds.exit, bounds.end);
    }

    function renderStory() {
        if (!story) return;
        const time = playhead.value;
        story.time(time);
        const progress = timelineMotion.progress;
        gsap.set(track, { x: -horizontalDistance * progress });
        gsap.set(line, { scaleX: progress });

        // Les éléments invisibles ne doivent pas recevoir le focus.
        heroPanel.inert = time >= 0.65;
        projectPanel.inert = time < 0.72 || time >= 1.76;
        parcoursPanel.inert = time < 1.85 || time >= 3.65;
    }

    function setupScroll() {
        story = gsap.timeline({ paused: true, defaults: { ease: "none" } });

        story.fromTo(heroInner, arrived, { ...departed, duration: 0.65, immediateRender: false }, 0);
        if (cue) {
            story.fromTo(cue, arrived, { ...departed, duration: 0.65, immediateRender: false }, 0);
        }

        story.fromTo(projectInner, distant, { ...arrived, duration: 0.65, immediateRender: false }, 0.35);
        story.to(motion, { scroll: 1, duration: 1 }, 0);

        story.fromTo(projectInner, arrived, { ...departed, duration: 0.55, immediateRender: false }, 1.25);
        story.fromTo(parcoursInner, distant, { ...arrived, duration: 0.6, immediateRender: false }, 1.4);
        story.to(motion, { scroll: 1.55, duration: 0.75 }, 1.25);

        // Le déplacement en profondeur reste immobile pendant la chronologie.
        story.fromTo(timelineMotion, { progress: 0 }, {
            progress: 1, duration: 0.85, immediateRender: false
        }, 2);

        steps.forEach((step, index) => {
            if (!index) return;
            const entry = step.querySelector(".parcours-entry");
            const point = step.querySelector(".parcours-point");
            const start = 2 + (index / steps.length) * 0.78;
            gsap.set(entry, { autoAlpha: 0, y: 12 });
            gsap.set(point, { autoAlpha: 0 });
            story.to(entry, { autoAlpha: 1, y: 0, duration: 0.17, ease: "power2.out" }, start);
            story.to(point, { autoAlpha: 1, duration: 0.1 }, start);
        });

        story.fromTo(parcoursInner, arrived, { ...departed, duration: 0.65, immediateRender: false }, 3);
        story.to(motion, { scroll: 1.9, duration: 1 }, 3);

        const move = gsap.quickTo(playhead, "value", {
            duration: 0.35,
            ease: "power2.out",
            onUpdate: renderStory
        });

        measure();
        updateBounds();

        ScrollTrigger.create({
            trigger: hero,
            start: "top top",
            end: () => sectionTop(contact),
            onRefreshInit: measure,
            onRefresh(self) {
                updateBounds();
                move.tween.pause();
                playhead.value = scrollTime(self.scroll());
                renderStory();
            },
            onUpdate(self) {
                move(scrollTime(self.scroll()));
            }
        });

        ScrollTrigger.refresh();
        document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }

    function startIntro() {
        if (introStarted) return;
        introStarted = true;

        const intro = gsap.timeline({
            onComplete() {
                gsap.set(heroInner, arrived);
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
                ...arrived,
                duration: 2.65,
                ease: "power2.inOut"
            }, 0)
            .fromTo(motion, { intro: 0 }, {
                intro: 1,
                duration: 2.65,
                ease: "power2.inOut"
            }, 0);

        if (cue) {
            intro.fromTo(cue, { autoAlpha: 0 }, {
                autoAlpha: 1,
                duration: 0.55,
                ease: "power2.out",
                clearProps: "opacity,visibility"
            }, 2.2);
        }
    }

    measure();
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
