/**
 * ==========================================================
 * Phase 8
 * services/cacheSignature.js
 * Cache mémoire LRU des signatures
 * ==========================================================
 */

class CacheSignature {

    constructor(max = 5000) {

        this.max = max;
        this.cache = new Map();

    }

    get(cle) {

        if (!this.cache.has(cle))
            return null;

        const valeur = this.cache.get(cle);

        this.cache.delete(cle);
        this.cache.set(cle, valeur);

        return valeur;

    }

    set(cle, valeur) {

        if (this.cache.has(cle))
            this.cache.delete(cle);

        this.cache.set(cle, valeur);

        if (this.cache.size > this.max) {

            const premiereCle =
                this.cache.keys().next().value;

            this.cache.delete(premiereCle);

        }

    }

    has(cle) {
        return this.cache.has(cle);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }

}

module.exports = new CacheSignature(5000);