"use strict";

(() => {
    const carousel = document.querySelector("[data-projects-carousel]");
    const scene = carousel?.querySelector("[data-carousel-scene]");
    const cards = scene ? [...scene.querySelectorAll("[data-carousel-card]")] : [];
    const previous = carousel?.querySelector("[data-carousel-prev]");
    const next = carousel?.querySelector("[data-carousel-next]");
    const status = carousel?.querySelector("[data-carousel-status]");
    const pauseButton = carousel?.querySelector("[data-carousel-pause]");
    const pauseSymbol = pauseButton?.querySelector("[data-pause-symbol]");
    const pauseLabel = pauseButton?.querySelector("[data-pause-label]");
    if (!carousel || !scene || cards.length < 2 || !previous || !next || !pauseButton || !pauseSymbol) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionPreference.matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mobileScreen = window.matchMedia("(max-width: 760px), (max-height: 500px) and (pointer: coarse)");
    const step = (Math.PI * 2) / cards.length;
    const speed = step / 11;
    const manualPause = 5000;
    const hoverPause = 2000;
    const travelDuration = 750;
    const hoverTravelDuration = 720;
    const hoverIntentDelay = 85;
    const hoverReleaseDelay = 120;
    const mobileHold = 3000;
    const mobileTravelDuration = 800;
    const hoverMaxAngle = Math.min(Math.PI * 0.42, step * 1.2);

    let rotationPaused = reducedMotion;
    let position = 0;
    let transition = null;
    let pausedUntil = 0;
    let mobileNextAt = 0;
    let hoveredCard = null;
    let lastPointerPosition = null;
    let hoverIntent = null;
    let frame = 0;
    let lastFrameTime = 0;
    let visible = !("IntersectionObserver" in window);
    let touchStart = null;

    const normalizeAngle = angle =>
        ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    const projectIndex = index => ((index % cards.length) + cards.length) % cards.length;

    let radius = 0;
    let depth = 0;
    function measureRing() {
        if (mobileScreen.matches) return;
        const cardWidth = cards[0].offsetWidth || scene.clientWidth * 0.44;
        radius = Math.min(scene.clientWidth * 0.78, Math.max(cardWidth * 1.45, scene.clientWidth * 0.47));
        depth = Math.max(260, Math.min(900, cardWidth * 1.32));

        const viewport = window.innerWidth || scene.clientWidth;
        const perspective = Math.max(1100, Math.min(2000, viewport * 0.9));
        const limit = viewport / 2 - Math.max(12, Math.min(22, viewport * 0.015));
        const halfWidth = cardWidth / 2;

        function fits(nextRadius) {
            for (let degree = 0; degree <= 180; degree += 4) {
                const angle = degree * Math.PI / 180;
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);
                for (const edge of [-halfWidth, halfWidth]) {
                    const x = nextRadius * sin + edge * cos;
                    const z = (cos - 1) * depth - edge * sin;
                    if (Math.abs(x * perspective / (perspective - z)) > limit) return false;
                }
            }
            return true;
        }

        if (!fits(radius)) {
            let minRadius = 0;
            let maxRadius = radius;
            for (let attempt = 0; attempt < 14; attempt++) {
                const middle = (minRadius + maxRadius) / 2;
                if (fits(middle)) minRadius = middle;
                else maxRadius = middle;
            }
            radius = minRadius;
        }
    }

    function renderMobile() {
        const cardWidth = cards[0].offsetWidth || scene.clientWidth * 0.73;
        const gap = Math.max(18, Math.min(30, scene.clientWidth * 0.065));
        const distance = cardWidth + gap;
        const current = position / step;
        const halfCount = cards.length / 2;

        cards.forEach((card, index) => {
            const offset = ((index - current + halfCount) % cards.length + cards.length) % cards.length - halfCount;
            const distanceFromCenter = Math.abs(offset);
            const visible = distanceFromCenter < 1.35;
            const x = offset * distance;
            const z = -Math.min(distanceFromCenter, 1.35) * 135;
            const rotation = -Math.max(-1.35, Math.min(1.35, offset)) * 35;

            card.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rotation.toFixed(2)}deg)`;
            card.style.opacity = String(visible ? Math.max(0.86, 1 - distanceFromCenter * 0.12) : 0);
            card.style.visibility = visible ? "visible" : "hidden";
            card.style.zIndex = String(Math.round(100 - distanceFromCenter * 30));

            const nearCenter = distanceFromCenter <= 0.42;
            card.style.pointerEvents = nearCenter ? "auto" : "none";
            card.inert = !nearCenter;
            card.setAttribute("aria-hidden", String(!nearCenter));
        });
    }

    function render() {
        if (mobileScreen.matches) {
            renderMobile();
            return;
        }

        cards.forEach((card, index) => {
            card.style.visibility = "visible";
            const angle = normalizeAngle(index * step - position);
            const cos = Math.cos(angle);
            const x = Math.sin(angle) * radius;
            const z = (cos - 1) * depth;
            const rotation = angle * (180 / Math.PI);

            card.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rotation.toFixed(2)}deg)`;
            card.style.opacity = String(0.84 + 0.16 * (cos + 1) / 2);
            card.style.zIndex = String(Math.round(100 + cos * 50));

            const nearCenter = Math.abs(angle) <= hoverMaxAngle;
            card.style.pointerEvents = nearCenter ? "auto" : "none";
            card.inert = !nearCenter;
            card.setAttribute("aria-hidden", String(!nearCenter));
        });

    }

    function clearHover() {
        if (!hoveredCard) return;
        const card = hoveredCard;
        const surface = card.querySelector("[data-carousel-surface]");
        card.classList.remove("is-hovered");
        if (surface) {
            for (const property of ["--tilt-x", "--tilt-y", "--pointer-x", "--pointer-y"]) {
                surface.style.removeProperty(property);
            }
        }
        hoveredCard = null;
    }

    function updateTilt(card, pointer) {
        if (!card || !pointer) return;
        const surface = card.querySelector("[data-carousel-surface]");
        const bounds = card.getBoundingClientRect();
        if (!surface || !bounds.width || !bounds.height) return;

        const nx = Math.max(-1, Math.min(1, ((pointer.x - bounds.left) / bounds.width - 0.5) * 2));
        const ny = Math.max(-1, Math.min(1, ((pointer.y - bounds.top) / bounds.height - 0.5) * 2));
        surface.style.setProperty("--tilt-x", `${(-ny * 10).toFixed(1)}deg`);
        surface.style.setProperty("--tilt-y", `${(nx * 11).toFixed(1)}deg`);
        surface.style.setProperty("--pointer-x", `${((nx + 1) * 50).toFixed(1)}%`);
        surface.style.setProperty("--pointer-y", `${((ny + 1) * 50).toFixed(1)}%`);
    }

    function queueHover(card, now) {
        if (card === hoveredCard) {
            hoverIntent = null;
            return;
        }
        if (hoverIntent?.card === card) return;
        hoverIntent = { card, at: now + (card ? hoverIntentDelay : hoverReleaseDelay) };
    }

    function applyHoverIntent(now) {
        if (!hoverIntent || transition || now < hoverIntent.at) return;
        const card = hoverIntent.card;
        hoverIntent = null;

        if (!card) {
            clearHover();
            pausedUntil = Math.max(pausedUntil, now + hoverPause);
            return;
        }

        const angle = normalizeAngle(cards.indexOf(card) * step - position);
        const limit = mobileScreen.matches ? step * 0.42 : hoverMaxAngle;
        if (Math.abs(angle) > limit) return;

        clearHover();
        hoveredCard = card;
        card.classList.add("is-hovered");

        if (Math.abs(angle) < 0.002) {
            position += angle;
            updateTilt(card, lastPointerPosition);
            return;
        }

        transition = {
            from: position,
            to: position + angle,
            started: now,
            duration: Math.max(360, hoverTravelDuration * Math.min(1, Math.abs(angle) / step)),
            hover: true
        };
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

        if (!rotationPaused) applyHoverIntent(now);

        if (transition) {
            const progress = Math.max(0, Math.min(1, (now - transition.started) / transition.duration));
            const eased = transition.hover
                ? 1 - Math.pow(1 - progress, 3)
                : progress * progress * (3 - 2 * progress);
            position = transition.from + (transition.to - transition.from) * eased;
            if (progress === 1) {
                const wasHover = transition.hover;
                transition = null;
                if (wasHover) {
                    render();
                    updateTilt(hoveredCard, lastPointerPosition);
                }
                if (mobileScreen.matches) mobileNextAt = now + mobileHold;
            }
        } else if (mobileScreen.matches && !rotationPaused && !reducedMotion && !hoveredCard && !hoverIntent) {
            if (!mobileNextAt) mobileNextAt = now + mobileHold;
            if (now >= mobileNextAt) {
                const nextIndex = Math.round(position / step) + 1;
                transition = {
                    from: position,
                    to: nextIndex * step,
                    started: now,
                    duration: mobileTravelDuration
                };
                mobileNextAt = 0;
            }
        } else if (!mobileScreen.matches && !rotationPaused && !reducedMotion && !hoveredCard && !hoverIntent && now >= pausedUntil) {
            position += dt * speed;
        }

        render();
        if (!rotationPaused || transition) frame = window.requestAnimationFrame(loop);
    }

    function startLoop() {
        if (!visible || document.hidden || frame || (rotationPaused && !transition)) return;
        lastFrameTime = 0;
        frame = window.requestAnimationFrame(loop);
    }

    function updatePauseButton() {
        const label = rotationPaused ? "Reprendre la rotation automatique" : "Mettre en pause la rotation automatique";
        pauseButton.setAttribute("aria-label", label);
        pauseButton.title = label;
        if (pauseLabel) pauseLabel.textContent = rotationPaused ? "Reprendre" : "Pause";
        pauseSymbol.setAttribute("d", rotationPaused ? "M9 5l11 7-11 7Z" : "M9 5v14M15 5v14");
        carousel.classList.toggle("is-paused", rotationPaused);
    }

    function pauseRotation(card = null) {
        rotationPaused = true;
        transition = null;
        hoverIntent = null;
        lastPointerPosition = null;
        clearHover();
        position = card
            ? position + normalizeAngle(cards.indexOf(card) * step - position)
            : Math.round(position / step) * step;
        mobileNextAt = 0;
        stopLoop();
        updatePauseButton();
        render();
    }

    pauseButton.addEventListener("click", () => {
        if (!rotationPaused) {
            pauseRotation();
        } else {
            rotationPaused = false;
            pausedUntil = 0;
            mobileNextAt = 0;
            updatePauseButton();
            startLoop();
        }
    });

    carousel.addEventListener("focusin", event => {
        const card = event.target.closest?.("[data-carousel-card]");
        if (cards.includes(card)) {
            if (!rotationPaused || transition) pauseRotation(card);
        } else if (!rotationPaused && event.target.matches(":focus-visible")) {
            pauseRotation();
        }
    });

    function move(direction) {
        clearHover();
        hoverIntent = null;
        lastPointerPosition = null;
        const base = Math.round((transition ? transition.to : position) / step);
        const target = (base + direction) * step;
        const now = performance.now();
        if (mobileScreen.matches) {
            mobileNextAt = 0;
            pausedUntil = 0;
        } else {
            pausedUntil = now + manualPause;
        }

        if (reducedMotion) {
            transition = null;
            position = target;
            render();
        } else {
            transition = { from: position, to: target, started: now, duration: travelDuration };
            startLoop();
        }

        if (status) status.textContent = `Projet ${projectIndex(base + direction) + 1} sur ${cards.length}`;
    }

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    carousel.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        if (!rotationPaused) pauseRotation();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        if (event.target.closest?.("[data-carousel-card]")) {
            (direction === 1 ? next : previous).focus({ preventScroll: true });
        }
        move(direction);
    });

    if (finePointer) {
        scene.addEventListener("pointermove", event => {
            if (rotationPaused || reducedMotion || event.pointerType === "touch") return;
            const now = performance.now();
            const pointer = { x: event.clientX, y: event.clientY };
            const previousPosition = lastPointerPosition;
            lastPointerPosition = pointer;

            if (previousPosition && pointer.x === previousPosition.x && pointer.y === previousPosition.y) return;

            if (transition) return;

            const candidate = event.target.closest?.("[data-carousel-card]");
            const selected = cards.includes(candidate) ? candidate : null;

            if (selected === hoveredCard && hoveredCard) {
                hoverIntent = null;
                updateTilt(hoveredCard, pointer);
                return;
            }

            if (selected) {
                const angle = normalizeAngle(cards.indexOf(selected) * step - position);
                const limit = mobileScreen.matches ? step * 0.42 : hoverMaxAngle;
                if (Math.abs(angle) > limit) return;
            }

            if (selected || hoveredCard || hoverIntent) {
                queueHover(selected, now);
                startLoop();
            }
        }, { passive: true });

        scene.addEventListener("pointerleave", event => {
            if (transition?.hover && lastPointerPosition &&
                event.clientX === lastPointerPosition.x && event.clientY === lastPointerPosition.y) return;

            hoverIntent = null;
            if (hoveredCard) {
                clearHover();
                pausedUntil = Math.max(pausedUntil, performance.now() + hoverPause);
            }
            lastPointerPosition = null;
        });
    }

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

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            visible = entries[0].intersectionRatio > 0.25;
            if (visible) startLoop();
            else {
                clearHover();
                hoverIntent = null;
                lastPointerPosition = null;
                stopLoop();
            }
        }, { threshold: [0, 0.25, 0.5] });
        observer.observe(document.querySelector("#projects"));
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearHover();
            lastPointerPosition = null;
            hoverIntent = null;
            stopLoop();
        }
        else {
            if (mobileScreen.matches) {
                if (transition) {
                    position = transition.to;
                    transition = null;
                }
                mobileNextAt = 0;
                render();
            }
            startLoop();
        }
    });
    function measureCards() {
        const height = Math.max(...cards.map(card => card.offsetHeight));
        const value = height + "px";
        if (scene.style.getPropertyValue("--carousel-card-height") !== value) {
            scene.style.setProperty("--carousel-card-height", value);
        }
    }

    if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(measureCards);
        cards.forEach(card => observer.observe(card));
    }
    document.fonts?.ready.then(measureCards);
    window.addEventListener("resize", () => { measureCards(); measureRing(); render(); }, { passive: true });
    mobileScreen.addEventListener?.("change", () => {
        clearHover();
        hoverIntent = null;
        lastPointerPosition = null;
        position = Math.round(position / step) * step;
        transition = null;
        mobileNextAt = 0;
        measureRing();
        render();
    });
    motionPreference.addEventListener?.("change", () => {
        reducedMotion = motionPreference.matches;
        if (reducedMotion) {
            pauseRotation();
            if (document.activeElement === pauseButton) previous.focus({ preventScroll: true });
        }
        pauseButton.hidden = reducedMotion;
    });
    carousel.classList.add("is-ready");
    updatePauseButton();
    pauseButton.hidden = reducedMotion;
    measureCards();
    measureRing();
    render();
    startLoop();
})();
