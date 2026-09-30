"use strict";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ─────────────────────────────────────────────
// SCÈNE
// ─────────────────────────────────────────────

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x050914);

scene.fog = new THREE.FogExp2(
    0x050914,
    0.012
);

// ─────────────────────────────────────────────
// CAMÉRA
// ─────────────────────────────────────────────

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 0, 5);

// ─────────────────────────────────────────────
// RENDERER
// ─────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

document.body.appendChild(renderer.domElement);

// ─────────────────────────────────────────────
// GALAXIE
// ─────────────────────────────────────────────

const particleCount = 9000;

const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(
    particleCount * 3
);

const colors = new Float32Array(
    particleCount * 3
);

const sizes = new Float32Array(
    particleCount
);

// Couleurs stellaires
const starColors = [
    new THREE.Color(0x8db7ff), // bleu chaud
    new THREE.Color(0xc9dcff), // bleu/blanc
    new THREE.Color(0xffffff), // blanc
    new THREE.Color(0xfff4d6), // jaune/blanc
    new THREE.Color(0xffc27a), // orange
    new THREE.Color(0xff8a65)  // rouge/orange
];

// Nombre de bras
const armCount = 5;

// Longueur de la galaxie
const galaxyDepth = 45;

// Rayon maximum
const maxRadius = 9;

for (let i = 0; i < particleCount; i++) {

    const i3 = i * 3;

    // ─────────────────────────────────────────
    // PROFONDEUR
    // ─────────────────────────────────────────

    const z =
        (Math.random() - 0.5) *
        galaxyDepth;

    // ─────────────────────────────────────────
    // DISTANCE PAR RAPPORT AU CENTRE
    // ─────────────────────────────────────────

    // Distribution non uniforme :
    // beaucoup de particules vers le centre,
    // mais quelques-unes très éloignées.

    const randomRadius =
        Math.pow(Math.random(), 0.65) *
        maxRadius;

    // ─────────────────────────────────────────
    // BRAS SPIRAL
    // ─────────────────────────────────────────

    const arm =
        Math.floor(
            Math.random() * armCount
        );

    const armAngle =
        (arm / armCount) *
        Math.PI * 2;

    // La spirale tourne progressivement
    // avec la profondeur.

    const spiralAngle =
        armAngle +
        z * 0.28;

    // Dispersion autour du bras
    const armSpread =
        (Math.random() - 0.5) *
        (
            0.5 +
            randomRadius * 0.12
        );

    const angle =
        spiralAngle +
        armSpread;

    // ─────────────────────────────────────────
    // ÉPAISSEUR / DENSITÉ
    // ─────────────────────────────────────────

    const radius =
        randomRadius +
        (Math.random() - 0.5) * 0.7;

    // Léger aplatissement de la galaxie
    const y =
        Math.sin(angle) *
        radius *
        0.72;

    const x =
        Math.cos(angle) *
        radius;

    // ─────────────────────────────────────────
    // POSITION
    // ─────────────────────────────────────────

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // ─────────────────────────────────────────
    // COULEUR
    // ─────────────────────────────────────────

    // Le centre est plus blanc,
    // les zones extérieures sont plus colorées.

    const centerFactor =
        1.0 -
        Math.min(
            randomRadius / maxRadius,
            1.0
        );

    let color;

    const random = Math.random();

    if (random < 0.12 + centerFactor * 0.15) {
        color = starColors[2]; // blanc
    }
    else if (random < 0.32) {
        color = starColors[1]; // blanc/bleu
    }
    else if (random < 0.52) {
        color = starColors[0]; // bleu
    }
    else if (random < 0.75) {
        color = starColors[3]; // jaune
    }
    else if (random < 0.92) {
        color = starColors[4]; // orange
    }
    else {
        color = starColors[5]; // rouge
    }

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    // ─────────────────────────────────────────
    // TAILLE
    // ─────────────────────────────────────────

    const largeStarChance =
        Math.random();

    if (largeStarChance < 0.035) {
        sizes[i] =
            13 +
            Math.random() * 10;
    }
    else {
        sizes[i] =
            3 +
            Math.random() * 5;
    }
}

// Attributs
geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        positions,
        3
    )
);

geometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(
        colors,
        3
    )
);

geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
        sizes,
        1
    )
);

// ─────────────────────────────────────────────
// SHADER DES ÉTOILES
// ─────────────────────────────────────────────

const material = new THREE.ShaderMaterial({

    transparent: true,

    depthWrite: false,

    blending:
        THREE.AdditiveBlending,

    fog: true,

    uniforms: {
        uPixelRatio: {
            value: Math.min(
                window.devicePixelRatio,
                2
            )
        }
    },

    vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;

        varying vec3 vColor;

        uniform float uPixelRatio;

        void main() {

            vColor = aColor;

            vec4 mvPosition =
                modelViewMatrix *
                vec4(position, 1.0);

            gl_Position =
                projectionMatrix *
                mvPosition;

            gl_PointSize =
                aSize *
                uPixelRatio *
                (45.0 / -mvPosition.z);
        }
    `,

    fragmentShader: `
        varying vec3 vColor;

        void main() {

            vec2 uv =
                gl_PointCoord * 2.0 - 1.0;

            float d =
                length(uv);

            if (d > 1.0) {
                discard;
            }

            // Cœur de l'étoile
            float core =
                1.0 -
                smoothstep(
                    0.0,
                    0.18,
                    d
                );

            // Halo
            float glow =
                1.0 -
                smoothstep(
                    0.05,
                    1.0,
                    d
                );

            glow =
                pow(glow, 3.5);

            // Halo discret
            float alpha =
                core * 0.95 +
                glow * 0.18;

            gl_FragColor =
                vec4(
                    vColor,
                    alpha
                );
        }
    `
});

const galaxy =
    new THREE.Points(
        geometry,
        material
    );

scene.add(galaxy);

// ─────────────────────────────────────────────
// NÉBULEUSE
// ─────────────────────────────────────────────

const nebulaCount = 1800;

const nebulaGeometry =
    new THREE.BufferGeometry();

const nebulaPositions =
    new Float32Array(
        nebulaCount * 3
    );

const nebulaColors =
    new Float32Array(
        nebulaCount * 3
    );

const nebulaSizes =
    new Float32Array(
        nebulaCount
    );

const nebulaPalette = [
    new THREE.Color(0x355fa8),
    new THREE.Color(0x4d6fc4),
    new THREE.Color(0x8b5fbf),
    new THREE.Color(0x315c7a),
    new THREE.Color(0x6d477d)
];

for (let i = 0; i < nebulaCount; i++) {

    const i3 = i * 3;

    // Même structure générale que la galaxie
    const z =
        (Math.random() - 0.5) *
        40;

    const radius =
        Math.pow(
            Math.random(),
            0.8
        ) * 8;

    const arm =
        Math.floor(
            Math.random() *
            armCount
        );

    const baseAngle =
        (arm / armCount) *
        Math.PI * 2;

    const spiralAngle =
        baseAngle +
        z * 0.28;

    const angle =
        spiralAngle +
        (Math.random() - 0.5) *
        0.8;

    const x =
        Math.cos(angle) *
        radius;

    const y =
        Math.sin(angle) *
        radius *
        0.75;

    nebulaPositions[i3] =
        x +
        (Math.random() - 0.5) * 1.5;

    nebulaPositions[i3 + 1] =
        y +
        (Math.random() - 0.5) * 1.5;

    nebulaPositions[i3 + 2] =
        z;

    const color =
        nebulaPalette[
            Math.floor(
                Math.random() *
                nebulaPalette.length
            )
        ];

    nebulaColors[i3] =
        color.r;

    nebulaColors[i3 + 1] =
        color.g;

    nebulaColors[i3 + 2] =
        color.b;

    nebulaSizes[i] =
        20 +
        Math.random() * 35;
}

nebulaGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        nebulaPositions,
        3
    )
);

nebulaGeometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(
        nebulaColors,
        3
    )
);

nebulaGeometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
        nebulaSizes,
        1
    )
);

// ─────────────────────────────────────────────
// SHADER NÉBULEUSE
// ─────────────────────────────────────────────

const nebulaMaterial =
    new THREE.ShaderMaterial({

        transparent: true,

        depthWrite: false,

        blending:
            THREE.AdditiveBlending,

        fog: true,

        uniforms: {
            uPixelRatio: {
                value:
                    Math.min(
                        window.devicePixelRatio,
                        2
                    )
            }
        },

        vertexShader: `
            attribute vec3 aColor;
            attribute float aSize;

            varying vec3 vColor;

            uniform float uPixelRatio;

            void main() {

                vColor = aColor;

                vec4 mvPosition =
                    modelViewMatrix *
                    vec4(position, 1.0);

                gl_Position =
                    projectionMatrix *
                    mvPosition;

                gl_PointSize =
                    aSize *
                    uPixelRatio *
                    (35.0 / -mvPosition.z);
            }
        `,

        fragmentShader: `
            varying vec3 vColor;

            void main() {

                vec2 uv =
                    gl_PointCoord * 2.0 - 1.0;

                float d =
                    length(uv);

                if (d > 1.0) {
                    discard;
                }

                float cloud =
                    1.0 -
                    smoothstep(
                        0.0,
                        1.0,
                        d
                    );

                cloud =
                    pow(cloud, 3.0);

                gl_FragColor =
                    vec4(
                        vColor,
                        cloud * 0.045
                    );
            }
        `
    });

const nebula =
    new THREE.Points(
        nebulaGeometry,
        nebulaMaterial
    );

scene.add(nebula);

// ─────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────

function animate() {

    requestAnimationFrame(
        animate
    );

    // Rotation très lente de la galaxie
    galaxy.rotation.z += 0.00035;

    // La nébuleuse suit légèrement
    // mais avec un mouvement différent.
    nebula.rotation.z -= 0.00012;

    renderer.render(
        scene,
        camera
    );
}

animate();

// ─────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        const pixelRatio =
            Math.min(
                window.devicePixelRatio,
                2
            );

        material.uniforms.uPixelRatio.value =
            pixelRatio;

        nebulaMaterial.uniforms.uPixelRatio.value =
            pixelRatio;
    }
);