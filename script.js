"use strict";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ─────────────────────────────────────────────
// SCÈNE
// ─────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0F172A);

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

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.appendChild(renderer.domElement);

// ─────────────────────────────────────────────
// PARTICULES
// ─────────────────────────────────────────────

const particleCount = 5000;

const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {

    const i3 = i * 3;

    // Position le long de l'axe du vortex
    const z = (Math.random() - 0.5) * 30;

    // Progression autour du vortex
    const angle = Math.random() * Math.PI * 2;

    // Rayon du vortex
    const radius = 2.5 + Math.random() * 4.5;

    // Légère irrégularité
    const variation = (Math.random() - 0.5) * 0.8;

    positions[i3] =
        Math.cos(angle) * (radius + variation);

    positions[i3 + 1] =
        Math.sin(angle) * (radius + variation);

    positions[i3 + 2] = z;
}

geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);

const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,

    uniforms: {
        uSize: { value: 55.0 }
    },

    vertexShader: `
        uniform float uSize;

        void main() {

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

            gl_Position = projectionMatrix * mvPosition;

            gl_PointSize = uSize / -mvPosition.z;
        }
    `,

    fragmentShader: `
        void main() {

            vec2 uv = gl_PointCoord * 2.0 - 1.0;
            float d = length(uv);

            // Cercle propre : aucun carré visible
            if (d > 1.0) {
                discard;
            }

            // Petit cœur très lumineux
            float core = 1.0 - smoothstep(0.0, 0.12, d);

            // Halo doux
            float glow = 1.0 - smoothstep(0.05, 0.85, d);
            glow = pow(glow, 4.0);

            // Halo très léger autour du cœur
            float alpha = core * 0.95 + glow * 0.22;

            gl_FragColor = vec4(
                1.0,
                1.0,
                1.0,
                alpha
            );
        }
    `
});

const particles = new THREE.Points(
    geometry,
    material
);

scene.add(particles);

// ─────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────

function animate() {

    requestAnimationFrame(animate);

    particles.rotation.z += 0.0008;

    renderer.render(scene, camera);
}

animate();

// ─────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────

window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});