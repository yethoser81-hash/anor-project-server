const BIBLIOTHEQUE_FORMES = [

    {
        nom: "cercle",
        valeur: 10
    },

    {
        nom: "carre",
        valeur: 20
    },

    {
        nom: "rectangle",
        valeur: 30
    },

    {
        nom: "triangle",
        valeur: 40
    },

    {
        nom: "losange",
        valeur: 50
    },

    {
        nom: "croix",
        valeur: 60
    },

    {
        nom: "demi_cercle",
        valeur: 70
    },

    {
        nom: "barre_verticale",
        valeur: 80
    }

];

if (typeof module !== "undefined" && module.exports) {
    module.exports = BIBLIOTHEQUE_FORMES;
}

if (typeof window !== "undefined") {
    window.BIBLIOTHEQUE_FORMES = BIBLIOTHEQUE_FORMES;
}