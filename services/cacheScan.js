/**
 * ==========================================================
 * services/cacheScan.js
 * ANOR V14
 * Cache LRU des scans
 * ==========================================================
 */

class CacheScan {

    constructor(max = 1000) {

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

            const premier =
                this.cache.keys().next().value;

            this.cache.delete(premier);

        }

    }

}

module.exports = new CacheScan();