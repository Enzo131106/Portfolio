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

// Définit le nombre de particules de brume selon le type d'appareil.
const nebulaCount =
    isMobile ? 70 :
        isTablet ? 110 :
            160;

// Définit la taille globale des caractères selon le type d'appareil.
const particleSize =
    isMobile ? 100.0 :
        isTablet ? 110.0 :
            120.0;

// Initialise la scène principale qui contient tous les éléments 3D.
const scene = new THREE.Scene();

// Définit la couleur de fond de l'espace numérique.
scene.background = new THREE.Color(0x050914);

// Ajoute une brume légère pour atténuer les éléments éloignés.
scene.fog = new THREE.FogExp2(
    0x050914,
    0.008
);

// Initialise la caméra avec une perspective 3D.
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Place la caméra légèrement en arrière de la scène.
camera.position.z = 5;

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
    isMobile ? 1 :
        isTablet ? 1.25 :
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

// Définit les caractères utilisés pour représenter les données informatiques.
const glyphs = [
    "0", "1", "{", "}", "<", ">", "/", ";"
];

// Définit le nombre de caractères différents disponibles.
const glyphCount = glyphs.length;

// Crée une texture regroupant tous les caractères dans une seule image.
const glyphCanvas = document.createElement("canvas");
const glyphContext = glyphCanvas.getContext("2d");

// Définit les dimensions de chaque cellule de la texture.
const glyphCellSize = 64;

glyphCanvas.width = glyphCellSize * glyphCount;
glyphCanvas.height = glyphCellSize;

// Prépare le style graphique des caractères.
glyphContext.clearRect(
    0,
    0,
    glyphCanvas.width,
    glyphCanvas.height
);

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

// Convertit l'image des caractères en texture utilisable par le GPU.
const glyphTexture = new THREE.CanvasTexture(glyphCanvas);

// Indique que la texture contient des caractères transparents.
glyphTexture.colorSpace = THREE.SRGBColorSpace;

// Crée la structure qui contiendra les données géométriques des caractères.
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

// Définit la palette des caractères numériques.
const dataColors = [
    new THREE.Color(0x8abaff),
    new THREE.Color(0x60a5fa),
    new THREE.Color(0x38bdf8),
    new THREE.Color(0xb4d8ff),
    new THREE.Color(0x647fba)
];

// Génère aléatoirement la position, la couleur et le caractère de chaque particule.
for (let i = 0; i < particleCount; i++) {

    // Permet d'accéder aux trois valeurs X, Y et Z du caractère actuel.
    const i3 = i * 3;

    // Définit la profondeur du caractère dans le vortex.
    const z =
        (Math.random() - 0.5) * 30;

    // Définit l'angle du caractère autour de l'axe central du vortex.
    const angle =
        Math.random() * FULL_CIRCLE;

    // Définit la distance de base entre le caractère et le centre du vortex.
    const radius =
        2.5 + Math.random() * 4.5;

    // Ajoute une variation aléatoire pour éviter une disposition trop régulière.
    const variation =
        (Math.random() - 0.5) * 0.8;

    // Calcule la position horizontale du caractère.
    positions[i3] =
        Math.cos(angle) *
        (radius + variation);

    // Calcule la position verticale du caractère.
    positions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

    // Enregistre la profondeur du caractère.
    positions[i3 + 2] = z;

    // Sélectionne une couleur dans la palette numérique.
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

    // Définit la taille du caractère pour créer un flux de données plus lisible.
    sizes[i] =
        Math.random() < 0.12
            ? 1.5 + Math.random() * 0.5
            : 0.9 + Math.random() * 0.5;

    // Associe un caractère aléatoire à la particule actuelle.
    glyphIndices[i] =
        Math.floor(Math.random() * glyphCount);

    // Définit un décalage aléatoire pour varier l'animation de chaque caractère.
    phases[i] =
        Math.random() * FULL_CIRCLE;
}

// Associe les positions des caractères à la géométrie.
geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);

// Associe les couleurs à la géométrie.
geometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(colors, 3)
);

// Associe les tailles individuelles à la géométrie.
geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sizes, 1)
);

// Associe les indices des caractères à la géométrie.
geometry.setAttribute(
    "aGlyph",
    new THREE.BufferAttribute(glyphIndices, 1)
);

// Associe les décalages temporels à la géométrie.
geometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(phases, 1)
);

// Crée le matériau personnalisé utilisé pour afficher les caractères.
const material = new THREE.ShaderMaterial({

    // Autorise la transparence des caractères.
    transparent: true,

    // Empêche les particules transparentes d'écrire dans le depth buffer.
    depthWrite: false,

    // Mélange les couleurs pour produire une lumière bleutée discrète.
    blending: THREE.AdditiveBlending,

    // Utilise la texture des caractères et définit les paramètres du shader.
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

    // Définit la position, la couleur et le caractère de chaque particule sur le GPU.
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

            // Transmet la couleur et l'indice du caractère au fragment shader.
            vColor = aColor;
            vGlyph = aGlyph;

            // Anime chaque caractère avec un mouvement doux et indépendant.
            vec3 animatedPosition = position;

            animatedPosition.x +=
                sin(uTime * 0.45 + aPhase) * 0.045;

            animatedPosition.y +=
                cos(uTime * 0.35 + aPhase * 1.7) * 0.065;

            // Transforme la position animée dans l'espace de la caméra.
            vec4 mvPosition =
                modelViewMatrix *
                vec4(animatedPosition, 1.0);

            // Convertit la position dans l'espace visible par la caméra.
            gl_Position =
                projectionMatrix *
                mvPosition;

            // Augmente la taille apparente des caractères tout en conservant la perspective.
            gl_PointSize =
                clamp(
                    uSize * aSize / max(-mvPosition.z, 0.1),
                    1.0,
                    48.0
                );
        }
    `,

    // Définit l'apparence de chaque caractère informatique.
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

            // Récupère la forme du caractère dans la texture.
            float glyphAlpha = texture2D(
                uGlyphTexture,
                uv
            ).a;

            // Définit la taille du halo autour du caractère.
            vec2 glowOffset = vec2(
                2.5 / (64.0 * uGlyphCount),
                2.5 / 64.0
            );

            // Échantillonne les contours voisins pour créer une lueur diffuse.
            float glow = 0.0;

            glow = max(glow, texture2D(
                uGlyphTexture,
                uv + vec2(glowOffset.x, 0.0)
            ).a);

            glow = max(glow, texture2D(
                uGlyphTexture,
                uv - vec2(glowOffset.x, 0.0)
            ).a);

            glow = max(glow, texture2D(
                uGlyphTexture,
                uv + vec2(0.0, glowOffset.y)
            ).a);

            glow = max(glow, texture2D(
                uGlyphTexture,
                uv - vec2(0.0, glowOffset.y)
            ).a);

            // Élimine les pixels sans caractère ni halo.
            if (glyphAlpha < 0.03 && glow < 0.03) {
                discard;
            }

            // Intensifie la lumière autour des contours.
            float halo = max(glow - glyphAlpha, 0.0);

            // Mélange un cœur bleu clair et un halo cyan.
            vec3 coreColor = vec3(0.68, 0.84, 1.0);
            vec3 haloColor = vec3(0.10, 0.48, 1.0);

            // Renforce la lumière centrale sans surexposer les caractères.
            vec3 finalColor =
                coreColor * glyphAlpha * 1.35 +
                haloColor * halo * 1.8;

            // Combine la luminosité et la transparence du néon.
            float alpha = max(
                glyphAlpha * 0.95,
                halo * 0.55
            );

            // Applique le résultat lumineux au pixel.
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

// Crée la géométrie contenant les particules de brume.
const nebulaGeometry = new THREE.BufferGeometry();

// Stocke les positions 3D des particules de brume.
const nebulaPositions = new Float32Array(
    nebulaCount * 3
);

// Stocke les couleurs des particules de brume.
const nebulaColors = new Float32Array(
    nebulaCount * 3
);

// Stocke les tailles des particules de brume.
const nebulaSizes = new Float32Array(
    nebulaCount
);

// Définit une palette sombre pour le brouillard numérique.
const nebulaPalette = [
    new THREE.Color(0x10264a),
    new THREE.Color(0x12365c),
    new THREE.Color(0x17264d),
    new THREE.Color(0x123e58)
];

// Génère les particules qui créent une profondeur lumineuse discrète.
for (let i = 0; i < nebulaCount; i++) {

    // Permet d'accéder aux trois valeurs X, Y et Z de la particule actuelle.
    const i3 = i * 3;

    // Définit la profondeur de la particule dans le vortex.
    const z =
        (Math.random() - 0.5) * 30;

    // Définit la distance de la particule par rapport au centre.
    const radius =
        1.5 + Math.random() * 5.5;

    // Définit l'angle de la particule autour du centre.
    const angle =
        Math.random() * FULL_CIRCLE;

    // Ajoute une variation pour créer un nuage irrégulier.
    const variation =
        (Math.random() - 0.5) * 2.5;

    // Calcule la position horizontale de la particule.
    nebulaPositions[i3] =
        Math.cos(angle) *
        (radius + variation);

    // Calcule la position verticale de la particule.
    nebulaPositions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

    // Enregistre la profondeur de la particule.
    nebulaPositions[i3 + 2] = z;

    // Sélectionne une couleur dans la palette sombre.
    const color =
        nebulaPalette[
            Math.floor(
                Math.random() * nebulaPalette.length
            )
        ];

    // Enregistre la couleur de la particule.
    nebulaColors[i3] = color.r;
    nebulaColors[i3 + 1] = color.g;
    nebulaColors[i3 + 2] = color.b;

    // Définit une taille modérée pour les halos de brume.
    nebulaSizes[i] =
        30 + Math.random() * 35;
}

// Associe les positions à la géométrie de la brume.
nebulaGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(nebulaPositions, 3)
);

// Associe les couleurs à la géométrie de la brume.
nebulaGeometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(nebulaColors, 3)
);

// Associe les tailles à la géométrie de la brume.
nebulaGeometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(nebulaSizes, 1)
);

// Crée le matériau utilisé pour afficher la brume numérique.
const nebulaMaterial = new THREE.ShaderMaterial({

    // Autorise la transparence des halos.
    transparent: true,

    // Empêche les particules transparentes d'écrire dans le depth buffer.
    depthWrite: false,

    // Mélange les halos pour obtenir une lumière douce.
    blending: THREE.AdditiveBlending,

    // Calcule la position et la taille des particules sur le GPU.
    vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;

        varying vec3 vColor;

        void main() {

            // Transmet la couleur au fragment shader.
            vColor = aColor;

            // Transforme la position dans l'espace de la caméra.
            vec4 mvPosition =
                modelViewMatrix *
                vec4(position, 1.0);

            // Convertit la position dans l'espace visible par la caméra.
            gl_Position =
                projectionMatrix *
                mvPosition;

            // Définit la taille du halo selon sa distance.
            gl_PointSize =
                clamp(
                    aSize * (35.0 / max(-mvPosition.z, 0.1)),
                    1.0,
                    128.0
                );
        }
    `,

    // Définit l'apparence diffuse des halos bleus.
    fragmentShader: `
        varying vec3 vColor;

        void main() {

            // Centre les coordonnées autour de l'origine de la particule.
            vec2 uv =
                gl_PointCoord * 2.0 - 1.0;

            // Calcule la distance par rapport au centre.
            float d = length(uv);

            // Supprime les pixels situés en dehors du halo.
            if (d > 1.0) {
                discard;
            }

            // Crée un halo progressif sans contour visible.
            float cloud =
                1.0 - smoothstep(0.0, 1.0, d);

            // Concentre légèrement la luminosité au centre.
            cloud = pow(cloud, 2.8);

            // Applique une opacité faible pour préserver la lisibilité.
            gl_FragColor = vec4(
                vColor,
                cloud * 0.035
            );
        }
    `
});

// Crée le système de particules représentant la brume.
const nebula = new THREE.Points(
    nebulaGeometry,
    nebulaMaterial
);

// Ajoute la brume à la scène.
scene.add(nebula);

// Indique si l'animation doit actuellement être exécutée.
let isAnimationPaused = false;

// Stocke le moment du dernier rendu.
let lastFrameTime = 0;

// Définit l'intervalle entre deux images pour limiter le rendu à environ 30 FPS.
const frameInterval = 1000 / 30;

// Fonction principale exécutée à chaque image disponible.
function animate(currentTime) {

    // Demande au navigateur de rappeler cette fonction.
    requestAnimationFrame(animate);

    // Ne fait aucun calcul lorsque l'onglet est masqué.
    if (isAnimationPaused) {
        return;
    }

    // Ignore cette image si le délai minimum entre deux rendus n'est pas atteint.
    if (currentTime - lastFrameTime < frameInterval) {
        return;
    }

    // Mémorise le moment du rendu actuel.
    lastFrameTime = currentTime;

    // Fait tourner lentement le vortex de données.
    particles.rotation.z += 0.0008;

    // Fait tourner la brume dans la direction opposée.
    nebula.rotation.z -= 0.00018;

    // Actualise le temps utilisé pour animer les caractères sur le GPU.
    material.uniforms.uTime.value =
        currentTime * 0.001;

    // Dessine la scène depuis le point de vue de la caméra.
    renderer.render(scene, camera);
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

// Recalcule les dimensions du rendu lors du redimensionnement de la fenêtre.
function handleResize() {

    // Met à jour les dimensions de la caméra.
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    // Met à jour les dimensions du canvas.
    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    // Recalcule le pixel ratio selon la nouvelle largeur.
    const currentPixelRatio =
        window.innerWidth < 768 ? 1 :
            window.innerWidth < 1024 ? 1.25 :
                1.5;

    // Applique le pixel ratio adapté à la résolution actuelle.
    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            currentPixelRatio
        )
    );
}

// Écoute les changements de dimensions de la fenêtre.
window.addEventListener("resize", handleResize);