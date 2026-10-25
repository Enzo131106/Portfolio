"use strict";

import THREE from "./three-loader.js";

// Définit la valeur correspondant à un cercle complet en radians.
const FULL_CIRCLE = Math.PI * 2;

// Détermine le type d'appareil selon la largeur de l'écran.
const isMobile = window.innerWidth < 768;
const isTablet =
    window.innerWidth >= 768 &&
    window.innerWidth < 1024;

// Définit le nombre de caractères selon le type d'appareil.
const particleCount =
    isMobile ? 650 :
        isTablet ? 1100 :
            1600;

// Définit la taille globale des caractères selon le type d'appareil.
const particleSize =
    isMobile ? 100.0 :
        isTablet ? 110.0 :
            120.0;

// Initialise la scène principale qui contient tous les éléments 3D.
const scene = new THREE.Scene();

// Initialise la caméra avec une perspective 3D.
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// La caméra démarre loin du hero, puis traverse réellement le vortex.
const cameraStartZ = isMobile ? 30 : 34;
const cameraHeroZ = 5;
camera.position.z = cameraStartZ;

// Initialise le moteur de rendu WebGL.
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

// Adapte le rendu à la taille de la fenêtre.
renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

// Définit la résolution du rendu selon le type d'appareil.
const initialPixelRatio =
    isMobile ? 1.25 :
        isTablet ? 1.5 :
            1.5;

// Limite le pixel ratio pour préserver les performances.
renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        initialPixelRatio
    )
);

// Ajoute le canvas WebGL à la page.
renderer.domElement.id = "background";
document.body.prepend(renderer.domElement);

// Définit une couleur de secours pour le fond de la scène.
scene.background = new THREE.Color(0x050914);

// Crée un grand plan placé derrière tous les caractères.
const backgroundGeometry = new THREE.PlaneGeometry(
    200,
    120
);

// Crée un matériau personnalisé pour produire un dégradé animé.
const backgroundMaterial = new THREE.ShaderMaterial({

    // Transmet le temps au shader pour animer les couleurs.
    uniforms: {
        uTime: {
            value: 0
        }
    },

    // Désactive la profondeur pour garder le fond derrière les caractères.
    depthTest: false,
    depthWrite: false,

    // Calcule les coordonnées du fond.
    vertexShader: `
        varying vec2 vUv;

        void main() {

            // Transmet les coordonnées de la texture au fragment shader.
            vUv = uv;

            // Calcule la position du plan dans la scène.
            gl_Position =
                projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
        }
    `,

    // Produit un fond profond avec des zones lumineuses mouvantes.
    fragmentShader: `
        uniform float uTime;

        varying vec2 vUv;

        // Calcule une zone lumineuse diffuse.
        float lightSpot(
            vec2 uv,
            vec2 center,
            float radius
        ) {
            float distanceToCenter =
                length(uv - center);

            return exp(
                -distanceToCenter *
                distanceToCenter /
                radius
            );
        }

        void main() {

            // Centre les coordonnées pour répartir les lumières.
            vec2 uv = vUv;

            // Définit un fond bleu nuit presque noir.
            vec3 baseColor = vec3(
                0.008,
                0.015,
                0.040
            );

            // Anime lentement la position des zones lumineuses.
            float time = uTime * 0.10;

            vec2 blueCenter = vec2(
                0.28 + sin(time) * 0.12,
                0.62 + cos(time * 0.8) * 0.10
            );

            vec2 cyanCenter = vec2(
                0.76 + cos(time * 0.7) * 0.12,
                0.36 + sin(time * 0.9) * 0.12
            );

            vec2 violetCenter = vec2(
                0.52 + sin(time * 0.6) * 0.16,
                0.78 + cos(time * 0.7) * 0.08
            );

            // Calcule la force de chaque zone lumineuse.
            float blueLight = lightSpot(
                uv,
                blueCenter,
                0.075
            );

            float cyanLight = lightSpot(
                uv,
                cyanCenter,
                0.055
            );

            float violetLight = lightSpot(
                uv,
                violetCenter,
                0.10
            );

            // Ajoute des nuances colorées au fond.
            vec3 finalColor = baseColor;

            finalColor +=
                vec3(0.015, 0.075, 0.24) *
                blueLight;

            finalColor +=
                vec3(0.005, 0.10, 0.19) *
                cyanLight;

            finalColor +=
                vec3(0.045, 0.025, 0.16) *
                violetLight;

            // Assombrit les bords pour renforcer la profondeur.
            float edgeDistance =
                length((uv - 0.5) * vec2(1.0, 0.85));

            float vignette =
                smoothstep(0.25, 0.78, edgeDistance);

            finalColor *= 1.0 - vignette * 0.55;

            // Affiche le fond avec une opacité complète.
            gl_FragColor = vec4(
                finalColor,
                1.0
            );
        }
    `
});

// Place le fond très loin derrière le vortex.
const background = new THREE.Mesh(
    backgroundGeometry,
    backgroundMaterial
);

background.position.z = -45;

// Garantit que le fond soit dessiné avant les caractères.
background.renderOrder = -1;

// Ajoute le fond animé à la scène.
scene.add(background);

// Définit les caractères utilisés pour représenter les données.
const glyphs = [
    "0", "1", "{", "}", "<", ">", "/", ";"
];

// Définit le nombre de caractères différents disponibles.
const glyphCount = glyphs.length;

// Crée une texture regroupant tous les caractères dans une image.
const glyphCanvas = document.createElement("canvas");
const glyphContext = glyphCanvas.getContext("2d");

// Définit les dimensions de chaque cellule de la texture.
const glyphCellSize = 64;

glyphCanvas.width = glyphCellSize * glyphCount;
glyphCanvas.height = glyphCellSize;

// Prépare la texture transparente des caractères.
glyphContext.clearRect(
    0,
    0,
    glyphCanvas.width,
    glyphCanvas.height
);

// Définit une typographie nette et lisible.
glyphContext.font = "bold 46px monospace";
glyphContext.textAlign = "center";
glyphContext.textBaseline = "middle";
glyphContext.fillStyle = "#ffffff";

// Dessine chaque caractère dans sa propre cellule.
for (let i = 0; i < glyphCount; i++) {

    // Calcule le centre horizontal de la cellule actuelle.
    const x =
        i * glyphCellSize +
        glyphCellSize / 2;

    // Dessine le caractère au centre de sa cellule.
    glyphContext.fillText(
        glyphs[i],
        x,
        glyphCellSize / 2
    );
}

// Convertit l'image des caractères en texture GPU.
const glyphTexture = new THREE.CanvasTexture(
    glyphCanvas
);

// Indique que la texture contient des caractères transparents.
glyphTexture.colorSpace = THREE.SRGBColorSpace;

// Crée la structure géométrique des caractères.
const geometry = new THREE.BufferGeometry();

// Stocke les coordonnées 3D de chaque caractère.
const positions = new Float32Array(
    particleCount * 3
);

// Stocke la couleur de chaque caractère.
const colors = new Float32Array(
    particleCount * 3
);

// Stocke la taille individuelle de chaque caractère.
const sizes = new Float32Array(
    particleCount
);

// Stocke l'indice du caractère affiché par chaque particule.
const glyphIndices = new Float32Array(
    particleCount
);

// Stocke le décalage temporel individuel de chaque caractère.
const phases = new Float32Array(
    particleCount
);

// Définit une palette de néons bleus et cyan.
const dataColors = [
    new THREE.Color(0x168bff),
    new THREE.Color(0x00c8ff),
    new THREE.Color(0x3980ff),
    new THREE.Color(0x45f3ff),
    new THREE.Color(0x5b9dff),
    new THREE.Color(0x2870e8)
];

// Génère les positions, les couleurs et les caractères.
for (let i = 0; i < particleCount; i++) {

    // Permet d'accéder aux trois valeurs X, Y et Z.
    const i3 = i * 3;

    // Définit la profondeur du caractère dans le vortex.
    const z =
        (Math.random() - 0.5) * 30;

    // Définit l'angle du caractère autour de l'axe central.
    const angle =
        Math.random() * FULL_CIRCLE;

    // Définit la distance entre le caractère et le centre.
    const radius =
        2.5 + Math.random() * 4.5;

    // Ajoute une variation pour éviter une disposition trop régulière.
    const variation =
        (Math.random() - 0.5) * 0.8;

    // Calcule la position horizontale.
    positions[i3] =
        Math.cos(angle) *
        (radius + variation);

    // Calcule la position verticale.
    positions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

    // Enregistre la profondeur.
    positions[i3 + 2] = z;

    // Sélectionne une couleur de néon.
    const color =
        dataColors[
            Math.floor(
                Math.random() * dataColors.length
            )
        ];

    // Enregistre la couleur du caractère.
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    // Définit une taille individuelle discrète.
    sizes[i] =
        Math.random() < 0.12
            ? 1.5 + Math.random() * 0.5
            : 0.9 + Math.random() * 0.5;

    // Associe un caractère aléatoire à la particule.
    glyphIndices[i] =
        Math.floor(Math.random() * glyphCount);

    // Définit un décalage temporel indépendant.
    phases[i] =
        Math.random() * FULL_CIRCLE;
}

// Associe les positions à la géométrie.
geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);

// Associe les couleurs à la géométrie.
geometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(colors, 3)
);

// Associe les tailles à la géométrie.
geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sizes, 1)
);

// Associe les indices des caractères à la géométrie.
geometry.setAttribute(
    "aGlyph",
    new THREE.BufferAttribute(glyphIndices, 1)
);

// Associe les phases temporelles à la géométrie.
geometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(phases, 1)
);

// Crée le matériau personnalisé des caractères lumineux.
const material = new THREE.ShaderMaterial({

    // Autorise la transparence des caractères.
    transparent: true,

    // Empêche les particules transparentes d'écrire dans le depth buffer.
    depthWrite: false,

    // Additionne les lumières pour créer un véritable effet néon.
    blending: THREE.AdditiveBlending,

    // Définit les paramètres utilisés par les shaders.
    uniforms: {
        uSize: {
            value: particleSize
        },
        uGlyphTexture: {
            value: glyphTexture
        },
        uGlyphCount: {
            value: glyphCount
        },
        uTime: {
            value: 0
        }
    },

    // Calcule la position et l'animation des caractères.
    vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aGlyph;
        attribute float aPhase;

        varying vec3 vColor;
        varying float vGlyph;

        uniform float uSize;
        uniform float uTime;

        void main() {

            // Transmet la couleur et le caractère au fragment shader.
            vColor = aColor;
            vGlyph = aGlyph;

            // Prépare la position animée du caractère.
            vec3 animatedPosition = position;

            // Anime doucement le mouvement horizontal.
            animatedPosition.x +=
                sin(uTime * 0.45 + aPhase) * 0.045;

            // Anime indépendamment le mouvement vertical.
            animatedPosition.y +=
                cos(uTime * 0.35 + aPhase * 1.7) * 0.065;

            // Transforme la position dans l'espace de la caméra.
            vec4 mvPosition =
                modelViewMatrix *
                vec4(animatedPosition, 1.0);

            // Convertit la position pour le rendu.
            gl_Position =
                projectionMatrix *
                mvPosition;

            // Adapte la taille du caractère à sa profondeur.
            gl_PointSize =
                clamp(
                    uSize * aSize / max(-mvPosition.z, 0.1),
                    1.0,
                    48.0
                );
        }
    `,

    // Produit le cœur lumineux et le halo du néon.
    fragmentShader: `
        uniform sampler2D uGlyphTexture;
        uniform float uGlyphCount;

        varying vec3 vColor;
        varying float vGlyph;

        void main() {

            // Sélectionne la cellule correspondant au caractère actuel.
            vec2 uv = vec2(
                (vGlyph + gl_PointCoord.x) / uGlyphCount,
                gl_PointCoord.y
            );

            // Récupère la forme du caractère.
            float glyphAlpha = texture2D(
                uGlyphTexture,
                uv
            ).a;

            // Définit le rayon du halo autour des traits.
            vec2 glowOffset = vec2(
                2.0 / (64.0 * uGlyphCount),
                2.0 / 64.0
            );

            // Calcule une première couche de lumière diffuse.
            float glow = 0.0;

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(glowOffset.x, 0.0)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv - vec2(glowOffset.x, 0.0)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(0.0, glowOffset.y)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv - vec2(0.0, glowOffset.y)
                ).a
            );

            // Ajoute quatre échantillons diagonaux au halo.
            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + glowOffset
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv - glowOffset
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(glowOffset.x, -glowOffset.y)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(-glowOffset.x, glowOffset.y)
                ).a
            );

            // Supprime les pixels totalement transparents.
            if (glyphAlpha < 0.02 && glow < 0.02) {
                discard;
            }

            // Isole la lumière extérieure au caractère.
            float halo = max(
                glow - glyphAlpha,
                0.0
            );

            // Définit une lueur douce et une lueur plus concentrée.
            float softGlow = pow(
                halo,
                0.75
            );

            float innerGlow = pow(
                glyphAlpha,
                0.7
            );

            // Teinte le halo en cyan électrique.
            vec3 haloColor = mix(
                vColor,
                vec3(0.02, 0.85, 1.0),
                0.45
            );

            // Conserve la couleur choisie pour le cœur du caractère.
            vec3 coreColor =
                vColor * 1.65;

            // Superpose le cœur et les deux intensités de lumière.
            vec3 finalColor =
                coreColor * innerGlow +
                haloColor * softGlow * 0.95 +
                vColor * glyphAlpha * 0.45;

            // Définit une transparence plus douce autour du caractère.
            float alpha = clamp(
                glyphAlpha * 0.95 +
                softGlow * 0.32,
                0.0,
                1.0
            );

            // Affiche le caractère lumineux.
            gl_FragColor = vec4(
                finalColor,
                alpha
            );
        }
    `
});

// Crée le système de particules représentant les données informatiques.
const particles = new THREE.Points(
    geometry,
    material
);

// Ajoute le vortex numérique à la scène.
scene.add(particles);

// Maquette visuelle du hero placée dans la scène 3D.
// Elle sert uniquement pendant le travelling : le vrai DOM réapparaît à l'arrivée.
const heroPreviewCanvas = document.createElement("canvas");
const heroPreviewContext = heroPreviewCanvas.getContext("2d");
heroPreviewCanvas.width = isMobile ? 900 : 1600;
heroPreviewCanvas.height = isMobile ? 1600 : 900;

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawHeroPreview() {
    const ctx = heroPreviewContext;
    const w = heroPreviewCanvas.width;
    const h = heroPreviewCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const halo = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.58);
    halo.addColorStop(0, "rgba(20, 100, 210, 0.2)");
    halo.addColorStop(1, "rgba(5, 9, 20, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    const pad = isMobile ? 65 : 95;
    const copyWidth = isMobile ? w - pad * 2 : w * 0.56;
    let y = isMobile ? 135 : 165;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#80dcff";
    ctx.font = isMobile ? "600 23px Arial" : "600 25px Arial";
    ctx.fillText("ENZO CAMILO  ·  ÉTUDIANT MMI", pad, y);
    y += isMobile ? 62 : 76;

    ctx.font = isMobile ? "800 59px Arial" : "800 72px Arial";
    const titleLines = isMobile
        ? ["Entre création", "web et jeu", "vidéo,", "je construis", "mon univers."]
        : ["Entre création web", "et jeu vidéo,", "je construis", "mon univers."];
    for (const line of titleLines) {
        const gradient = ctx.createLinearGradient(pad, y, pad + copyWidth, y + 70);
        gradient.addColorStop(0, "#f4f7ff");
        gradient.addColorStop(1, "#75caff");
        ctx.fillStyle = gradient;
        ctx.fillText(line, pad, y, copyWidth);
        y += isMobile ? 72 : 80;
    }

    y += isMobile ? 20 : 18;
    ctx.fillStyle = "rgba(220, 231, 249, 0.82)";
    ctx.font = isMobile ? "25px Arial" : "23px Arial";
    const desc = isMobile
        ? ["Développement web, création", "numérique et découverte de", "Unity : j'explore ces univers", "en cours et dans mes projets."]
        : ["Développement web, création numérique et découverte de Unity :", "j'explore ces univers en cours et dans mes projets personnels."];
    for (const line of desc) {
        ctx.fillText(line, pad, y, copyWidth);
        y += isMobile ? 42 : 38;
    }

    const buttonY = y + 25;
    ctx.fillStyle = "rgba(47, 137, 255, 0.92)";
    roundRect(ctx, pad, buttonY, isMobile ? 340 : 300, isMobile ? 65 : 58, 13);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = isMobile ? "bold 21px Arial" : "bold 19px Arial";
    ctx.fillText("DÉCOUVRIR MES PROJETS", pad + 18, buttonY + 19);

    const cardW = isMobile ? w - pad * 2 : w * 0.31;
    const cardH = isMobile ? 285 : 500;
    const cardX = isMobile ? pad : w - pad - cardW;
    const cardY = isMobile ? h - cardH - 100 : h * 0.22;
    ctx.fillStyle = "rgba(7, 17, 39, 0.92)";
    ctx.strokeStyle = "rgba(73, 190, 255, 0.85)";
    ctx.lineWidth = 3;
    roundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#a6eaff";
    ctx.font = isMobile ? "bold 28px Arial" : "bold 32px Arial";
    ctx.fillText("BYTE INVADERS", cardX + 26, cardY + 32);
    ctx.strokeStyle = "rgba(70, 180, 255, 0.28)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(cardX + 25, cardY + 95 + i * (cardH - 140) / 7);
        ctx.lineTo(cardX + cardW - 25, cardY + 95 + i * (cardH - 140) / 7);
        ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#4de4ff";
    ctx.font = isMobile ? "bold 45px monospace" : "bold 54px monospace";
    ctx.fillText("✦ 0 1 ✦", cardX + cardW / 2, cardY + cardH * 0.43);
    ctx.fillStyle = "#7b9dff";
    ctx.font = isMobile ? "bold 60px monospace" : "bold 70px monospace";
    ctx.fillText("▲", cardX + cardW / 2, cardY + cardH * 0.68);
    ctx.textAlign = "left";
}

drawHeroPreview();
const heroPreviewTexture = new THREE.CanvasTexture(heroPreviewCanvas);
heroPreviewTexture.colorSpace = THREE.SRGBColorSpace;
const heroPreviewMaterial = new THREE.MeshBasicMaterial({
    map: heroPreviewTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
});
const previewHeight = 2 * cameraHeroZ * Math.tan(THREE.MathUtils.degToRad(75 / 2)) * 0.92;
const previewWidth = previewHeight * (window.innerWidth / window.innerHeight) * 0.92;
const heroPreview = new THREE.Mesh(
    new THREE.PlaneGeometry(previewWidth, previewHeight),
    heroPreviewMaterial
);
heroPreview.position.set(0, 0, 0);
heroPreview.renderOrder = 2;
scene.add(heroPreview);

// Indique si l'animation doit être mise en pause.
let isAnimationPaused = false;

// Stocke le moment du dernier rendu.
let lastFrameTime = 0;

// Définit l'intervalle entre deux images pour viser environ 30 FPS.
const frameInterval = 1000 / 30;

// Indique au loader que le fond Three.js a produit sa première image.
let hasSignaledBackgroundReady = false;

// Le travelling démarre après le loader et respecte la préférence de mouvement réduit.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cameraApproachDuration = isMobile ? 2200 : 2500;
let cameraApproachStarted = false;
let cameraApproachStartTime = 0;
let heroArrivalDispatched = false;

if (prefersReducedMotion) {
    camera.position.z = cameraHeroZ;
    heroPreviewMaterial.opacity = 0;
} else {
    window.addEventListener("portfolio-loader-hidden", () => {
        if (cameraApproachStarted) return;
        cameraApproachStarted = true;
        cameraApproachStartTime = performance.now();
        heroPreviewMaterial.opacity = 1;
    }, { once: true });
}

// Fonction principale exécutée à chaque image.
function animate(currentTime) {

    // Demande au navigateur de rappeler cette fonction.
    requestAnimationFrame(animate);

    // Arrête les calculs lorsque l'onglet est masqué.
    if (isAnimationPaused) {
        return;
    }

    // Limite la fréquence de rendu.
    if (currentTime - lastFrameTime < frameInterval) {
        return;
    }

    // Mémorise le moment du rendu actuel.
    lastFrameTime = currentTime;

    // Fait tourner lentement le vortex de données.
    particles.rotation.z += 0.0008;

    // Actualise le temps du fond et des caractères.
    const elapsedTime =
        currentTime * 0.001;

    backgroundMaterial.uniforms.uTime.value =
        elapsedTime;

    material.uniforms.uTime.value =
        elapsedTime;

    // Travelling 3D : accélération, traversée du vortex, puis arrivée contrôlée.
    if (cameraApproachStarted) {
        const elapsed = currentTime - cameraApproachStartTime;
        const progress = Math.min(elapsed / cameraApproachDuration, 1);
        const easedProgress = progress < 0.72
            ? 0.5 * Math.pow(progress / 0.72, 1.65) * 0.92
            : 0.46 + 0.54 * (1 - Math.pow(1 - (progress - 0.72) / 0.28, 3));

        camera.position.z =
            cameraStartZ + (cameraHeroZ - cameraStartZ) * easedProgress;

        // La maquette distante s'efface dans la dernière partie du travelling.
        heroPreviewMaterial.opacity = progress > 0.82
            ? Math.max(0, 1 - (progress - 0.82) / 0.18)
            : 1;

        if (progress >= 1) {
            cameraApproachStarted = false;
            camera.position.z = cameraHeroZ;
            heroPreviewMaterial.opacity = 0;
            if (!heroArrivalDispatched) {
                heroArrivalDispatched = true;
                window.dispatchEvent(new Event("portfolio-hero-arrived"));
            }
        }
    }

    // Dessine la scène depuis le point de vue de la caméra.
    renderer.render(
        scene,
        camera
    );

    // Signale une seule fois que le fond est réellement rendu à l'écran.
    if (!hasSignaledBackgroundReady) {
        hasSignaledBackgroundReady = true;
        window.__portfolioBackgroundReady = true;
        window.dispatchEvent(new Event("portfolio-background-ready"));
    }
}

// Détecte lorsque l'utilisateur quitte ou revient sur l'onglet.
document.addEventListener(
    "visibilitychange",
    () => {

        // Met l'animation en pause lorsque la page devient invisible.
        isAnimationPaused =
            document.visibilityState === "hidden";
    }
);

// Lance la boucle d'animation.
animate();

// Recalcule les dimensions du rendu lors du redimensionnement.
function handleResize() {

    // Met à jour les dimensions de la caméra.
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    // Met à jour les dimensions du canvas et le cadrage du hero distant.
    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    const nextPreviewHeight = 2 * cameraHeroZ * Math.tan(THREE.MathUtils.degToRad(75 / 2)) * 0.92;
    const nextPreviewWidth = nextPreviewHeight * (window.innerWidth / window.innerHeight) * 0.92;
    heroPreview.geometry.dispose();
    heroPreview.geometry = new THREE.PlaneGeometry(nextPreviewWidth, nextPreviewHeight);

    // Recalcule le pixel ratio selon la largeur de l'écran.
    const currentPixelRatio =
        window.innerWidth < 768 ? 1.25 :
            window.innerWidth < 1024 ? 1.5 :
                1.5;

    // Applique le pixel ratio adapté.
    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            currentPixelRatio
        )
    );
}

// Écoute les changements de dimensions de la fenêtre.
window.addEventListener(
    "resize",
    handleResize
);