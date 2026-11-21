"use strict";

(() => {
    // On ne surveille que les liens qui pointent vers une section existante.
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

        // Le lien devient actif quand sa section dépasse environ 40 % de la hauteur d'écran.
        const activationPoint = window.innerHeight * 0.4;
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

    // On limite les mises à jour à une par image pendant le scroll.
    function scheduleActiveLinkUpdate() {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(updateActiveLink);
    }

    window.addEventListener("scroll", scheduleActiveLinkUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveLinkUpdate, { passive: true });
    window.addEventListener("load", updateActiveLink);

    updateActiveLink();
})();
