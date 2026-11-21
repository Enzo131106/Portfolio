"use strict";

// Si un style distant échoue, on charge sa copie locale sans bloquer la page.
function loadCSSWithFallback(element, local) {

    element.addEventListener("error", () => {

        console.warn(`Échec du chargement CDN : ${element.href}`);
        console.info(`Chargement du fichier local : ${local}`);

        const fallback = document.createElement("link");

        fallback.rel = "stylesheet";
        fallback.href = local;

        document.head.appendChild(fallback);
    });
}

// Même principe pour les scripts qui ont une version locale.
function loadJSWithFallback(element, local) {

    element.addEventListener("error", () => {

        console.warn(`Échec du chargement CDN : ${element.src}`);
        console.info(`Chargement du fichier local : ${local}`);

        const fallback = document.createElement("script");

        fallback.src = local;
        fallback.defer = true;

        document.body.appendChild(fallback);
    });
}

// Bootstrap et ses icônes utilisent le CDN tant qu'il répond.
const bootstrapCSS = document.getElementById("bootstrap-css");

if (bootstrapCSS) {

    loadCSSWithFallback(
        bootstrapCSS,
        "./vendor/bootstrap/bootstrap.min.css"
    );
}

const bootstrapIcons = document.getElementById("bootstrap-icons");

if (bootstrapIcons) {

    loadCSSWithFallback(
        bootstrapIcons,
        "./vendor/bootstrap-icons/bootstrap-icons.min.css"
    );
}

const bootstrapJS = document.getElementById("bootstrap-js");

if (bootstrapJS) {

    loadJSWithFallback(
        bootstrapJS,
        "./vendor/bootstrap/bootstrap.bundle.min.js"
    );
}

const interFonts = document.getElementById("inter-fonts");

// La classe CSS active la police locale quand Bunny Fonts ne fournit pas Inter.
function activateLocalInter() {
    console.warn("Inter CDN indisponible : activation de la police locale.");

    document.documentElement.classList.add("inter-local-fallback");
}

if (interFonts) {
    interFonts.addEventListener("error", activateLocalInter);

    // Une feuille chargée ne garantit pas que la police soit vraiment disponible.
    interFonts.addEventListener("load", async () => {
        try {
            const faces = await document.fonts.load("700 16px Inter");

            if (!faces.length || faces.every(face => face.status !== "loaded")) {
                activateLocalInter();
            }
        } catch {
            activateLocalInter();
        }
    });
}
