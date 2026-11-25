# Portfolio

Je suis Enzo Camilo, étudiant en BUT Métiers du Multimédia et de l’Internet (MMI) à l’IUT de Tarbes. J’ai créé ce site pour présenter mon parcours, mes compétences et les projets que je réalise.

J’ai choisi un univers spatial pour le design du portfolio. C’est aussi l’occasion pour moi de travailler la 3D sur le web, les animations et les interactions en JavaScript.

**[Voir mon portfolio](https://enzo131106.github.io/Portfolio/)**

![Aperçu de mon portfolio](assets/images/portfolio-screenshot.webp)

## Le site

- Un fond spatial en 3D avec Three.js.
- Des animations au défilement avec GSAP et ScrollTrigger.
- Un carrousel de projets avec navigation manuelle et rotation automatique désactivable.
- Une frise chronologique de mon parcours scolaire et professionnel.
- Byte Invaders, un mini-jeu intégré à la page d’accueil.

Le site s’adapte aux ordinateurs et aux mobiles. J’ai aussi prévu une navigation au clavier et pris en compte les préférences de réduction des animations.

### Byte Invaders

J’ai intégré un petit jeu d’arcade inspiré de Space Invaders, réalisé en JavaScript avec Canvas 2D. Le but est de faire le meilleur score possible. Le record est enregistré dans le navigateur et il est possible de partager son score ou de le télécharger en PNG.

Pour jouer, utilise les flèches gauche et droite (ou Q/A et D) pour déplacer le vaisseau, et la barre d’espace pour tirer. Des commandes tactiles sont également disponibles sur mobile.

## Technologies

- HTML, CSS et JavaScript
- Bootstrap et Bootstrap Icons pour l’interface
- Three.js pour le décor 3D
- GSAP et ScrollTrigger pour les animations
- GitHub Pages pour l’hébergement

Le site est statique. Les bibliothèques JavaScript et CSS sont incluses dans le dépôt, sans dépendances à installer ni compilation.

## Lancer le site en local

Avec Git et Python 3 installés :

```bash
git clone https://github.com/Enzo131106/Portfolio.git
cd Portfolio
python -m http.server 8000
```

Ouvre ensuite [http://localhost:8000](http://localhost:8000) dans ton navigateur. Selon ton installation de Python, utilise `python3` ou `py` à la place de `python`.

Il vaut mieux passer par un serveur HTTP local plutôt que d’ouvrir directement `index.html`, notamment pour les modules JavaScript.

## Organisation du code

```text
Portfolio/
├── assets/
│   ├── css/          # Styles du site
│   ├── js/           # Animations, navigation et mini-jeu
│   ├── images/       # Photos et captures des projets
│   ├── icons/        # Logo et icônes
│   └── documents/   # Documents du portfolio
├── vendor/           # Bibliothèques et licences tierces
├── index.html        # Page principale
├── privacy.html
├── mentions-legales.html
├── 404.html
├── sitemap.xml
└── LICENSE
```

## Confidentialité

Le site n’utilise ni cookies de suivi ni outil de mesure d’audience. Le stockage local sert à mémoriser la fermeture du message de confidentialité et le record de Byte Invaders. La police Inter peut être chargée depuis Bunny Fonts.

Plus de détails dans la [politique de confidentialité](https://enzo131106.github.io/Portfolio/privacy.html) et les [mentions légales](https://enzo131106.github.io/Portfolio/mentions-legales.html).

## Droits et licences

Copyright © 2026 Enzo Camilo. Tous droits réservés.

Le code est accessible pour consultation et apprentissage, mais le dépôt n’est pas sous licence open source. Les conditions de réutilisation des créations originales sont précisées dans le fichier [LICENSE](LICENSE). Les ressources et bibliothèques tierces conservent leurs propres licences et [notices d’attribution](assets/icons/skills/NOTICE.txt).

## Contact

[LinkedIn](https://www.linkedin.com/in/enzo-camilo-4190a939b/) · [GitHub](https://github.com/Enzo131106) · [E-mail](mailto:enzo.camilo1306@gmail.com)
