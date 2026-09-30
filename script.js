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

const ctx = starCanvas.getContext("2d");

ctx.clearRect(0, 0, 64, 64);

// Halo
const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
glow.addColorStop(0, "rgba(255,255,255,1)");
glow.addColorStop(0.15, "rgba(255,255,255,0.7)");
glow.addColorStop(0.4, "rgba(255,255,255,0.15)");
glow.addColorStop(1, "rgba(255,255,255,0)");

ctx.fillStyle = glow;
ctx.fillRect(0, 0, 64, 64);

// Étoile à 4 branches
ctx.save();
ctx.translate(32, 32);

ctx.fillStyle = "white";

ctx.beginPath();

// Branche verticale
ctx.moveTo(0, -22);
ctx.lineTo(3, -3);

// Branche droite
ctx.lineTo(22, 0);
ctx.lineTo(3, 3);

// Branche basse
ctx.lineTo(0, 22);
ctx.lineTo(-3, 3);

// Branche gauche
ctx.lineTo(-22, 0);
ctx.lineTo(-3, -3);

ctx.closePath();
ctx.fill();

ctx.restore();

const starTexture = new THREE.CanvasTexture(starCanvas);
starTexture.needsUpdate = true;

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