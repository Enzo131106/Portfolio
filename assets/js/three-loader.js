"use strict";

// Three.js utilise le CDN en priorité et une copie locale en secours.
let THREE;

try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
} catch {
    console.warn("Three.js indisponible sur le CDN : chargement local.");
    THREE = await import("../../vendor/three/three.module.js");
}

export default THREE;
