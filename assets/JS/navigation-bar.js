"use strict";

// Seuls les liens d'ancrage de la navigation participent au suivi des sections.
const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

const sections = [...navLinks]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(section => section !== null);

function updateActiveSection() {
    if (!sections.length) return;

    const screenPosition = window.innerHeight * 0.4;
    let currentSection = sections[0];

    sections.forEach(section => {
        if (section.getBoundingClientRect().top <= screenPosition) {
            currentSection = section;
        }
    });

    navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${currentSection.id}`;
        link.classList.toggle('active', isActive);

        if (isActive) {
            link.setAttribute('aria-current', 'location');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

window.addEventListener('scroll', updateActiveSection, { passive: true });
window.addEventListener('load', updateActiveSection);
updateActiveSection();
