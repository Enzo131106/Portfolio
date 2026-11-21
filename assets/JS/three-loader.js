"use strict";

// On essaie le CDN avant la copie locale pour rester utilisable hors connexion au CDN.
let THREE;

try {

    THREE = await import(
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
    );

} catch (error) {

    console.warn(
        "Échec du chargement de Three.js depuis le CDN."
    );
    console.info(
        "Chargement de Three.js depuis le fichier local."
    );
    THREE = await import(
        "../../vendor/three/three.module.js"
    );
}

// Le fond importe toujours le même module, quelle que soit la source retenue.
export default THREE;