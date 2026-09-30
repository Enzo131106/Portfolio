"use strict";

import * as THREE from "three";

// ─────────────────────────────────────────────
// SCÈNE
// ─────────────────────────────────────────────

const scene = new THREE.Scene();

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
    alpha: true
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

const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.035,
    transparent: true,
    opacity: 0.8
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