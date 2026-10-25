/* Effet de travelling piloté par le scroll : les sections avancent comme le hero. */
(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = document.querySelector("#accueil");
    const heroInner = hero?.querySelector(".hero-inner");
    const scenes = Array.from(document.querySelectorAll("[data-scroll-scene]"));

    let introFinished = reducedMotion;
    let frame = 0;

    window.addEventListener("portfolio-hero-arrived", () => {
        introFinished = true;
        schedule();
    }, { once: true });

    const clamp01 = (value) => Math.max(0, Math.min(1, value));

    const update = () => {
        frame = 0;
        const vh = window.innerHeight || 1;

        if (hero && heroInner && introFinished && !reducedMotion) {
            const progress = clamp01((-hero.getBoundingClientRect().top) / Math.max(1, hero.offsetHeight * 0.82));
            heroInner.style.transformOrigin = "center center";
            heroInner.style.transform = `scale(${(1 + progress * 2.4).toFixed(3)})`;
            heroInner.style.opacity = clamp01(1 - Math.max(0, progress - 0.62) / 0.38).toFixed(3);
            heroInner.style.willChange = "transform, opacity";
        }

        scenes.forEach((scene) => {
            const visual = scene.querySelector("[data-scroll-scene-content]");
            if (!visual || reducedMotion) return;

            const rect = scene.getBoundingClientRect();
            // Progression continue sur toute la section, sans animation individuelle
            // des cartes : le contenu entier suit le même travelling que le hero.
            const progress = clamp01((vh - rect.top) / Math.max(vh, rect.height));
            const scale = 1 + progress * 1.35;
            const opacity = clamp01(1 - Math.max(0, progress - 0.52) / 0.48);
            visual.style.transformOrigin = "center center";
            visual.style.transform = `scale(${scale.toFixed(3)})`;
            visual.style.opacity = opacity.toFixed(3);
            visual.style.willChange = "transform, opacity";
        });
    };

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
})();