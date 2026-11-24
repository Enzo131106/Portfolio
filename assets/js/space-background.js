"use strict";

// Scène WebGL : rendu spatial synchronisé avec l'animation de la page.

import THREE from "./three-loader.js";

const FULL_CIRCLE = Math.PI * 2;

const motion = window._portfolioMotion || (window._portfolioMotion = { intro: 0, scroll: 0 });
const cameraIntroZ = 19;
const cameraHeroZ = 5;
const cameraScrollDistance = 7.5;

const isMobile = window.innerWidth < 768;
const isTablet =
    window.innerWidth >= 768 &&
    window.innerWidth < 1024;

const particleCount =
    isMobile ? 650 :
        isTablet ? 1100 :
            1600;

const particleSize =
    isMobile ? 100.0 :
        isTablet ? 110.0 :
            120.0;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = cameraIntroZ
    - (cameraIntroZ - cameraHeroZ) * motion.intro
    - cameraScrollDistance * motion.scroll;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

const initialPixelRatio =
    window.innerWidth >= 3000 ? 1 :
        window.innerWidth >= 1920 ? 1.2 :
            isMobile ? 1.25 : 1.5;

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        initialPixelRatio
    )
);

renderer.domElement.id = "background";
document.body.prepend(renderer.domElement);

scene.background = new THREE.Color(0x050914);

const backgroundGeometry = new THREE.PlaneGeometry(
    200,
    120
);

const backgroundMaterial = new THREE.ShaderMaterial({

    uniforms: {
        uTime: {
            value: 0
        }
    },

    depthTest: false,
    depthWrite: false,

    vertexShader: `
        varying vec2 vUv;

        void main() {

            vUv = uv;

            gl_Position =
                projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform float uTime;

        varying vec2 vUv;

        float lightSpot(
            vec2 uv,
            vec2 center,
            float radius
        ) {
            float distanceToCenter =
                length(uv - center);

            return exp(
                -distanceToCenter *
                distanceToCenter /
                radius
            );
        }

        void main() {

            vec2 uv = vUv;

            vec3 baseColor = vec3(
                0.008,
                0.015,
                0.040
            );

            float time = uTime * 0.10;

            vec2 blueCenter = vec2(
                0.28 + sin(time) * 0.12,
                0.62 + cos(time * 0.8) * 0.10
            );

            vec2 cyanCenter = vec2(
                0.76 + cos(time * 0.7) * 0.12,
                0.36 + sin(time * 0.9) * 0.12
            );

            vec2 violetCenter = vec2(
                0.52 + sin(time * 0.6) * 0.16,
                0.78 + cos(time * 0.7) * 0.08
            );

            float blueLight = lightSpot(
                uv,
                blueCenter,
                0.075
            );

            float cyanLight = lightSpot(
                uv,
                cyanCenter,
                0.055
            );

            float violetLight = lightSpot(
                uv,
                violetCenter,
                0.10
            );

            vec3 finalColor = baseColor;

            finalColor +=
                vec3(0.015, 0.075, 0.24) *
                blueLight;

            finalColor +=
                vec3(0.005, 0.10, 0.19) *
                cyanLight;

            finalColor +=
                vec3(0.045, 0.025, 0.16) *
                violetLight;

            float edgeDistance =
                length((uv - 0.5) * vec2(1.0, 0.85));

            float vignette =
                smoothstep(0.25, 0.78, edgeDistance);

            finalColor *= 1.0 - vignette * 0.55;

            gl_FragColor = vec4(
                finalColor,
                1.0
            );
        }
    `
});

const background = new THREE.Mesh(
    backgroundGeometry,
    backgroundMaterial
);

background.position.z = -45;

background.renderOrder = -1;

scene.add(background);

const glyphs = [
    "0", "1", "{", "}", "<", ">", "/", ";"
];

const glyphCount = glyphs.length;

const glyphCanvas = document.createElement("canvas");
const glyphContext = glyphCanvas.getContext("2d");

const glyphCellSize = 64;

glyphCanvas.width = glyphCellSize * glyphCount;
glyphCanvas.height = glyphCellSize;

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

for (let i = 0; i < glyphCount; i++) {

    const x =
        i * glyphCellSize +
        glyphCellSize / 2;

    glyphContext.fillText(
        glyphs[i],
        x,
        glyphCellSize / 2
    );
}

const glyphTexture = new THREE.CanvasTexture(
    glyphCanvas
);

glyphTexture.colorSpace = THREE.SRGBColorSpace;

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

const glyphIndices = new Float32Array(
    particleCount
);

const phases = new Float32Array(
    particleCount
);

const dataColors = [
    new THREE.Color(0x168bff),
    new THREE.Color(0x00c8ff),
    new THREE.Color(0x3980ff),
    new THREE.Color(0x45f3ff),
    new THREE.Color(0x5b9dff),
    new THREE.Color(0x2870e8)
];

for (let i = 0; i < particleCount; i++) {

    const i3 = i * 3;

    const z =
        (Math.random() - 0.5) * 30;

    const angle =
        Math.random() * FULL_CIRCLE;

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

    positions[i3 + 2] = z;

    const color =
        dataColors[
            Math.floor(
                Math.random() * dataColors.length
            )
        ];

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] =
        Math.random() < 0.12
            ? 1.5 + Math.random() * 0.5
            : 0.9 + Math.random() * 0.5;

    glyphIndices[i] =
        Math.floor(Math.random() * glyphCount);

    phases[i] =
        Math.random() * FULL_CIRCLE;
}

geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);

geometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(colors, 3)
);

geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sizes, 1)
);

geometry.setAttribute(
    "aGlyph",
    new THREE.BufferAttribute(glyphIndices, 1)
);

geometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(phases, 1)
);

const material = new THREE.ShaderMaterial({

    transparent: true,

    depthWrite: false,

    blending: THREE.AdditiveBlending,

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
        },
        uOpacity: {
            value: 1
        }
    },

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

            vColor = aColor;
            vGlyph = aGlyph;

            vec3 animatedPosition = position;

            animatedPosition.x +=
                sin(uTime * 0.45 + aPhase) * 0.045;

            animatedPosition.y +=
                cos(uTime * 0.35 + aPhase * 1.7) * 0.065;

            vec4 mvPosition =
                modelViewMatrix *
                vec4(animatedPosition, 1.0);

            gl_Position =
                projectionMatrix *
                mvPosition;

            gl_PointSize =
                clamp(
                    uSize * aSize / max(-mvPosition.z, 0.1),
                    1.0,
                    48.0
                );
        }
    `,

    fragmentShader: `
        uniform sampler2D uGlyphTexture;
        uniform float uGlyphCount;
        uniform float uOpacity;

        varying vec3 vColor;
        varying float vGlyph;

        void main() {

            vec2 uv = vec2(
                (vGlyph + gl_PointCoord.x) / uGlyphCount,
                gl_PointCoord.y
            );

            float glyphAlpha = texture2D(
                uGlyphTexture,
                uv
            ).a;

            vec2 glowOffset = vec2(
                2.0 / (64.0 * uGlyphCount),
                2.0 / 64.0
            );

            float glow = 0.0;

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(glowOffset.x, 0.0)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv - vec2(glowOffset.x, 0.0)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(0.0, glowOffset.y)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv - vec2(0.0, glowOffset.y)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + glowOffset
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv - glowOffset
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(glowOffset.x, -glowOffset.y)
                ).a
            );

            glow = max(
                glow,
                texture2D(
                    uGlyphTexture,
                    uv + vec2(-glowOffset.x, glowOffset.y)
                ).a
            );

            if (glyphAlpha < 0.02 && glow < 0.02) {
                discard;
            }

            float halo = max(
                glow - glyphAlpha,
                0.0
            );

            float softGlow = pow(
                halo,
                0.75
            );

            float innerGlow = pow(
                glyphAlpha,
                0.7
            );

            vec3 haloColor = mix(
                vColor,
                vec3(0.02, 0.85, 1.0),
                0.45
            );

            vec3 coreColor =
                vColor * 1.65;

            vec3 finalColor =
                coreColor * innerGlow +
                haloColor * softGlow * 0.95 +
                vColor * glyphAlpha * 0.45;

            float alpha = clamp(
                glyphAlpha * 0.95 +
                softGlow * 0.32,
                0.0,
                1.0
            ) * uOpacity;

            gl_FragColor = vec4(
                finalColor * uOpacity,
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

let isAnimationPaused = false;

let lastFrameTime = 0;

let frameInterval = 1000 / (window.innerWidth >= 3000 ? 35 : 60);

let hasSignaledBackgroundReady = false;

material.uniforms.uOpacity.value = 1;

function animate(currentTime) {

    requestAnimationFrame(animate);

    if (isAnimationPaused) {
        return;
    }

    if (currentTime - lastFrameTime < frameInterval) {
        return;
    }

    lastFrameTime = currentTime;

    particles.rotation.z += 0.0008;

    const elapsedTime =
        currentTime * 0.001;

    backgroundMaterial.uniforms.uTime.value =
        elapsedTime;

    material.uniforms.uTime.value =
        elapsedTime;

    const introProgress = Math.max(0, Math.min(1, motion.intro || 0));
    const scrollProgress = Math.max(0, Math.min(1.9, motion.scroll || 0));
    camera.position.z = cameraIntroZ
        - (cameraIntroZ - cameraHeroZ) * introProgress
        - cameraScrollDistance * scrollProgress;

    background.position.z = camera.position.z - 45;

    renderer.render(
        scene,
        camera
    );

    if (!hasSignaledBackgroundReady) {
        hasSignaledBackgroundReady = true;
        window._portfolioBackgroundReady = true;
        window.dispatchEvent(new Event("portfolio-background-ready"));
    }
}

document.addEventListener(
    "visibilitychange",
    () => {

        isAnimationPaused =
            document.visibilityState === "hidden";
    }
);

requestAnimationFrame(animate);

function handleResize() {

    frameInterval = 1000 / (window.innerWidth >= 3000 ? 35 : 60);

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const currentPixelRatio =
        window.innerWidth >= 3000 ? 1 :
            window.innerWidth >= 1920 ? 1.2 :
                window.innerWidth < 768 ? 1.25 : 1.5;

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            currentPixelRatio
        )
    );
}

window.addEventListener(
    "resize",
    handleResize
);