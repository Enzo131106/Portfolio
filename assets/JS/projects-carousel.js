"use strict";

(() => {
    const carousel = document.querySelector("[data-projects-carousel]");
    const scene = carousel?.querySelector("[data-carousel-scene]");
    const cards = scene ? [...scene.querySelectorAll("[data-carousel-card]")] : [];
    const previous = carousel?.querySelector("[data-carousel-prev]");
    const next = carousel?.querySelector("[data-carousel-next]");
    const current = carousel?.querySelector("[data-carousel-current]");
    const status = carousel?.querySelector("[data-carousel-status]");
    if (!carousel || !scene || cards.length < 2 || !previous || !next) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (Math.PI * 2) / cards.length;
    const speed = step / 11; // Environ onze secondes entre deux projets.
    const manualPause = 7000; // Sept secondes sans rotation après une flèche.
    const travelDuration = 750;
    let position = 0;
    let transition = null;
    let pausedUntil = 0;
    let frame = 0;
    let lastFrameTime = 0;
    let visible = !("IntersectionObserver" in window);
    let activeIndex = -1;
    let touchStart = null;

    function normalizeAngle(angle) {
        return ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    }

    function projectIndex(value) {
        return ((value % cards.length) + cards.length) % cards.length;
    }

    // Les cartes suivent une ellipse : celle de face est au premier plan,
    // les autres reculent sur les côtés. La rotation ne dépend pas du scroll.
    function render() {
        const radius = Math.min(400, scene.clientWidth * 0.39);
        const depth = Math.min(320, Math.max(190, scene.clientWidth * 0.31));
        const front = projectIndex(Math.round(position / step));

        for (let index = 0; index < cards.length; index++) {
            const angle = normalizeAngle(index * step - position);
            const cos = Math.cos(angle);
            const x = Math.sin(angle) * radius;
            const z = (cos - 1) * depth;
            const tilt = -Math.sin(angle) * 19;
            const scale = 0.88 + (cos + 1) * 0.06;
            const opacity = Math.min(1, Math.max(0, (cos + 1) / 1.55));
            const card = cards[index];

            card.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${tilt.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
            card.style.opacity = String(opacity);
            card.style.zIndex = String(Math.round(100 + cos * 50));
        }

        if (front !== activeIndex) {
            activeIndex = front;
            cards.forEach((card, index) => {
                card.setAttribute("aria-hidden", String(index !== front));
                card.inert = index !== front;
            });
            if (current) current.textContent = String(front + 1).padStart(2, "0");
        }
    }

    function stopLoop() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        lastFrameTime = 0;
    }

    function loop(now) {
        frame = 0;
        if (!visible || document.hidden) {
            stopLoop();
            return;
        }

        const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0;
        lastFrameTime = now;

        if (transition) {
            const progress = Math.min(1, (now - transition.started) / travelDuration);
            const eased = 1 - Math.pow(1 - progress, 3);
            position = transition.from + (transition.to - transition.from) * eased;
            if (progress === 1) transition = null;
        } else if (!reducedMotion && now >= pausedUntil) {
            position += dt * speed;
        }

        render();
        // Une seule boucle, active uniquement quand la section est visible.
        frame = window.requestAnimationFrame(loop);
    }

    function startLoop() {
        if (!visible || document.hidden || frame) return;
        lastFrameTime = 0;
        frame = window.requestAnimationFrame(loop);
    }

    // Les flèches déplacent d'une carte et mettent l'automatisme en pause.
    // Une nouvelle interaction relance le délai de sept secondes.
    function move(direction) {
        const base = Math.round((transition ? transition.to : position) / step);
        const target = (base + direction) * step;
        const now = performance.now();
        pausedUntil = now + manualPause;

        if (reducedMotion) {
            transition = null;
            position = target;
            render();
        } else {
            transition = { from: position, to: target, started: now };
            startLoop();
        }

        if (status) {
            const selected = projectIndex(base + direction);
            status.textContent = `Projet ${selected + 1} sur ${cards.length}`;
        }
    }

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    carousel.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
    });

    // Un glissement horizontal change de projet sans bloquer le scroll vertical.
    scene.addEventListener("touchstart", event => {
        const touch = event.changedTouches[0];
        touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }, { passive: true });

    scene.addEventListener("touchend", event => {
        if (!touchStart) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - touchStart.x;
        const dy = touch.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            move(dx < 0 ? 1 : -1);
        }
    }, { passive: true });

    scene.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });

    if ("IntersectionObserver" in window) {
        // Le scroll sert seulement à économiser les calculs hors de la section.
        // Il ne change jamais la position du carrousel.
        const observer = new IntersectionObserver(entries => {
            visible = entries[0].intersectionRatio > 0.25;
            if (visible) startLoop();
            else stopLoop();
        }, { threshold: [0, 0.25, 0.5] });
        observer.observe(document.querySelector("#projects"));
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopLoop();
        else startLoop();
    });
    window.addEventListener("resize", render, { passive: true });
    render();
    startLoop();
})();
