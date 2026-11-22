"use strict";

// Dépendances externes avec ressources locales de secours (Bootstrap, Inter, GSAP).

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

function activateLocalInter() {
    console.warn("Inter CDN indisponible : activation de la police locale.");

    document.documentElement.classList.add("inter-local-fallback");
}

if (interFonts) {
    interFonts.addEventListener("error", activateLocalInter);

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


function loadAnimationLibrary(cdn, local, isReady) {
    return new Promise(resolve => {
        const remote = document.createElement("script");
        remote.src = cdn;

        let finished = false;
        let usingLocal = false;
        let timeoutId;

        function finish(success) {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeoutId);
            resolve(success);
        }

        function useLocal() {
            if (finished || usingLocal) return;
            usingLocal = true;
            window.clearTimeout(timeoutId);

            remote.onload = null;
            remote.onerror = null;
            remote.remove();

            console.warn(`CDN indisponible : ${cdn}. Essai de ${local}.`);
            const backup = document.createElement("script");
            backup.src = local;
            backup.onload = () => finish(isReady());
            backup.onerror = () => {
                console.error(`Impossible de charger ${local}.`);
                finish(false);
            };
            document.head.appendChild(backup);
        }

        remote.onload = () => {
            if (isReady()) finish(true);
            else useLocal();
        };
        remote.onerror = useLocal;
        timeoutId = window.setTimeout(useLocal, 5000);
        document.head.appendChild(remote);
    });
}

const animationSources = document.currentScript?.dataset;
window.__portfolioGsapReady = (async () => {
    const gsapLoaded = await loadAnimationLibrary(
        animationSources.gsapCdn,
        "./vendor/gsap/gsap.min.js",
        () => typeof window.gsap?.registerPlugin === "function"
    );
    if (!gsapLoaded) return false;

    const scrollTriggerLoaded = await loadAnimationLibrary(
        animationSources.scrolltriggerCdn,
        "./vendor/gsap/ScrollTrigger.min.js",
        () => typeof window.ScrollTrigger?.create === "function"
    );
    if (!scrollTriggerLoaded) return false;

    window.gsap.registerPlugin(window.ScrollTrigger);
    return true;
})();
