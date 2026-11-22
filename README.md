# Portfolio — Enzo Camilo

Site personnel de présentation de mes projets et de mes compétences en développement web, réalisé pendant ma formation MMI à l'IUT de Tarbes.

**Site en ligne :** https://enzo131106.github.io/Portfolio/

## Technologies

HTML5, CSS3, JavaScript, Bootstrap, Three.js et GSAP (avec ScrollTrigger).

Le projet utilise uniquement des fichiers statiques : aucun framework applicatif, bundler ou serveur de production n'est nécessaire.

## Fonctionnalités

- Accueil animé avec un fond spatial WebGL réalisé avec Three.js.
- Transitions en profondeur synchronisées avec le défilement grâce à GSAP.
- Carrousel de projets 3D sur ordinateur, navigation tactile sur mobile.
- Mini-jeu Byte Invaders en Canvas, jouable au clavier.
- Mise en page responsive et prise en compte de la préférence de réduction des animations.
- Ressources locales de secours pour les dépendances chargées depuis les CDN.

## Organisation

```text
index.html                    Accueil et projets
privacy.html                  Page de confidentialité
assets/
  css/                        Styles par composant
  js/
    space-background.js       Scène et animation Three.js
    three-loader.js           Chargement de Three.js avec secours local
    scroll-depth.js           Transitions GSAP entre les sections
    projects-carousel.js      Rotation 3D et navigation des cartes
    byte-invaders.js          Logique du mini-jeu
    resource-loader.js        Chargement des dépendances et secours CDN
    scroll-restoration.js     Retour en haut lors d'un rechargement
    loading-screen.js         Séquence de chargement
  images/                     Captures d'écran et photos
  icon/                       Logo et icônes des technologies
vendor/                       Copies locales des bibliothèques et polices
```

Les noms des fichiers et dossiers sont en minuscules et en kebab-case. Les classes CSS et les attributs `data-*` décrivent le rôle des composants ; les identifiants HTML servent aux ancres et aux associations d'accessibilité.

## Développement local

Ouvrir le projet avec un serveur HTTP local (nécessaire au chargement des modules JavaScript) :

```bash
python3 -m http.server 8000
```

Puis visiter http://localhost:8000/.

Le déploiement se fait directement depuis la branche `main` avec GitHub Pages.

## Contenus à compléter

Les cartes 02 à 06 conservent pour le moment des textes de démonstration. Les sections « Parcours » et « Contact » disposent d'ancres de navigation mais ne contiennent pas encore de contenu.

Le bouton « Télécharger mon CV » pointe vers `assets/documents/CV-Enzo-Camilo.pdf`. Ce fichier doit être ajouté au dépôt pour que le téléchargement fonctionne.

## Crédits

Les icônes de technologies présentes dans `assets/icon/skills/` sont accompagnées de leur notice de licence dans `NOTICE.txt`. Les bibliothèques tierces sont conservées dans `vendor/`.
