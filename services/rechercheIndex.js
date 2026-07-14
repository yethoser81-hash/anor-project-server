/**
 * ==========================================================
 * services/rechercheIndex.js
 * ANOR V14
 * Recherche intelligente optimisée via indexManager injecté
 * ==========================================================
 */

class RechercheIndex {

    constructor(indexManager) {

        this.indexManager = indexManager;

    }

    async rechercher(lecture) {

        if (
            !lecture ||
            !lecture.index_geometrique
        ) {
            return [];
        }

        return this.indexManager.rechercher(
            lecture.index_geometrique
        );

    }

}

module.exports = RechercheIndex;