"use strict";

// Une scène fixe, pilotée par le défilement natif.

function initializeScrollDepth() {
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const project = document.querySelector("#projects");
    const projectInner = project?.querySelector("[data-depth-content]");
    const projectTitle = projectInner?.querySelector(".projects-title");
    const projectBody = projectInner?.querySelector("[data-projects-carousel]");
    const projectScene = projectBody?.querySelector("[data-carousel-scene]");
    const projectCards = projectScene ? [...projectScene.querySelectorAll("[data-carousel-card]")] : [];
    const parcours = document.querySelector("#parcours");
    const parcoursInner = parcours?.querySelector("[data-depth-content]");
    const parcoursTitle = parcoursInner?.querySelector(".parcours-title");
    const contact = document.querySelector("#contact");
    const cue = document.querySelector(".hero-scroll");
    const main = document.querySelector("main");
    const navbar = document.querySelector(".navbar");
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
        !project || !projectInner || !projectTitle || !projectBody ||
        !parcours || !parcoursInner || !parcoursTitle || !contact ||
        !main || !viewport || !track || !line || !steps.length ||
        reducedMotion || shortScreen) {
        motion.intro = 1;
        motion.scroll = 0;
        release();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

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

    const titleDistant = { scale: 0.78, autoAlpha: 0 };
    const titleArrived = { scale: 1, autoAlpha: 1 };
    const titleDeparted = { scale: 1.06, autoAlpha: 0 };

    gsap.set([projectBody, viewport], { ...distant, transformOrigin: "center center" });
    gsap.set([projectTitle, parcoursTitle], { ...titleDistant, transformOrigin: "center top" });
    projectPanel.inert = true;
    parcoursPanel.inert = true;

    const timelineMotion = { progress: 0 };
    const playhead = { value: 0 };
    const moveLine = gsap.quickTo(line, "scaleX", {
        duration: 0.75,
        ease: "power2.out"
    });
    let lineTarget = 0;
    const bounds = { start: 0, project: 0, parcours: 0, exit: 0, end: 0 };
    const entries = steps.map(step => {
        const entry = step.querySelector(".parcours-entry");
        return {
            step,
            entry,
            center: 0,
            width: 0,
            setOpacity: gsap.quickSetter(entry, "opacity"),
            setY: gsap.quickSetter(entry, "y", "px")
        };
    });
    let viewportWidth = 0;
    let compactParcours = false;
    let horizontalDistance = 0;
    let exitLength = 0;
    let story;

    function syncSafeArea() {
        const bottom = navbar?.getBoundingClientRect().bottom || 0;
        const safeTop = Math.max(0, Math.ceil(bottom) + 10);
        const value = safeTop + "px";
        if (stage.style.getPropertyValue("--depth-safe-top") !== value) {
            stage.style.setProperty("--depth-safe-top", value);
        }
    }

    function centerParcours() {
        const height = Math.max(...entries.map(item => item.entry.offsetHeight));
        const value = Math.ceil(height) + "px";
        if (parcoursInner.style.getPropertyValue("--parcours-entry-height") !== value) {
            parcoursInner.style.setProperty("--parcours-entry-height", value);
        }
    }

    function layoutTop(element) {
        let top = 0;
        for (let node = element; node; node = node.offsetParent) {
            top += node.offsetTop;
        }
        return top;
    }

    function positionTitle(title, body, contentTop) {
        const margin = parseFloat(getComputedStyle(title).marginBottom) || 0;
        const normalBottom = layoutTop(body) - margin;
        const gap = Math.max(22, Math.min(36, stage.clientWidth * 0.022));
        const offset = Math.max(0, Math.floor(contentTop - normalBottom - gap));
        const value = offset + "px";

        if (title.style.getPropertyValue("--section-title-offset") !== value) {
            title.style.setProperty("--section-title-offset", value);
        }
    }

    function syncTitlePositions() {
        const mobile = window.matchMedia("(max-width: 760px)").matches;

        if (mobile) {
            const cardHeight = Math.max(0, ...projectCards.map(card => card.offsetHeight));
            const value = cardHeight + "px";
            if (projectBody.style.getPropertyValue("--project-card-height") !== value) {
                projectBody.style.setProperty("--project-card-height", value);
            }

            for (const title of [projectTitle, parcoursTitle]) {
                if (title.style.getPropertyValue("--section-title-offset") !== "0px") {
                    title.style.setProperty("--section-title-offset", "0px");
                }
            }
            return;
        }

        if (projectScene && projectCards.length) {
            const cardHeight = Math.max(...projectCards.map(card => card.offsetHeight));
            const contentTop = layoutTop(projectScene) + (projectScene.clientHeight - cardHeight) / 2;
            positionTitle(projectTitle, projectBody, contentTop);
        }

        const contentTop = Math.min(
            layoutTop(line.parentElement),
            ...entries.map(item => layoutTop(item.entry))
        );
        positionTitle(parcoursTitle, viewport, contentTop);
    }

    function measure() {
        syncSafeArea();
        centerParcours();
        syncTitlePositions();
        viewportWidth = viewport.clientWidth;
        compactParcours = window.matchMedia("(max-width: 760px), (max-height: 480px) and (orientation: landscape)").matches;
        horizontalDistance = Math.max(0, track.offsetWidth - viewportWidth);
        entries.forEach(item => {
            item.center = item.step.offsetLeft + item.step.offsetWidth / 2;
            item.width = item.entry.offsetWidth;
        });
        const height = hero.offsetHeight || window.innerHeight;
        const revealLength = compactParcours
            ? Math.max(height * 1.5, height * steps.length * 0.5, horizontalDistance * 1.35)
            : Math.max(height * 1.5, height * steps.length * 0.68, horizontalDistance * 1.45);
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

    function animateParcours(shift) {
        const center = viewportWidth / 2;
        const readableDistance = viewportWidth * (compactParcours ? 0.32 : 0.23);

        entries.forEach(item => {
            const distance = Math.abs(item.center - shift - center);
            const outerDistance = center + item.width / 2;
            const t = gsap.utils.clamp(0, 1,
                (distance - readableDistance) / Math.max(1, outerDistance - readableDistance)
            );
            const fade = t * t * (3 - 2 * t);

            item.setOpacity(1 - fade);
            item.setY(fade * (compactParcours ? 12 : 22));
        });
    }

    function updateLine(progress, immediate = false) {
        if (immediate) {
            moveLine.tween.pause();
            gsap.set(line, { scaleX: progress });
            lineTarget = progress;
        } else if (progress !== lineTarget) {
            lineTarget = progress;
            moveLine(progress);
        }
    }

    function renderStory(immediate = false) {
        if (!story) return;
        const time = playhead.value;
        story.time(time);
        const progress = timelineMotion.progress;
        const shift = horizontalDistance * progress;
        gsap.set(track, { x: -shift });
        updateLine(progress, immediate);
        animateParcours(shift);

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

        story.fromTo(projectBody, distant, { ...arrived, duration: 0.65, immediateRender: false }, 0.35);
        story.fromTo(projectTitle, titleDistant, { ...titleArrived, duration: 0.35, immediateRender: false }, 0.65);
        story.to(motion, { scroll: 1, duration: 1 }, 0);

        story.fromTo(projectTitle, titleArrived, { ...titleDeparted, duration: 0.22, immediateRender: false }, 1.25);
        story.fromTo(projectBody, arrived, { ...departed, duration: 0.55, immediateRender: false }, 1.25);
        story.fromTo(viewport, distant, { ...arrived, duration: 0.6, immediateRender: false }, 1.4);
        story.fromTo(parcoursTitle, titleDistant, { ...titleArrived, duration: 0.35, immediateRender: false }, 1.65);
        story.to(motion, { scroll: 1.55, duration: 0.75 }, 1.25);

        // Le déplacement en profondeur reste immobile pendant la chronologie.
        story.fromTo(timelineMotion, { progress: 0 }, {
            progress: 1, duration: 0.85, immediateRender: false
        }, 2);

        story.fromTo(parcoursTitle, titleArrived, { ...titleDeparted, duration: 0.22, immediateRender: false }, 3);
        story.fromTo(viewport, arrived, { ...departed, duration: 0.65, immediateRender: false }, 3);
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
                renderStory(true);
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

    if ("ResizeObserver" in window) {
        const layoutObserver = new ResizeObserver(() => {
            syncSafeArea();
            centerParcours();
            syncTitlePositions();
        });
        if (navbar) layoutObserver.observe(navbar);
        if (projectScene) layoutObserver.observe(projectScene);
        projectCards.forEach(card => layoutObserver.observe(card));
        layoutObserver.observe(viewport);
        entries.forEach(item => layoutObserver.observe(item.entry));
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
