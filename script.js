"use strict";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ─────────────────────────────────────────────
// SCÈNE
// ─────────────────────────────────────────────

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x070b18);

scene.fog = new THREE.FogExp2(
    0x070b18,
    0.008
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

camera.position.z = 5;

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
// ÉTOILES
// ─────────────────────────────────────────────

const particleCount = 4500;

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

// Couleurs naturelles des étoiles
const starColors = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xddeaff),
    new THREE.Color(0xb8d4ff),
    new THREE.Color(0xfff1d0),
    new THREE.Color(0xffc58a)
];

for (let i = 0; i < particleCount; i++) {

    const i3 = i * 3;

    const z =
        (Math.random() - 0.5) * 30;

    const angle =
        Math.random() * Math.PI * 2;

    const radius =
        2.5 + Math.random() * 4.5;

    const variation =
        (Math.random() - 0.5) * 0.8;

    positions[i3] =
        Math.cos(angle) *
        (radius + variation);

    positions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

    positions[i3 + 2] =
        z;

    const color =
        starColors[
            Math.floor(
                Math.random() *
                starColors.length
            )
        ];

    colors[i3] =
        color.r;

    colors[i3 + 1] =
        color.g;

    colors[i3 + 2] =
        color.b;

    if (Math.random() < 0.08) {

        sizes[i] =
            5.5 +
            Math.random() * 3.5;

    } else {

        sizes[i] =
            4.0 +
            Math.random() * 2.5;
    }
}

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

    uniforms: {
        uSize: {
            value: 65.0
        }
    },

    vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;

        varying vec3 vColor;

        uniform float uSize;

        void main() {

            vColor = aColor;

            vec4 mvPosition =
                modelViewMatrix *
                vec4(position, 1.0);

            gl_Position =
                projectionMatrix *
                mvPosition;

            gl_PointSize =
                uSize *
                aSize /
                5.0 /
                -mvPosition.z;
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

            float core =
                1.0 -
                smoothstep(
                    0.0,
                    0.12,
                    d
                );

            float glow =
                1.0 -
                smoothstep(
                    0.05,
                    0.85,
                    d
                );

            glow =
                pow(glow, 4.0);

            float alpha =
                core * 0.95 +
                glow * 0.22;

            gl_FragColor =
                vec4(
                    vColor,
                    alpha
                );
        }
    `
});

const particles =
    new THREE.Points(
        geometry,
        material
    );

scene.add(particles);

// ─────────────────────────────────────────────
// NÉBULEUSE
// ─────────────────────────────────────────────

const nebulaCount = 700;

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
    new THREE.Color(0x172b52),
    new THREE.Color(0x203866),
    new THREE.Color(0x2d315f),
    new THREE.Color(0x35274f),
    new THREE.Color(0x193b55)
];

for (let i = 0; i < nebulaCount; i++) {

    const i3 = i * 3;

    const z =
        (Math.random() - 0.5) * 30;

    const radius =
        1.5 +
        Math.random() * 5.5;

    const angle =
        Math.random() * Math.PI * 2;

    const variation =
        (Math.random() - 0.5) * 2.5;

    nebulaPositions[i3] =
        Math.cos(angle) *
        (radius + variation);

    nebulaPositions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

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
        35 +
        Math.random() * 55;
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
// SHADER DE LA BRUME
// ─────────────────────────────────────────────

const nebulaMaterial =
    new THREE.ShaderMaterial({

        transparent: true,

        depthWrite: false,

        blending:
            THREE.AdditiveBlending,

        uniforms: {},

        vertexShader: `
            attribute vec3 aColor;
            attribute float aSize;

            varying vec3 vColor;

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
                    pow(cloud, 2.8);

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
// TROU NOIR
// ─────────────────────────────────────────────
//
// Une grande surface invisible visuellement
// sauf au niveau du trou noir.
// Le shader simule :
//
// - horizon noir
// - disque d'accrétion
// - halo
// - distorsion lumineuse
// - asymétrie
// - rotation
//
// ─────────────────────────────────────────────

const blackHoleGeometry =
    new THREE.PlaneGeometry(
        14,
        14
    );

const blackHoleMaterial =
    new THREE.ShaderMaterial({

        transparent: true,

        depthTest: false,

        depthWrite: false,

        uniforms: {

            uTime: {
                value: 0
            },

            uAspect: {
                value:
                    window.innerWidth /
                    window.innerHeight
            }
        },

        vertexShader: `
            varying vec2 vUv;

            void main() {

                vUv =
                    uv;

                gl_Position =
                    projectionMatrix *
                    modelViewMatrix *
                    vec4(
                        position,
                        1.0
                    );
            }
        `,

        fragmentShader: `
            varying vec2 vUv;

            uniform float uTime;
            uniform float uAspect;

            #define PI 3.14159265359

            void main() {

                // ─────────────────────────────
                // COORDONNÉES
                // ─────────────────────────────

                vec2 uv =
                    vUv * 2.0 - 1.0;

                uv.x *= uAspect;

                float radius =
                    length(uv);

                float angle =
                    atan(
                        uv.y,
                        uv.x
                    );

                // ─────────────────────────────
                // PETITE DISTORSION
                // ─────────────────────────────
                //
                // La frontière n'est volontairement
                // pas parfaitement circulaire.
                //
                float distortion =
                    sin(
                        angle * 3.0
                        -
                        uTime * 0.7
                    ) * 0.018;

                distortion +=
                    sin(
                        angle * 7.0
                        +
                        uTime * 0.45
                    ) * 0.008;

                float distortedRadius =
                    radius +
                    distortion;

                // ─────────────────────────────
                // HORIZON
                // ─────────────────────────────

                const float horizon =
                    0.255;

                float blackMask =
                    1.0 -
                    smoothstep(
                        horizon - 0.015,
                        horizon + 0.015,
                        distortedRadius
                    );

                // ─────────────────────────────
                // DISQUE D'ACCRÉTION
                // ─────────────────────────────

                float disk =
                    1.0 -
                    smoothstep(
                        0.26,
                        0.39,
                        abs(
                            distortedRadius -
                            0.34
                        )
                    );

                // ─────────────────────────────
                // STRUCTURE DU DISQUE
                // ─────────────────────────────

                float rotation =
                    angle +
                    uTime * 0.8;

                float wave =
                    sin(
                        rotation * 5.0
                    ) * 0.035;

                float wave2 =
                    sin(
                        rotation * 11.0
                        -
                        uTime * 1.4
                    ) * 0.018;

                disk *=
                    0.82 +
                    wave +
                    wave2;

                // ─────────────────────────────
                // ASYMÉTRIE
                // ─────────────────────────────

                float directionalLight =
                    0.5 +
                    0.5 *
                    cos(
                        angle -
                        0.7
                    );

                disk *=
                    0.65 +
                    directionalLight *
                    0.75;

                // ─────────────────────────────
                // HALO PROCHE
                // ─────────────────────────────

                float innerHalo =
                    1.0 -
                    smoothstep(
                        0.28,
                        0.58,
                        distortedRadius
                    );

                innerHalo =
                    pow(
                        innerHalo,
                        3.5
                    );

                // ─────────────────────────────
                // HALO LARGE
                // ─────────────────────────────

                float outerHalo =
                    1.0 -
                    smoothstep(
                        0.30,
                        1.35,
                        distortedRadius
                    );

                outerHalo =
                    pow(
                        outerHalo,
                        3.8
                    );

                // ─────────────────────────────
                // ANNEAU DE LENTILLE
                // ─────────────────────────────
                //
                // Donne une impression de lumière
                // qui se courbe autour de l'horizon.
                //
                float lensRing =
                    1.0 -
                    smoothstep(
                        0.235,
                        0.29,
                        abs(
                            distortedRadius -
                            0.275
                        )
                    );

                lensRing =
                    pow(
                        lensRing,
                        2.0
                    );

                // ─────────────────────────────
                // ARC GRAVITATIONNEL
                // ─────────────────────────────
                //
                // Une partie de la lumière est
                // volontairement plus intense.
                //
                float arc =
                    smoothstep(
                        -0.3,
                        0.9,
                        cos(
                            angle -
                            0.9
                        )
                    );

                lensRing *=
                    0.55 +
                    arc *
                    0.9;

                // ─────────────────────────────
                // COULEURS
                // ─────────────────────────────

                vec3 white =
                    vec3(
                        1.0,
                        1.0,
                        1.0
                    );

                vec3 blueWhite =
                    vec3(
                        0.72,
                        0.88,
                        1.0
                    );

                vec3 haloColor =
                    vec3(
                        0.25,
                        0.48,
                        1.0
                    );

                // ─────────────────────────────
                // COMPOSITION
                // ─────────────────────────────

                vec3 color =
                    vec3(
                        0.0
                    );

                color +=
                    white *
                    disk *
                    2.8;

                color +=
                    blueWhite *
                    lensRing *
                    3.5;

                color +=
                    blueWhite *
                    innerHalo *
                    1.5;

                color +=
                    haloColor *
                    outerHalo *
                    0.65;

                // ─────────────────────────────
                // ALPHA
                // ─────────────────────────────

                float alpha =
                    max(
                        blackMask,
                        disk
                    );

                alpha =
                    max(
                        alpha,
                        lensRing
                    );

                alpha =
                    max(
                        alpha,
                        innerHalo * 0.7
                    );

                alpha =
                    max(
                        alpha,
                        outerHalo * 0.28
                    );

                // ─────────────────────────────
                // CENTRE NOIR ABSOLU
                // ─────────────────────────────

                if (
                    distortedRadius <
                    horizon
                ) {

                    color =
                        vec3(
                            0.0
                        );

                    alpha =
                        1.0;
                }

                gl_FragColor =
                    vec4(
                        color,
                        alpha
                    );
            }
        `
    });

const blackHole =
    new THREE.Mesh(
        blackHoleGeometry,
        blackHoleMaterial
    );

// Placé au centre du vortex
blackHole.position.set(
    0,
    0,
    0
);

scene.add(
    blackHole
);

// ─────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const elapsed =
        clock.getElapsedTime();

    // ─────────────────────────────────────────
    // VORTEX
    // ─────────────────────────────────────────

    particles.rotation.z +=
        0.0008;

    // ─────────────────────────────────────────
    // NÉBULEUSE
    // ─────────────────────────────────────────

    nebula.rotation.z -=
        0.00018;

    // ─────────────────────────────────────────
    // TROU NOIR
    // ─────────────────────────────────────────

    blackHoleMaterial.uniforms.uTime.value =
        elapsed;

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

        blackHoleMaterial.uniforms.uAspect.value =
            window.innerWidth /
            window.innerHeight;
    }
);