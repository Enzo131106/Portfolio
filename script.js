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

const starCanvas = document.createElement("canvas");
starCanvas.width = 64;
starCanvas.height = 64;

const starContext = starCanvas.getContext("2d");

const gradient = starContext.createRadialGradient(
    32, 32, 0,
    32, 32, 32
);

gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
gradient.addColorStop(0.08, "rgba(255, 255, 255, 1)");
gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.6)");
gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.15)");
gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

starContext.fillStyle = gradient;
starContext.fillRect(0, 0, 64, 64);

// Petit cœur lumineux
starContext.fillStyle = "#ffffff";
starContext.beginPath();
starContext.arc(32, 32, 2, 0, Math.PI * 2);
starContext.fill();

const starTexture = new THREE.CanvasTexture(starCanvas);

const material = new THREE.PointsMaterial({
    map: starTexture,
    color: 0xffffff,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    alphaTest: 0.001
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