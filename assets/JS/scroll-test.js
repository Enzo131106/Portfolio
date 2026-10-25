/* Le contenu de chaque section suit le travelling du hero, piloté par le scroll et réversible. */
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
    const smooth = (value) => value * value * (3 - 2 * value);

    function update() {
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
            if (!visual) return;
            if (reducedMotion) {
                visual.style.transform = "";
                visual.style.opacity = "";
                visual.style.willChange = "";
                return;
            }

            const rect = scene.getBoundingClientRect();
            const atPageTop = window.scrollY <= 0;
            // Ignore l'élasticité du navigateur en haut de page : elle ne doit pas
            // déplacer visuellement la scène tant que le scroll réel reste à zéro.
            // Le contenu est d'abord loin, réduit et aligné sur le centre de l'écran.
            // En avançant dans la section, il grandit jusqu'à l'échelle normale.
            const travel = clamp01((vh * 0.92 - rect.top) / Math.max(vh * 0.9, rect.height * 0.72));
            const progress = smooth(travel);
            const scale = 0.18 + progress * 0.82;
            const centerY = atPageTop
                ? scene.offsetTop + scene.offsetHeight / 2
                : rect.top + rect.height / 2;
            const translateY = vh * 0.5 - centerY;
            const translateZ = -1200 * (1 - progress);
            const reveal = clamp01((progress - 0.06) / 0.28);
            const opacity = introFinished ? smooth(reveal) : 0;

            visual.style.transformOrigin = "center center";
            visual.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) scale(${scale.toFixed(3)})`;
            visual.style.opacity = opacity.toFixed(3);
            visual.style.willChange = "transform, opacity";
        });
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
})();