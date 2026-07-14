/**
 * ==========================================================
 * services/indexInverse.js
 * ANOR V13
 * Index mémoire inversé
 * ==========================================================
 */

class IndexInverse {

    constructor() {

        this.prefix16 = new Map();
        this.prefix24 = new Map();
        this.sha256 = new Map();

    }

    construire(produits) {

        this.prefix16.clear();
        this.prefix24.clear();
        this.sha256.clear();

        for (const produit of produits) {

            const index = produit.index_geometrique;

            if (!index)
                continue;

            this.ajouter(
                this.prefix16,
                index.prefix16,
                produit
            );

            this.ajouter(
                this.prefix24,
                index.prefix24,
                produit
            );

            this.sha256.set(
                index.sha256,
                produit
            );

        }

    }

    ajouter(map, cle, produit) {

        if (!cle)
            return;

        if (!map.has(cle))
            map.set(cle, []);

        map.get(cle).push(produit);

    }

    rechercher(index) {

        if (!index)
            return [];

        if (
            index.sha256 &&
            this.sha256.has(index.sha256)
        ) {

            return [
                this.sha256.get(index.sha256)
            ];

        }

        if (
            index.prefix24 &&
            this.prefix24.has(index.prefix24)
        ) {

            return this.prefix24.get(
                index.prefix24
            );

        }

        if (
            index.prefix16 &&
            this.prefix16.has(index.prefix16)
        ) {

            return this.prefix16.get(
                index.prefix16
            );

        }

        return [];

    }

}

module.exports = new IndexInverse();