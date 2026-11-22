"use strict";

// L'accueil s'affiche après le chargement de la page et le premier rendu WebGL.

(() => {
    const loader = document.getElementById("loading-screen");
    if (!loader) return;

    const logo = document.getElementById("loading-logo");
    const progress = loader.querySelector(".loading-progress");
    const progressBar = loader.querySelector(".loading-progress-bar");
    const backgroundScript = document.getElementById("three-background-script");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    let pageLoaded = document.readyState === "complete";
    let backgroundReady = window.__portfolioBackgroundReady === true;
    let animationsReady = !window.__portfolioGsapReady;
    let finished = false;

    if (window.__portfolioGsapReady) {
        window.__portfolioGsapReady.then(() => {
            animationsReady = true;
            finishLoading();
        }, () => {
            animationsReady = true;
            finishLoading();
        });
    }

    if (logo) {
        logo.addEventListener("error", () => {
            logo.classList.add("is-unavailable");
        }, { once: true });
    }

    loader.classList.add("is-loading");

    const blockIntroScroll = (event) => {
        if (!document.body.classList.contains("hero-intro-pending")) return;
        if (event.cancelable) event.preventDefault();
        window.scrollTo(0, 0);
    };
    window.addEventListener("wheel", blockIntroScroll, { passive: false });
    window.addEventListener("touchmove", blockIntroScroll, { passive: false });
    window.addEventListener("keydown", (event) => {
        if (!document.body.classList.contains("hero-intro-pending")) return;
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
            event.preventDefault();
            window.scrollTo(0, 0);
        }
    }, { passive: false });
    window.addEventListener("scroll", () => {
        if (document.body.classList.contains("hero-intro-pending") && window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }
    }, { passive: true });

    function setProgress(value) {
        const safeValue = Math.max(0, Math.min(100, value));
        progressBar.classList.toggle("is-complete", safeValue >= 100);
        progress?.setAttribute("aria-valuenow", String(Math.round(safeValue)));
    }

    function finishLoading() {
        if (finished || !pageLoaded || !backgroundReady || !animationsReady) return;
        finished = true;

        loader.classList.remove("is-loading");
        setProgress(100);

        window.setTimeout(() => {
            window.dispatchEvent(new Event("portfolio-loader-hiding"));
            loader.classList.add("is-hidden");
            loader.setAttribute("aria-hidden", "true");
            window.setTimeout(() => {
                loader.remove();
                window.dispatchEvent(new Event("portfolio-loader-hidden"));
            }, 460);
        }, 180);
    }

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

    if (backgroundScript) {
        backgroundScript.addEventListener("error", () => {
            backgroundReady = true;
            finishLoading();
        }, { once: true });
    }

    window.setTimeout(() => {
        if (finished) return;
        backgroundReady = true;
        animationsReady = true;
        finishLoading();
    }, 12000);
})();
