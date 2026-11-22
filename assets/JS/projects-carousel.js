"use strict";

(() => {
    const carousel = document.querySelector("[data-projects-carousel]");
    const scene = carousel?.querySelector("[data-carousel-scene]");
    const cards = scene ? [...scene.querySelectorAll("[data-carousel-card]")] : [];
    const previous = carousel?.querySelector("[data-carousel-prev]");
    const next = carousel?.querySelector("[data-carousel-next]");
    const status = carousel?.querySelector("[data-carousel-status]");
    if (!carousel || !scene || cards.length < 2 || !previous || !next) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mobileScreen = window.matchMedia("(max-width: 760px), (max-height: 500px) and (pointer: coarse)");
    const step = (Math.PI * 2) / cards.length;
    const speed = step / 11;
    const manualPause = 5000; // Les flèches laissent cinq secondes pour regarder le projet.
    const hoverPause = 2000; // Un survol laisse deux secondes avant la reprise.
    const travelDuration = 750;
    const hoverTravelDuration = 950;
    const mobileHold = 3000; // Sur mobile, chaque projet reste affiché trois secondes.
    const mobileTravelDuration = 800;
    const hoverMaxAngle = Math.PI * 0.28; // Uniquement les cartes à moins d'environ 50° du centre.

    let position = 0;
    let transition = null;
    let pausedUntil = 0;
    let mobileNextAt = 0;
    let hoveredCard = null;
    let hoverEndsAt = 0;
    let lastPointerPosition = null;
    let lastHoverPosition = null;
    let frame = 0;
    let lastFrameTime = 0;
    let visible = !("IntersectionObserver" in window);
    let touchStart = null;

    const normalizeAngle = angle =>
        ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    const projectIndex = index => ((index % cards.length) + cards.length) % cards.length;

    // On mesure les cartes dans leur taille normale, sans le zoom de perspective.
    // Refaire la mesure à chaque image ferait varier le rayon pendant la rotation.
    let radius = 0;
    let depth = 0;
    function measureRing() {
        // Sur téléphone, les cartes utilisent une disposition linéaire en profondeur.
        // Le calcul du grand cercle ne sert que sur ordinateur.
        if (mobileScreen.matches) return;
        const cardWidth = cards[0].offsetWidth || scene.clientWidth * 0.44;
        // Un anneau plus large empêche les cartes voisines de se superposer.
        // Le rayon reste adapté à la place disponible sur mobile.
        radius = Math.min(scene.clientWidth * 0.78, Math.max(cardWidth * 1.45, scene.clientWidth * 0.47));
        depth = Math.max(260, Math.min(900, cardWidth * 1.32));

        // On garde les cartes dans le champ de la caméra, même sur un petit écran.
        // La vérification tient compte de leur largeur et de leur rotation en 3D.
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

    // Le téléphone montre une seule grande carte et un aperçu des voisines.
    // Les centres suivent des emplacements espacés : aucune carte ne recouvre
    // sa voisine, y compris à mi-chemin entre deux projets.
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
            card.style.opacity = String(visible ? Math.max(0.48, 1 - distanceFromCenter * 0.35) : 0);
            card.style.visibility = visible ? "visible" : "hidden";
            card.style.zIndex = String(Math.round(100 - distanceFromCenter * 30));

            const nearCenter = distanceFromCenter <= 0.42;
            card.style.pointerEvents = nearCenter ? "auto" : "none";
            card.inert = !nearCenter;
            card.setAttribute("aria-hidden", String(!nearCenter));
        });
    }

    // Sur ordinateur, les cartes gardent le véritable anneau 3D.
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

            // Le même angle pilote la position sur le cercle et la rotation Y.
            card.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rotation.toFixed(2)}deg)`;
            // Les dos restent visibles au fond et passent derrière les cartes proches.
            card.style.opacity = String(0.46 + 0.54 * (cos + 1) / 2);
            card.style.zIndex = String(Math.round(100 + cos * 50));

            // Les côtés lointains et les dos restent visibles, mais ne réagissent
            // pas au pointeur. Seules les cartes proches de l'avant sont interactives.
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

        // Une carte ne peut pas retenir la rotation au-delà des deux secondes.
        if (hoveredCard && now >= hoverEndsAt) clearHover();

        if (transition) {
            const progress = Math.min(1, (now - transition.started) / transition.duration);
            const eased = progress * progress * (3 - 2 * progress);
            position = transition.from + (transition.to - transition.from) * eased;
            if (progress === 1) {
                transition = null;
                // Après un changement, le projet reste entièrement visible.
                if (mobileScreen.matches) mobileNextAt = now + mobileHold;
            }
        } else if (mobileScreen.matches && !reducedMotion) {
            // Sur téléphone, on avance d'un projet à la fois plutôt que de défiler sans arrêt.
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
        } else if (!reducedMotion && now >= pausedUntil) {
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
        // Les flèches ont priorité sur le survol, sans prolongation involontaire.
        clearHover();
        lastHoverPosition = null;
        const base = Math.round((transition ? transition.to : position) / step);
        const target = (base + direction) * step;
        const now = performance.now();
        // Le glissement au doigt suit la même cadence que l'automatisme mobile.
        // Sur ordinateur, les flèches gardent leurs cinq secondes de pause.
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
        move(event.key === "ArrowRight" ? 1 : -1);
    });

    // On suit les vrais mouvements de souris, pas les cartes qui passent sous un
    // pointeur immobile. Cela évite les recentrages en boucle et les à-coups.
    if (finePointer && !reducedMotion) {
        scene.addEventListener("pointermove", event => {
            if (event.pointerType === "touch") return;
            const now = performance.now();
            const pointer = { x: event.clientX, y: event.clientY };
            const previousPosition = lastPointerPosition;
            lastPointerPosition = pointer;

            // Les micro-mouvements et les événements générés par l'animation
            // ne doivent pas sélectionner une autre carte.
            if (previousPosition && Math.hypot(pointer.x - previousPosition.x, pointer.y - previousPosition.y) < 2) return;

            const candidate = event.target.closest?.("[data-carousel-card]");
            const selected = cards.includes(candidate) ? candidate : null;

            if (hoveredCard) {
                if (selected === hoveredCard) {
                    const surface = hoveredCard.querySelector("[data-carousel-surface]");
                    const bounds = hoveredCard.getBoundingClientRect();
                    if (surface && bounds.width > 0 && bounds.height > 0) {
                        const nx = Math.max(-1, Math.min(1, ((pointer.x - bounds.left) / bounds.width - 0.5) * 2));
                        const ny = Math.max(-1, Math.min(1, ((pointer.y - bounds.top) / bounds.height - 0.5) * 2));
                        surface.style.setProperty("--tilt-x", `${(-ny * 10).toFixed(1)}deg`);
                        surface.style.setProperty("--tilt-y", `${(nx * 11).toFixed(1)}deg`);
                        surface.style.setProperty("--pointer-x", `${((nx + 1) * 50).toFixed(1)}%`);
                        surface.style.setProperty("--pointer-y", `${((ny + 1) * 50).toFixed(1)}%`);
                    }
                } else {
                    // La carte peut passer hors du pointeur pendant son recentrage.
                    // On enlève l'inclinaison, mais on conserve le délai initial.
                    const surface = hoveredCard.querySelector("[data-carousel-surface]");
                    if (surface) {
                        surface.style.removeProperty("--tilt-x");
                        surface.style.removeProperty("--tilt-y");
                    }
                }
                return;
            }

            // La pause automatique n'empêche jamais de sélectionner une carte
            // proche du centre, y compris juste après avoir utilisé une flèche.
            if (!selected) return;

            // Après les deux secondes, un vrai déplacement de souris est nécessaire
            // pour sélectionner de nouveau une carte.
            if (lastHoverPosition && Math.hypot(pointer.x - lastHoverPosition.x, pointer.y - lastHoverPosition.y) < 40) return;

            const index = cards.indexOf(selected);
            const angle = normalizeAngle(index * step - position);
            if (mobileScreen.matches) {
                const fraction = angle / step;
                if (Math.abs(fraction) > 0.42) return;
            } else if (Math.abs(angle) > hoverMaxAngle) {
                return;
            }

            hoveredCard = selected;
            lastHoverPosition = pointer;
            hoverEndsAt = now + hoverPause;
            // Un survol n'écourte pas les cinq secondes de pause des flèches.
            pausedUntil = Math.max(pausedUntil, hoverEndsAt);
            selected.classList.add("is-hovered");
            transition = {
                from: position,
                to: position + angle,
                started: now,
                duration: hoverTravelDuration
            };
            startLoop();
        }, { passive: true });

        scene.addEventListener("pointerleave", () => {
            clearHover();
            lastPointerPosition = null;
            lastHoverPosition = null;
            // On ne prolonge pas le délai : la reprise reste à deux secondes.
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
        else {
            // L'onglet ne rattrape pas les rotations manquées pendant son absence.
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
    window.addEventListener("resize", () => { measureRing(); render(); }, { passive: true });
    // Évite un ancien rayon si la fenêtre passe du mobile au bureau (ou inversement).
    mobileScreen.addEventListener?.("change", () => {
        // On se replace sur un projet entier lors d'un changement d'orientation.
        position = Math.round(position / step) * step;
        transition = null;
        mobileNextAt = 0;
        measureRing();
        render();
    });
    measureRing();
    render();
    startLoop();
})();
