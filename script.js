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
// Petit trou noir au centre du vortex.
// L'horizon reste parfaitement circulaire.
// La déformation est uniquement appliquée
// à la lumière autour de celui-ci.
// ─────────────────────────────────────────────

const blackHoleGeometry =
    new THREE.PlaneGeometry(
        5.5,
        5.5
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

                vUv = uv;

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
                // HORIZON
                // ─────────────────────────────
                //
                // PARFAITEMENT CIRCULAIRE.
                //
                const float horizon =
                    0.115;

                float horizonMask =
                    1.0 -
                    smoothstep(
                        horizon - 0.008,
                        horizon + 0.008,
                        radius
                    );

                // ─────────────────────────────
                // DISQUE D'ACCRÉTION
                // ─────────────────────────────

                const float diskRadius =
                    0.155;

                float disk =
                    1.0 -
                    smoothstep(
                        0.025,
                        0.065,
                        abs(
                            radius -
                            diskRadius
                        )
                    );

                // ─────────────────────────────
                // PETITE VARIATION DE LUMINOSITÉ
                // ─────────────────────────────

                float rotation =
                    angle +
                    uTime * 0.9;

                float variation =
                    sin(
                        rotation * 5.0
                    ) * 0.025;

                variation +=
                    sin(
                        rotation * 9.0
                        -
                        uTime
                    ) * 0.012;

                disk *=
                    0.9 +
                    variation;

                // ─────────────────────────────
                // ASYMÉTRIE TRÈS LÉGÈRE
                // ─────────────────────────────

                float directionalLight =
                    0.5 +
                    0.5 *
                    cos(
                        angle -
                        0.7
                    );

                disk *=
                    0.82 +
                    directionalLight *
                    0.35;

                // ─────────────────────────────
                // COURBURE DE LA LUMIÈRE
                // ─────────────────────────────
                //
                // Très faible.
                //
                // Elle ne déforme PAS le trou noir.
                // Elle donne seulement une petite
                // irrégularité au bord lumineux.
                //
                float lens =
                    sin(
                        angle * 3.0
                        -
                        uTime * 0.35
                    ) * 0.004;

                float lensRing =
                    1.0 -
                    smoothstep(
                        0.008,
                        0.022,
                        abs(
                            radius -
                            (
                                0.135 +
                                lens
                            )
                        )
                    );

                // ─────────────────────────────
                // PETIT HALO
                // ─────────────────────────────

                float halo =
                    1.0 -
                    smoothstep(
                        0.16,
                        0.34,
                        radius
                    );

                halo =
                    pow(
                        halo,
                        5.0
                    );

                // ─────────────────────────────
                // HALO EXTRÊMEMENT DISCRET
                // ─────────────────────────────

                float outerGlow =
                    1.0 -
                    smoothstep(
                        0.20,
                        0.42,
                        radius
                    );

                outerGlow =
                    pow(
                        outerGlow,
                        7.0
                    );

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

                vec3 blue =
                    vec3(
                        0.25,
                        0.45,
                        1.0
                    );

                vec3 color =
                    vec3(
                        0.0
                    );

                color +=
                    white *
                    disk *
                    3.2;

                color +=
                    blueWhite *
                    lensRing *
                    2.5;

                color +=
                    blueWhite *
                    halo *
                    0.75;

                color +=
                    blue *
                    outerGlow *
                    0.22;

                // ─────────────────────────────
                // ALPHA
                // ─────────────────────────────

                float alpha =
                    disk;

                alpha =
                    max(
                        alpha,
                        lensRing
                    );

                alpha =
                    max(
                        alpha,
                        halo * 0.45
                    );

                alpha =
                    max(
                        alpha,
                        outerGlow * 0.08
                    );

                // ─────────────────────────────
                // HORIZON NOIR
                // ─────────────────────────────

                if (
                    radius <
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

blackHole.position.set(
    0,
    0,
    0
);

scene.add(
    blackHole
);