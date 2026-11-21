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
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const step = (Math.PI * 2) / cards.length;
    const speed = step / 11;
    const manualPause = 7000;
    const travelDuration = 750;

    let position = 0;
    let transition = null;
    let pausedUntil = 0;
    let hoveredCard = null;
    let frame = 0;
    let lastFrameTime = 0;
    let visible = !("IntersectionObserver" in window);
    let activeIndex = -1;
    let touchStart = null;

    const normalizeAngle = angle =>
        ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    const projectIndex = index => ((index % cards.length) + cards.length) % cards.length;

    // Chaque carte tourne autour du même centre et regarde vers l'extérieur
    // de l'anneau : devant elle est lisible, sur les côtés elle apparaît de profil.
    function render() {
        const cardWidth = cards[0].getBoundingClientRect().width || scene.clientWidth * 0.44;
        const radius = Math.min(scene.clientWidth * 0.42, Math.max(cardWidth * 0.84, scene.clientWidth * 0.29));
        const depth = Math.max(220, Math.min(550, cardWidth * 0.9));
        const front = projectIndex(Math.round(position / step));

        cards.forEach((card, index) => {
            const angle = normalizeAngle(index * step - position);
            const cos = Math.cos(angle);
            const x = Math.sin(angle) * radius;
            const z = (cos - 1) * depth;
            const rotation = angle * (180 / Math.PI);

            // Le même angle pilote la position sur le cercle et la rotation Y.
            card.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rotation.toFixed(2)}deg)`;
            card.style.opacity = String(Math.max(0, Math.min(1, (cos + 0.12) * 1.55)));
            card.style.zIndex = String(Math.round(100 + cos * 50));

            const readable = cos > 0.2;
            card.style.pointerEvents = readable ? "auto" : "none";
            card.inert = !readable;
            card.setAttribute("aria-hidden", String(!readable));
        });

        if (front !== activeIndex) {
            activeIndex = front;
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
        } else if (!reducedMotion && !hoveredCard && now >= pausedUntil) {
            position += dt * speed;
        }

        render();
        frame = window.requestAnimationFrame(loop);
    }

    function startLoop() {
        if (!visible || document.hidden || frame) return;
        lastFrameTime = 0;
        frame = window.requestAnimationFrame(loop);
    }

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

        if (status) status.textContent = `Projet ${projectIndex(base + direction) + 1} sur ${cards.length}`;
    }

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    carousel.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
    });

    // On incline le contenu, pas la carte qui tourne autour du carrousel.
    // Les deux rotations ne se remplacent donc jamais.
    if (finePointer && !reducedMotion) {
        cards.forEach(card => {
            const surface = card.querySelector("[data-carousel-surface]");
            if (!surface) return;

            card.addEventListener("pointerenter", event => {
                if (event.pointerType === "touch") return;
                hoveredCard = card;
                card.classList.add("is-hovered");
            });

            card.addEventListener("pointermove", event => {
                if (hoveredCard !== card || event.pointerType === "touch") return;
                const bounds = card.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return;

                const nx = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
                const ny = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
                surface.style.setProperty("--tilt-x", `${(-ny * 10).toFixed(1)}deg`);
                surface.style.setProperty("--tilt-y", `${(nx * 11).toFixed(1)}deg`);
                surface.style.setProperty("--pointer-x", `${((nx + 1) * 50).toFixed(1)}%`);
                surface.style.setProperty("--pointer-y", `${((ny + 1) * 50).toFixed(1)}%`);
            });

            card.addEventListener("pointerleave", () => {
                if (hoveredCard === card) hoveredCard = null;
                card.classList.remove("is-hovered");
                surface.style.removeProperty("--tilt-x");
                surface.style.removeProperty("--tilt-y");
                surface.style.removeProperty("--pointer-x");
                surface.style.removeProperty("--pointer-y");
            });
        });
    }

    // Sur mobile, un geste horizontal change de carte sans intercepter le scroll vertical.
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
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
    }, { passive: true });
    scene.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });

    // La visibilité sert seulement à économiser le rendu hors de la section.
    if ("IntersectionObserver" in window) {
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
