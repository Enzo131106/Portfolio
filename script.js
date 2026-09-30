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

    positions[i3] = (Math.random() - 0.5) * 20;
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;
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

            float distanceFromCenter = length(uv);

            // Supprime les coins
            if (distanceFromCenter > 1.0) {
                discard;
            }

            // Halo très discret
            float glow = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
            glow = pow(glow, 5.0);

            // Petites branches fines
            float horizontal = exp(-abs(uv.y) * 35.0);
            float vertical = exp(-abs(uv.x) * 35.0);

            float star = max(horizontal, vertical);

            // Réduit fortement les branches vers l'extérieur
            star *= 1.0 - smoothstep(0.05, 0.75, distanceFromCenter);

            // Petit cœur lumineux
            float core = 1.0 - smoothstep(
                0.0,
                0.10,
                distanceFromCenter
            );

            float alpha = max(
                glow * 0.20,
                star * 0.45
            );

            alpha = max(alpha, core);

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

    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;

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