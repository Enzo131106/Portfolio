"use strict";

// Récupération des liens de navigation
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

// Récupération des sections ciblées par les liens
const sections = [...navLinks]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(section => section !== null);

// Détection de la section visible au défilement
function updateActiveSection() {
    const screenPosition = window.innerHeight * 0.4;
    let currentSection = sections[0];

    sections.forEach(section => {
        if (section.getBoundingClientRect().top <= screenPosition) {
            currentSection = section;
        }
    });

    // Mise à jour du lien actif
    navLinks.forEach(link => {
        const isActive = currentSection &&
            link.getAttribute('href') === `#${currentSection.id}`;

        link.classList.toggle('active', isActive);
    });
}

// Actualisation au scroll et au chargement
window.addEventListener('scroll', updateActiveSection, { passive: true });
window.addEventListener('load', updateActiveSection);
updateActiveSection();