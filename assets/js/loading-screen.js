"use strict";

(() => {
    const loader = document.getElementById("loading-screen");
    if (!loader) return;

    const logo = document.getElementById("loading-logo");
    const progress = loader.querySelector(".loading-progress");
    const progressBar = loader.querySelector(".loading-progress-bar");


    let pageLoaded = document.readyState === "complete";
    let backgroundReady = window._portfolioBackgroundReady === true;
    let animationsReady = false;
    let finished = false;

    function onDocumentReady() {
        Promise.resolve(window._portfolioGsapReady).then(onAnimationsReady, onAnimationsReady);
    }

    function onAnimationsReady() {
        animationsReady = true;
        finishLoading();
    }

    document.addEventListener("DOMContentLoaded", onDocumentReady, { once: true });

    if (logo) {
        logo.addEventListener("error", () => {
            logo.classList.add("is-unavailable");
        }, { once: true });
    }

    document.body.classList.add("hero-intro-pending");
    loader.hidden = false;
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
                window.setTimeout(() => {
                    if (document.body.classList.contains("hero-intro-pending")) {
                        document.body.classList.remove("hero-intro-pending");
                        document.querySelector(".hero-scroll")?.classList.add("is-ready");
                    }
                }, 4000);
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

    document.addEventListener("error", event => {
        if (event.target?.id !== "three-background-script") return;
        backgroundReady = true;
        finishLoading();
    }, true);

    window.setTimeout(() => {
        if (finished) return;
        pageLoaded = true;
        backgroundReady = true;
        animationsReady = true;
        finishLoading();
    }, 12000);
})();
