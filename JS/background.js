"use strict";

import THREE from "./three-loader.js";

// Définit la valeur correspondant à un cercle complet en radians.
const FULL_CIRCLE = Math.PI * 2;

// Détermine le type d'appareil selon la largeur de l'écran.
const isMobile = window.innerWidth < 768;
const isTablet =
    window.innerWidth >= 768 &&
    window.innerWidth < 1024;

// Définit le nombre d'étoiles selon le type d'appareil.
const particleCount =
    isMobile ? 2800 :
        isTablet ? 3600 :
            4500;

// Définit le nombre de particules de nébuleuse selon le type d'appareil.
const nebulaCount =
    isMobile ? 400 :
        isTablet ? 550 :
            700;

// Définit la taille globale des étoiles selon le type d'appareil.
const particleSize =
    isMobile ? 105.0 :
        isTablet ? 85.0 :
            75.0;

// Initialise la scène principale qui contient tous les éléments 3D.
const scene = new THREE.Scene();

// Définit la couleur de fond de l'espace.
scene.background = new THREE.Color(0x070b18);

// Ajoute une brume légère pour atténuer progressivement les éléments éloignés.
scene.fog = new THREE.FogExp2(
    0x070b18,
    0.008
);

// Initialise la caméra avec une perspective 3D.
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Place la caméra légèrement en arrière de la scène.
camera.position.z = 5;

// Initialise le moteur de rendu WebGL.
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

// Adapte le rendu à la taille de la fenêtre.
renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

// Limite la résolution du rendu pour éviter une consommation excessive de ressources.
const initialPixelRatio =
    window.innerWidth < 768 ? 1.5 :
        window.innerWidth < 1024 ? 1.75 :
            2;

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        initialPixelRatio
    )
);

// Ajoute le canvas WebGL à la page.
document.body.appendChild(renderer.domElement);

// Crée la structure qui contiendra les données géométriques des particules.
const geometry = new THREE.BufferGeometry();

// Stocke les coordonnées 3D de chaque étoile.
const positions = new Float32Array(
    particleCount * 3
);

// Stocke la couleur de chaque étoile.
const colors = new Float32Array(
    particleCount * 3
);

// Stocke la taille individuelle de chaque étoile.
const sizes = new Float32Array(
    particleCount
);

// Définit la palette de couleurs naturelles utilisées pour les étoiles.
const starColors = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xddeaff),
    new THREE.Color(0xb8d4ff),
    new THREE.Color(0xfff1d0),
    new THREE.Color(0xffc58a)
];

// Génère aléatoirement la position, la couleur et la taille de chaque étoile.
for (let i = 0; i < particleCount; i++) {

    // Permet d'accéder aux trois valeurs X, Y et Z de l'étoile actuelle.
    const i3 = i * 3;

    // Définit la profondeur de l'étoile dans le vortex.
    const z =
        (Math.random() - 0.5) * 30;

    // Définit l'angle de l'étoile autour de l'axe central du vortex.
    const angle =
        Math.random() * FULL_CIRCLE;

    // Définit la distance de base entre l'étoile et le centre du vortex.
    const radius =
        2.5 + Math.random() * 4.5;

    // Ajoute une variation aléatoire pour éviter un cercle parfaitement régulier.
    const variation =
        (Math.random() - 0.5) * 0.8;

    // Calcule la position horizontale de l'étoile à partir de son angle et de son rayon.
    positions[i3] =
        Math.cos(angle) *
        (radius + variation);

    // Calcule la position verticale de l'étoile à partir de son angle et de son rayon.
    positions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

    // Enregistre la profondeur de l'étoile.
    positions[i3 + 2] =
        z;

    // Sélectionne aléatoirement une couleur dans la palette disponible.
    const color =
        starColors[
        Math.floor(
            Math.random() *
            starColors.length
        )
        ];

    // Enregistre la couleur de l'étoile.
    colors[i3] =
        color.r;

    colors[i3 + 1] =
        color.g;

    colors[i3 + 2] =
        color.b;

    // Définit la taille de l'étoile avec une faible probabilité d'obtenir une étoile plus imposante.
    if (Math.random() < 0.08) {

        // Crée une étoile légèrement plus grande que la majorité.
        sizes[i] =
            5.5 +
            Math.random() * 3.5;

    } else {

        // Crée une étoile de taille standard.
        sizes[i] =
            4.0 +
            Math.random() * 2.5;
    }
}

// Associe les positions des étoiles à la géométrie.
geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        positions,
        3
    )
);

// Associe les couleurs des étoiles à la géométrie.
geometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(
        colors,
        3
    )
);

// Associe les tailles individuelles des étoiles à la géométrie.
geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
        sizes,
        1
    )
);

// Crée le matériau personnalisé utilisé pour afficher les étoiles.
const material = new THREE.ShaderMaterial({

    // Autorise la transparence des particules.
    transparent: true,

    // Empêche les particules transparentes d'écrire dans le depth buffer.
    depthWrite: false,

    // Additionne les lumières des particules pour créer un effet lumineux.
    blending:
        THREE.AdditiveBlending,

    // Définit les valeurs envoyées au shader.
    uniforms: {
        uSize: {
            value: particleSize
        }
    },

    // Définit la position et la taille des particules directement sur le GPU.
    vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;

        varying vec3 vColor;

        uniform float uSize;

        void main() {

            // Transmet la couleur de l'étoile au fragment shader.
            vColor = aColor;

            // Transforme la position de l'étoile dans l'espace de la caméra.
            vec4 mvPosition =
                modelViewMatrix *
                vec4(position, 1.0);

            // Convertit la position dans l'espace visible par la caméra.
            gl_Position =
                projectionMatrix *
                mvPosition;

            // Calcule la taille apparente de l'étoile en fonction de sa distance.
            gl_PointSize =
                uSize *
                aSize /
                5.0 /
                -mvPosition.z;
        }
    `,

    // Définit l'apparence visuelle de chaque particule.
    fragmentShader: `
        varying vec3 vColor;

        void main() {

            // Convertit les coordonnées de la particule en coordonnées centrées autour de son centre.
            vec2 uv =
                gl_PointCoord * 2.0 - 1.0;

            // Calcule la distance entre le pixel actuel et le centre de la particule.
            float d =
                length(uv);

            // Supprime les pixels situés en dehors de la forme circulaire de la particule.
            if (d > 1.0) {
                discard;
            }

            // Crée le cœur lumineux de l'étoile.
            float core =
                1.0 -
                smoothstep(
                    0.0,
                    0.12,
                    d
                );

            // Crée une zone lumineuse plus large autour du cœur.
            float glow =
                1.0 -
                smoothstep(
                    0.05,
                    0.85,
                    d
                );

            // Renforce le centre du halo pour obtenir une lumière plus concentrée.
            glow =
                pow(glow, 4.0);

            // Combine le cœur et le halo pour calculer la transparence finale.
            float alpha =
                core * 0.95 +
                glow * 0.22;

            // Applique la couleur et la transparence finales au pixel.
            gl_FragColor =
                vec4(
                    vColor,
                    alpha
                );
        }
    `
});

// Crée le système de particules à partir de la géométrie et du matériau.
const particles =
    new THREE.Points(
        geometry,
        material
    );

// Ajoute le système d'étoiles à la scène.
scene.add(particles);

// Crée la géométrie contenant les particules de la nébuleuse.
const nebulaGeometry =
    new THREE.BufferGeometry();

// Stocke les positions 3D des particules de la nébuleuse.
const nebulaPositions =
    new Float32Array(
        nebulaCount * 3
    );

// Stocke les couleurs des particules de la nébuleuse.
const nebulaColors =
    new Float32Array(
        nebulaCount * 3
    );

// Stocke les tailles des particules de la nébuleuse.
const nebulaSizes =
    new Float32Array(
        nebulaCount
    );

// Définit la palette sombre utilisée pour la nébuleuse.
const nebulaPalette = [
    new THREE.Color(0x172b52),
    new THREE.Color(0x203866),
    new THREE.Color(0x2d315f),
    new THREE.Color(0x35274f),
    new THREE.Color(0x193b55)
];

// Génère aléatoirement les particules composant la nébuleuse.
for (let i = 0; i < nebulaCount; i++) {

    // Permet d'accéder aux trois valeurs X, Y et Z de la particule actuelle.
    const i3 = i * 3;

    // Définit la profondeur de la particule dans le vortex.
    const z =
        (Math.random() - 0.5) * 30;

    // Définit la distance de base de la particule par rapport au centre.
    const radius =
        1.5 +
        Math.random() * 5.5;

    // Définit l'angle de la particule autour du centre du vortex.
    const angle =
        Math.random() * FULL_CIRCLE;

    // Ajoute une variation importante pour créer un nuage irrégulier.
    const variation =
        (Math.random() - 0.5) * 2.5;

    // Calcule la position horizontale de la particule.
    nebulaPositions[i3] =
        Math.cos(angle) *
        (radius + variation);

    // Calcule la position verticale de la particule.
    nebulaPositions[i3 + 1] =
        Math.sin(angle) *
        (radius + variation);

    // Enregistre la profondeur de la particule.
    nebulaPositions[i3 + 2] =
        z;

    // Sélectionne aléatoirement une couleur de la palette de la nébuleuse.
    const color =
        nebulaPalette[
        Math.floor(
            Math.random() *
            nebulaPalette.length
        )
        ];

    // Enregistre la couleur de la particule.
    nebulaColors[i3] =
        color.r;

    nebulaColors[i3 + 1] =
        color.g;

    nebulaColors[i3 + 2] =
        color.b;

    // Définit une taille relativement importante pour chaque particule de brume.
    nebulaSizes[i] =
        35 +
        Math.random() * 55;
}

// Associe les positions à la géométrie de la nébuleuse.
nebulaGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        nebulaPositions,
        3
    )
);

// Associe les couleurs à la géométrie de la nébuleuse.
nebulaGeometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(
        nebulaColors,
        3
    )
);

// Associe les tailles à la géométrie de la nébuleuse.
nebulaGeometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
        nebulaSizes,
        1
    )
);

// Crée le matériau personnalisé utilisé pour afficher la nébuleuse.
const nebulaMaterial =
    new THREE.ShaderMaterial({

        // Autorise la transparence des particules.
        transparent: true,

        // Empêche les particules transparentes d'écrire dans le depth buffer.
        depthWrite: false,

        // Additionne les particules pour renforcer les zones où elles se superposent.
        blending:
            THREE.AdditiveBlending,

        // Calcule la position et la taille des particules de brume.
        vertexShader: `
            attribute vec3 aColor;
            attribute float aSize;

            varying vec3 vColor;

            void main() {

                // Transmet la couleur au fragment shader.
                vColor = aColor;

                // Transforme la position dans l'espace de la caméra.
                vec4 mvPosition =
                    modelViewMatrix *
                    vec4(position, 1.0);

                // Convertit la position dans l'espace visible par la caméra.
                gl_Position =
                    projectionMatrix *
                    mvPosition;

                // Définit la taille apparente de la particule selon sa distance.
                gl_PointSize =
                    aSize *
                    (35.0 / -mvPosition.z);
            }
        `,

        // Définit l'apparence douce et diffuse des particules de brume.
        fragmentShader: `
            varying vec3 vColor;

            void main() {

                // Centre les coordonnées de la particule autour de son origine.
                vec2 uv =
                    gl_PointCoord * 2.0 - 1.0;

                // Calcule la distance du pixel par rapport au centre.
                float d =
                    length(uv);

                // Supprime les pixels situés en dehors de la particule circulaire.
                if (d > 1.0) {
                    discard;
                }

                // Crée une transition douce entre le centre et le bord.
                float cloud =
                    1.0 -
                    smoothstep(
                        0.0,
                        1.0,
                        d
                    );

                // Rend la luminosité plus concentrée au centre de la particule.
                cloud =
                    pow(cloud, 2.8);

                // Applique la couleur et la faible opacité de la brume.
                gl_FragColor =
                    vec4(
                        vColor,
                        cloud * 0.045
                    );
            }
        `
    });

// Crée le système de particules représentant la nébuleuse.
const nebula =
    new THREE.Points(
        nebulaGeometry,
        nebulaMaterial
    );

// Ajoute la nébuleuse à la scène.
scene.add(nebula);

// Indique si l'animation doit actuellement être exécutée.
let isAnimationPaused = false;

// Fonction principale exécutée à chaque image.
function animate() {

    // Demande au navigateur de rappeler cette fonction à la prochaine image.
    requestAnimationFrame(animate);

    // Arrête le rendu lorsque l'onglet n'est plus visible.
    if (isAnimationPaused) {
        return;
    }

    // Fait tourner très lentement le vortex d'étoiles.
    particles.rotation.z += 0.0008;

    // Fait tourner la nébuleuse dans la direction opposée.
    nebula.rotation.z -= 0.00018;

    // Dessine la scène depuis le point de vue de la caméra.
    renderer.render(
        scene,
        camera
    );
}

// Détecte lorsque l'utilisateur quitte ou revient sur l'onglet.
document.addEventListener(
    "visibilitychange",
    () => {

        // Met l'animation en pause lorsque la page devient invisible.
        isAnimationPaused =
            document.visibilityState === "hidden";

        console.log(
            isAnimationPaused
                ? "⏸️ Animation en pause"
                : "▶️ Animation reprise"
        );
    }
);

// Lance la boucle d'animation.
animate();

// Recalcule les dimensions du rendu lors du redimensionnement de la fenêtre.
function handleResize() {

    // Met à jour les dimensions de la caméra.
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Met à jour les dimensions du canvas.
    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    // Recalcule le pixel ratio selon la nouvelle largeur.
    const currentPixelRatio =
        window.innerWidth < 768 ? 1.5 :
            window.innerWidth < 1024 ? 1.75 :
                2;

    // Limite le pixel ratio à la valeur réelle de l'écran.
    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            currentPixelRatio
        )
    );
}

// Écoute les changements de dimensions de la fenêtre.
window.addEventListener("resize", handleResize);