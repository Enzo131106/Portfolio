"use strict";

(() => {
    // Récupérer les éléments de l'interface utilisés par le jeu.
    const canvas = document.getElementById("byte-invaders-canvas");
    const screen = document.getElementById("arcade-screen");
    const overlay = document.getElementById("arcade-overlay");
    const startButton = document.getElementById("arcade-start");
    const shareScoreButton = document.getElementById("arcade-share-score");
    const downloadScoreButton = document.getElementById("arcade-download-score");
    const overlayTitle = document.getElementById("arcade-overlay-title");
    const overlayCopy = document.getElementById("arcade-overlay-copy");
    const statusText = document.getElementById("arcade-status-text");
    const scoreText = document.getElementById("arcade-score");
    const bestText = document.getElementById("arcade-best");
    const livesText = document.getElementById("arcade-lives");
    const ctx = canvas && canvas.getContext("2d");
    if (!canvas || !ctx || !screen) return;

    // Centraliser les commandes et l’état courant de la partie.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const keys = new Set();
    const pointerControls = new Set();
    const state = {
        running: false, gameOver: false, score: 0, lives: 3, wave: 1,
        player: { x: 0.5, y: 0.88, width: 22, height: 16, speed: 300, cooldown: 0 },
        bullets: [], enemies: [], particles: [], lastTime: 0, enemyDirection: 1,
        enemySpeed: 20, enemyFireTimer: 1.1, invulnerable: 0, animationId: 0
    };
    let width = 600;
    let height = 340;
    let dpr = 1;
    let best = 0;
    try { best = Number(localStorage.getItem("byteInvadersBest")) || 0; } catch (_) { /* stockage facultatif */ }
    bestText.textContent = formatScore(best);

    // Afficher les scores comme des nombres entiers, sans zéros superflus.
    function formatScore(value) { return String(Math.max(0, Math.floor(Number(value) || 0))); }
    // Adapter la résolution du canvas à sa taille réelle et à l’écran.
    function resize() {
        // offsetWidth/offsetHeight ignorent le scale CSS du travelling : le jeu conserve
        // ses vraies dimensions même pendant l’introduction du hero.
        const layoutWidth = screen.offsetWidth;
        const layoutHeight = screen.offsetHeight;
        if (!layoutWidth || !layoutHeight) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = layoutWidth;
        height = layoutHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        state.player.width = Math.max(15, Math.min(23, width * 0.045));
        state.player.height = state.player.width * 0.72;
        if (!state.running) {
            state.player.x = width / 2;
            state.player.y = height * 0.88;
            draw();
        }
    }
    // Synchroniser les informations visibles avec l’état de la partie.
    function updateHud() {
        scoreText.textContent = formatScore(state.score);
        livesText.textContent = state.lives > 0 ? Array.from({ length: state.lives }, () => "♥").join(" ") : "—";
        livesText.setAttribute("aria-label", state.lives + (state.lives > 1 ? " vies" : " vie"));
        bestText.textContent = formatScore(best);
    }
    // Créer une formation d’ennemis pour la vague en cours.
    function createWave() {
        state.enemies = [];
        const cols = Math.max(5, Math.min(9, Math.floor(width / 47)));
        const rows = 3;
        const gapX = Math.min(38, (width - 52) / cols);
        const gapY = Math.min(30, height * 0.09);
        const startX = (width - gapX * (cols - 1)) / 2;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                state.enemies.push({
                    x: startX + col * gapX, y: 34 + row * gapY,
                    row, col, width: 15, height: 12, phase: Math.random() * Math.PI * 2
                });
            }
        }
        state.enemyDirection = 1;
        state.enemySpeed = 19 + state.wave * 3;
        state.enemyFireTimer = Math.max(.45, 1.25 - state.wave * .06);
    }
    // Remettre à zéro les données nécessaires à une nouvelle partie.
    function resetGame() {
        state.score = 0; state.lives = 3; state.wave = 1;
        state.bullets = []; state.particles = [];
        // Recalibrer les deux coordonnées à partir des dimensions actuelles du canvas.
        state.player.x = width / 2; state.player.y = height * 0.88; state.player.cooldown = 0;
        state.enemyFireTimer = 1.1;
        state.invulnerable = 0; state.gameOver = false;
        createWave(); updateHud();
    }
    // Démarrer la partie et lancer la boucle d’animation.
    function startGame() {
        if (state.running) return;
        // Le hero peut avoir été transformé pendant le travelling : relire la taille de layout avant la partie.
        resize();
        resetGame();
        state.running = true;
        state.lastTime = performance.now();
        overlay.classList.remove("is-game-over");
        statusText.parentElement.classList.remove("is-game-over");
        overlay.classList.add("is-hidden");
        statusText.textContent = "PLAYING";
        startButton.textContent = "RESTART";
        cancelAnimationFrame(state.animationId);
        state.animationId = requestAnimationFrame(loop);
        canvas.focus({ preventScroll: true });
    }
    // Arrêter la partie, afficher le résultat et sauvegarder le record.
    function endGame(wonWave = false) {
        state.running = false;
        state.gameOver = true;
        cancelAnimationFrame(state.animationId);
        statusText.textContent = "GAME OVER";
        statusText.parentElement.classList.add("is-game-over");
        overlay.classList.add("is-game-over");
        overlayTitle.textContent = wonWave ? "WAVE CLEARED!" : "GAME OVER";
        overlayCopy.textContent = "Score : " + formatScore(state.score) + " · Relance une partie pour battre ton record.";
        startButton.textContent = "PLAY AGAIN";
        overlay.classList.remove("is-hidden");
        if (state.score > best) {
            best = state.score;
            bestText.textContent = formatScore(best);
            try { localStorage.setItem("byteInvadersBest", String(best)); } catch (_) { /* stockage facultatif */ }
        }
        updateHud();
    }
    // Ajouter des particules lors d’une collision ou d’un événement visuel.
    function addBurst(x, y, color, amount = 8) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 25 + Math.random() * 95;
            state.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: .25 + Math.random() * .35, maxLife: .6, color,
                size: 1 + Math.random() * 2.2
            });
        }
    }
    // Tirer si la partie est active et si le délai entre deux tirs est écoulé.
    function shoot() {
        if (!state.running || state.player.cooldown > 0) return;
        state.bullets.push({ x: state.player.x, y: state.player.y - 9, vy: -390, friendly: true });
        state.player.cooldown = .23;
    }
    // Mettre à jour les déplacements, tirs, collisions et progression.
    function update(dt) {
        const player = state.player;
        const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("q") || pointerControls.has("left");
        const right = keys.has("ArrowRight") || keys.has("d") || pointerControls.has("right");
        if (left) player.x -= player.speed * dt;
        if (right) player.x += player.speed * dt;
        player.x = Math.max(13, Math.min(width - 13, player.x));
        player.cooldown = Math.max(0, player.cooldown - dt);
        state.invulnerable = Math.max(0, state.invulnerable - dt);
        if (keys.has(" ") || pointerControls.has("shoot")) shoot();

        state.bullets.forEach(bullet => { bullet.y += bullet.vy * dt; });
        state.bullets = state.bullets.filter(bullet => bullet.y > -12 && bullet.y < height + 12);

        state.enemyFireTimer -= dt;
        if (state.enemyFireTimer <= 0 && state.enemies.length) {
            const shooters = state.enemies.filter(enemy => !state.enemies.some(other => other.col === enemy.col && other.y > enemy.y));
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            if (shooter) state.bullets.push({ x: shooter.x, y: shooter.y + 8, vy: 155 + state.wave * 8, friendly: false });
            state.enemyFireTimer = Math.max(.38, 1.15 - state.wave * .055) + Math.random() * .45;
        }

        let edgeHit = false;
        for (const enemy of state.enemies) {
            enemy.x += state.enemyDirection * state.enemySpeed * dt;
            enemy.phase += dt * 2;
            if (enemy.x > width - 17 || enemy.x < 17) edgeHit = true;
        }
        if (edgeHit) {
            state.enemyDirection *= -1;
            for (const enemy of state.enemies) enemy.y += 9;
        }

        for (let j = state.bullets.length - 1; j >= 0; j--) {
            const bullet = state.bullets[j];
            if (!bullet.friendly && state.invulnerable <= 0 && Math.abs(bullet.x - player.x) < 12 && Math.abs(bullet.y - player.y) < 13) {
                state.bullets.splice(j, 1);
                state.lives--;
                state.invulnerable = 1.25;
                addBurst(player.x, player.y, "#75ddff", 12);
                if (state.lives <= 0) { updateHud(); endGame(); return; }
                updateHud();
            }
        }

        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const enemy = state.enemies[i];
            if (enemy.y > player.y - 17) {
                state.lives = 0;
                updateHud();
                endGame();
                return;
            }
            for (let j = state.bullets.length - 1; j >= 0; j--) {
                const bullet = state.bullets[j];
                if (bullet.friendly && Math.abs(bullet.x - enemy.x) < 13 && Math.abs(bullet.y - enemy.y) < 12) {
                    state.bullets.splice(j, 1);
                    state.enemies.splice(i, 1);
                    state.score += (3 - enemy.row) * 10;
                    addBurst(enemy.x, enemy.y, enemy.row === 0 ? "#8e9dff" : "#55dfff");
                    break;
                }
            }
        }
        state.particles.forEach(p => {
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
            p.vx *= Math.max(0, 1 - dt * 2); p.vy *= Math.max(0, 1 - dt * 2);
        });
        state.particles = state.particles.filter(p => p.life > 0);

        if (!state.enemies.length) {
            state.wave++;
            createWave();
            state.enemySpeed += 7;
            addBurst(width / 2, height / 2, "#70dfff", 24);
        }
        updateHud();
    }
    // Dessiner le vaisseau du joueur sur le canvas.
    function drawShip(x, y) {
        const w = state.player.width;
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#39cfff";
        ctx.fillStyle = "#eafaff";
        ctx.strokeStyle = "#4edcff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -state.player.height);
        ctx.lineTo(w * .72, state.player.height * .65);
        ctx.lineTo(w * .28, state.player.height * .42);
        ctx.lineTo(-w * .28, state.player.height * .42);
        ctx.lineTo(-w * .72, state.player.height * .65);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    // Dessiner un ennemi selon sa rangée et sa couleur.
    function drawEnemy(enemy) {
        const s = Math.max(8, Math.min(13, width * .023));
        const color = enemy.row === 0 ? "#a5a3ff" : enemy.row === 1 ? "#63b8ff" : "#4de0ee";
        ctx.save();
        ctx.translate(enemy.x, enemy.y + Math.sin(enemy.phase) * 1.5);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 9;
        ctx.fillRect(-s * .55, -s * .3, s * 1.1, s * .55);
        ctx.fillRect(-s, 0, s * .45, s * .42);
        ctx.fillRect(s * .55, 0, s * .45, s * .42);
        ctx.fillRect(-s * .8, s * .42, s * .32, s * .25);
        ctx.fillRect(s * .48, s * .42, s * .32, s * .25);
        ctx.fillStyle = "#061326";
        ctx.fillRect(-s * .34, -s * .12, s * .16, s * .17);
        ctx.fillRect(s * .18, -s * .12, s * .16, s * .17);
        ctx.restore();
    }
    // Redessiner le fond, les entités et les effets visuels.
    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#040b18";
        ctx.fillRect(0, 0, width, height);
        const glow = ctx.createRadialGradient(width * .5, height * .72, 4, width * .5, height * .72, height * .7);
        glow.addColorStop(0, "rgba(13, 75, 139, .22)");
        glow.addColorStop(1, "rgba(3, 9, 20, 0)");
        ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(62, 135, 207, .075)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for (let y = 0; y < height; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

        if (state.running || state.gameOver) {
            state.enemies.forEach(drawEnemy);
            ctx.save();
            ctx.shadowColor = "#55dfff"; ctx.shadowBlur = 12;
            ctx.fillStyle = "#b6f4ff";
            state.bullets.forEach(b => ctx.fillRect(b.x - 1.3, b.y - 6, 2.6, 9));
            ctx.restore();
            state.particles.forEach(p => {
                ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
                ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            ctx.globalAlpha = 1;
            if (state.invulnerable <= 0 || Math.floor(performance.now() / 90) % 2 === 0) drawShip(state.player.x, state.player.y);
        } else {
            // Petit aperçu animé sans démarrer la partie.
            const t = reducedMotion ? 0 : performance.now() / 1000;
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 7; col++) {
                    drawEnemy({ x: width * .24 + col * width * .087, y: height * .32 + row * 28, row, phase: t + col });
                }
            }
            drawShip(width / 2 + Math.sin(t * .8) * width * .08, height * .82);
        }
    }
    // Boucle principale : calculer le temps écoulé, mettre à jour puis dessiner.
    function loop(now) {
        if (!state.running) return;
        const dt = Math.min((now - state.lastTime) / 1000 || 0, .035);
        state.lastTime = now;
        update(dt);
        draw();
        if (state.running) state.animationId = requestAnimationFrame(loop);
    }


    // Préparer le texte à copier ou à partager avec le score obtenu.
    function getScoreShareText() {
        return "J’ai marqué " + formatScore(state.score) + " points sur BYTE INVADERS ! Tu peux battre mon score ?\n" + window.location.href;
    }
    // Générer une image PNG du score pour le partage ou le téléchargement.
    function createScoreImageBlob() {
        return new Promise(resolve => {
            const exportCanvas = document.createElement("canvas");
            exportCanvas.width = 1200;
            exportCanvas.height = 630;
            const exportCtx = exportCanvas.getContext("2d");
            if (!exportCtx) { resolve(null); return; }
            const gradient = exportCtx.createLinearGradient(0, 0, 1200, 630);
            gradient.addColorStop(0, "#071329");
            gradient.addColorStop(1, "#10294a");
            exportCtx.fillStyle = gradient;
            exportCtx.fillRect(0, 0, 1200, 630);
            exportCtx.strokeStyle = "rgba(103, 209, 255, .22)";
            exportCtx.lineWidth = 1;
            for (let x = 0; x < 1200; x += 40) {
                exportCtx.beginPath(); exportCtx.moveTo(x, 0); exportCtx.lineTo(x, 630); exportCtx.stroke();
            }
            for (let y = 0; y < 630; y += 40) {
                exportCtx.beginPath(); exportCtx.moveTo(0, y); exportCtx.lineTo(1200, y); exportCtx.stroke();
            }
            exportCtx.fillStyle = "#72e2ff";
            exportCtx.font = "700 28px Inter, Arial, sans-serif";
            exportCtx.letterSpacing = "6px";
            exportCtx.fillText("BYTE INVADERS", 84, 112);
            exportCtx.fillStyle = "#f3f7ff";
            exportCtx.font = "700 34px Inter, Arial, sans-serif";
            exportCtx.letterSpacing = "0px";
            exportCtx.fillText("MON SCORE", 84, 220);
            exportCtx.fillStyle = "#ffffff";
            exportCtx.font = "800 118px Inter, Arial, sans-serif";
            exportCtx.fillText(formatScore(state.score), 78, 365);
            exportCtx.fillStyle = "#a8bdd9";
            exportCtx.font = "500 25px Inter, Arial, sans-serif";
            exportCtx.fillText("Et toi, tu peux faire mieux ?", 86, 440);
            exportCtx.fillStyle = "#72e2ff";
            exportCtx.font = "600 22px Inter, Arial, sans-serif";
            exportCtx.fillText("enzo131106.github.io/Portfolio/", 86, 555);
            exportCanvas.toBlob(resolve, "image/png");
        });
    }
    // Copier le texte du score avec une solution de repli pour les navigateurs anciens.
    async function copyScoreText(text) {
        // Clipboard API first, then a compatibility fallback for browsers that block it.
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (_) { /* essayer la méthode de compatibilité */ }
        }
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        let copied = false;
        try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
        textarea.remove();
        return copied;
    }

    // Partager le score : copie sur ordinateur, partage natif si disponible sur mobile.
    async function shareScore() {
        const text = getScoreShareText();
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Sur ordinateur, le bouton PARTAGER doit copier directement le texte.
        // Éviter navigator.share ici : il ouvre une fenêtre de partage et ne copie rien.
        if (!isMobile) {
            const copied = await copyScoreText(text);
            if (copied) {
                shareScoreButton.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> COPIÉ !';
                window.setTimeout(() => {
                    shareScoreButton.innerHTML = '<i class="bi bi-share" aria-hidden="true"></i> PARTAGER';
                }, 1800);
            } else {
                window.prompt("La copie automatique est bloquée. Fais Ctrl+C pour copier ce texte :", text);
            }
            return;
        }

        // Sur mobile, utiliser la feuille de partage native si elle existe.
        if (navigator.share) {
            try {
                const blob = await createScoreImageBlob();
                if (blob && typeof File !== "undefined") {
                    const file = new File([blob], "byte-invaders-score-" + state.score + ".png", { type: "image/png" });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ title: "Mon score BYTE INVADERS", text, files: [file] });
                        return;
                    }
                }
                await navigator.share({ title: "BYTE INVADERS — " + formatScore(state.score) + " points", text });
                return;
            } catch (error) {
                if (error && error.name === "AbortError") return;
            }
        }

        const copied = await copyScoreText(text);
        if (copied) {
            shareScoreButton.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> COPIÉ !';
            window.setTimeout(() => {
                shareScoreButton.innerHTML = '<i class="bi bi-share" aria-hidden="true"></i> PARTAGER';
            }, 1800);
        } else {
            window.prompt("La copie automatique est bloquée. Sélectionne puis copie ce texte :", text);
        }
    }
    // Télécharger la carte du score au format PNG.
    async function downloadScore() {
        const blob = await createScoreImageBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "byte-invaders-score-" + state.score + ".png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // Relier les boutons de l’interface aux actions correspondantes.
    if (shareScoreButton) shareScoreButton.addEventListener("click", shareScore);
    if (downloadScoreButton) downloadScoreButton.addEventListener("click", downloadScore);
    startButton.addEventListener("click", startGame);
    // Gérer les commandes clavier et empêcher le défilement pendant le jeu.
    window.addEventListener("keydown", event => {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        if (["ArrowLeft", "ArrowRight", " ", "ArrowUp", "ArrowDown"].includes(key)) event.preventDefault();
        if (key === "Enter" && !state.running) { startGame(); return; }
        keys.add(key);
    });
    window.addEventListener("keyup", event => {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        keys.delete(key);
    });
    window.addEventListener("blur", () => { keys.clear(); pointerControls.clear(); });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.running) { keys.clear(); pointerControls.clear(); }
    });
    // Gérer les commandes tactiles via les événements de pointeur.
    document.querySelectorAll("[data-game-control]").forEach(button => {
        const control = button.dataset.gameControl;
        const down = event => { event.preventDefault(); pointerControls.add(control); };
        const up = event => { event.preventDefault(); pointerControls.delete(control); };
        button.addEventListener("pointerdown", down);
        button.addEventListener("pointerup", up);
        button.addEventListener("pointercancel", up);
        button.addEventListener("pointerleave", up);
        button.addEventListener("contextmenu", event => event.preventDefault());
    });
    // Redimensionner le canvas puis afficher l’aperçu initial.
    window.addEventListener("resize", resize);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(screen);
    resize();
    draw();
})();
