"use strict";

(() => {
    const navigationLinks = document.querySelectorAll(
        '.navbar-nav .nav-link[href^="#"]'
    );

    if (!navigationLinks.length) return;

    const navigationItems = [...navigationLinks]
        .map(link => ({
            link,
            section: document.querySelector(link.getAttribute("href"))
        }))
        .filter(item => item.section);

    if (!navigationItems.length) return;

    let scrollFrame = 0;

    function updateActiveLink() {
        scrollFrame = 0;

        const activationPoint = document.body.classList.contains("depth-stage-active")
            ? 2
            : window.innerHeight * 0.4;
        let activeItem = navigationItems[0];

        navigationItems.forEach(item => {
            if (item.section.getBoundingClientRect().top <= activationPoint) {
                activeItem = item;
            }
        });

        navigationItems.forEach(item => {
            const isActive = item === activeItem;

            item.link.classList.toggle("active", isActive);

            if (isActive) {
                item.link.setAttribute("aria-current", "location");
            } else {
                item.link.removeAttribute("aria-current");
            }
        });
    }

    function scheduleActiveLinkUpdate() {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(updateActiveLink);
    }

    // The animated sections are scroll markers, not the actual fixed content.
    // On touch devices, jump to the marker without native anchor panning.
    const touchViewport = window.matchMedia("(pointer: coarse)");
    function navigateToDepthSection(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
            event.ctrlKey || event.shiftKey || event.altKey ||
            !touchViewport.matches || !document.body.classList.contains("depth-stage-active") ||
            document.body.classList.contains("hero-intro-pending")) return;

        const hash = event.currentTarget.getAttribute("href");
        const section = document.querySelector(hash);
        if (!section) return;

        event.preventDefault();
        const root = document.scrollingElement || document.documentElement;
        const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
        const target = Math.max(0, Math.min(maxScroll,
            section.getBoundingClientRect().top + window.scrollY));

        if (location.hash !== hash) history.pushState(null, "", hash);
        window.scrollTo({ top: target, behavior: "instant" });
        scheduleActiveLinkUpdate();
    }

    navigationItems.forEach(({ link }) => link.addEventListener("click", navigateToDepthSection));
    document.querySelector(".hero-scroll")?.addEventListener("click", navigateToDepthSection);

    window.addEventListener("scroll", scheduleActiveLinkUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveLinkUpdate, { passive: true });
    window.addEventListener("load", updateActiveLink);

    updateActiveLink();
})();
