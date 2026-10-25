"use strict";

(() => {
    const loader = document.getElementById("loading-screen");
    if (!loader) return;

    const logo = document.getElementById("loading-logo");
    const progress = loader.querySelector(".loading-progress");
    const progressBar = loader.querySelector(".loading-progress-bar");
    const backgroundScript = document.getElementById("three-background-script");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Le hero HTML reste visible pendant le travelling : texte et mini-jeu conservent
    // exactement leur mise en page réelle, sans maquette intermédiaire.

    let pageLoaded = document.readyState === "complete";
    let backgroundReady = window.__portfolioBackgroundReady === true;
    let finished = false;

    // Masque le cadre du logo si le fichier n'a pas encore été ajouté.
    if (logo) {
        logo.addEventListener("error", () => {
            logo.classList.add("is-unavailable");
        }, { once: true });
    }

    loader.classList.add("is-loading");

    function setProgress(value) {
        const safeValue = Math.max(0, Math.min(100, value));
        progressBar.classList.toggle("is-complete", safeValue >= 100);
        progress?.setAttribute("aria-valuenow", String(Math.round(safeValue)));
    }

    function finishLoading() {
        if (finished || !pageLoaded || !backgroundReady) return;
        finished = true;

        loader.classList.remove("is-loading");
        setProgress(100);

        window.setTimeout(() => {
            // Préviens le fond au début du fondu : le travelling commence derrière le loader,
            // afin que la caméra soit déjà en mouvement quand le vortex se découvre.
            window.dispatchEvent(new Event("portfolio-loader-hiding"));
            loader.classList.add("is-hidden");
            loader.setAttribute("aria-hidden", "true");
            window.setTimeout(() => {
                loader.remove();
                window.dispatchEvent(new Event("portfolio-loader-hidden"));
            }, 460);
        }, 180);
    }

    // La progression reste animée tant que les ressources ne sont pas prêtes.
    function onPageLoad() {
        pageLoaded = true;
        setProgress(88);
        finishLoading();
    }

    function onBackgroundReady() {
        backgroundReady = true;
        setProgress(pageLoaded ? 100 : 88);
        finishLoading();
    }

    if (pageLoaded) {
        setProgress(88);
    } else {
        window.addEventListener("load", onPageLoad, { once: true });
    }

    if (backgroundReady) {
        setProgress(pageLoaded ? 100 : 88);
    } else {
        window.addEventListener("portfolio-background-ready", onBackgroundReady, { once: true });
    }

    // Si le module Three.js échoue, ne bloque pas indéfiniment le contenu du site.
    if (backgroundScript) {
        backgroundScript.addEventListener("error", () => {
            backgroundReady = true;
            finishLoading();
        }, { once: true });
    }

    // Secours en cas d'échec WebGL ou d'initialisation du fond.
    window.setTimeout(() => {
        if (finished) return;
        // En cas de souci WebGL, on attend toujours window.load, mais on ne bloque pas ensuite.
        backgroundReady = true;
        finishLoading();
    }, 8000);
})();
