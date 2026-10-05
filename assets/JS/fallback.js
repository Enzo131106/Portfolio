"use strict";

// Charge une feuille CSS locale si la feuille CSS du CDN échoue.
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

// Charge un script JavaScript local si le script JavaScript du CDN échoue.
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

// Bootstrap CSS
// CDN en priorité → fichier local en cas d'échec.
const bootstrapCSS = document.getElementById("bootstrap-css");

if (bootstrapCSS) {

    loadCSSWithFallback(
        bootstrapCSS,
        "./vendor/bootstrap/bootstrap.min.css"
    );
}

// Bootstrap Icons
// CDN en priorité → fichier local en cas d'échec.
const bootstrapIcons = document.getElementById("bootstrap-icons");

if (bootstrapIcons) {

    loadCSSWithFallback(
        bootstrapIcons,
        "./vendor/bootstrap-icons/bootstrap-icons.min.css"
    );
}

// Bootstrap JavaScript
// CDN en priorité → fichier local en cas d'échec.
const bootstrapJS = document.getElementById("bootstrap-js");

if (bootstrapJS) {

    loadJSWithFallback(
        bootstrapJS,
        "./vendor/bootstrap/bootstrap.bundle.min.js"
    );
}