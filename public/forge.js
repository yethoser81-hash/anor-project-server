/**
 * ==========================================================
 * forge.js
 * ANOR V10
 * Contrôleur interface Forge
 * ==========================================================
 */

async function calculerHash(texte){

    const encoder =
    new TextEncoder();

    const data =
    encoder.encode(texte);


    const hashBuffer =
    await crypto.subtle.digest(
        "SHA-256",
        data
    );


    return Array.from(
        new Uint8Array(hashBuffer)
    )
    .map(
        b=>b.toString(16).padStart(2,"0")
    )
    .join("");

}

/* ==========================================================
   LISTE DES PAYS
========================================================== */

const PAYS_MONDE = [
    "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Angola", "Arabie Saoudite", "Argentine", "Australie", "Autriche", 
    "Belgique", "Bénin", "Bolivie", "Brésil", "Bulgarie", "Burkina Faso", "Burundi", "Cameroun", "Canada", "Cap-Vert", "Chili", "Chine", 
    "Colombie", "Comores", "Congo", "Côte d'Ivoire", "Croatie", "Danemark", "Égypte", "Émirats arabes unis", "Espagne", "États-Unis", 
    "Éthiopie", "Finlande", "France", "Gabon", "Ghana", "Grèce", "Guinée", "Guinée équatoriale", "Haïti", "Hongrie", "Inde", "Indonésie", 
    "Irlande", "Italie", "Japon", "Kenya", "Liban", "Madagascar", "Malaisie", "Mali", "Maroc", "Maurice", "Mexique", "Mozambique", 
    "Namibie", "Niger", "Nigeria", "Norvège", "Nouvelle-Zélande", "Ouganda", "Pakistan", "Pays-Bas", "Pérou", "Philippines", "Pologne", 
    "Portugal", "Qatar", "République centrafricaine", "République démocratique du Congo", "Roumanie", "Royaume-Uni", "Rwanda", "Sénégal", 
    "Serbie", "Singapour", "Suisse", "Suède", "Tanzanie", "Tchad", "Thaïlande", "Tunisie", "Turquie", "Ukraine", "Venezuela", "Vietnam", 
    "Zambie", "Zimbabwe"
];

/* ==========================================================
   INITIALISATION
========================================================== */

const ForgeController = {

    init() {
        this.chargerPays();

        document.getElementById("btnForge")?.addEventListener("click", () => this.forge());
        document.getElementById("btnReset")?.addEventListener("click", () => this.reset());
        document.getElementById("visuel")?.addEventListener("change", e => this.previewImage(e));
        document.getElementById("pays_origine")?.addEventListener("change", e => this.gestionPays(e.target.value));
        document.getElementById("pays_origine")?.addEventListener("keyup", e => this.gestionPays(e.target.value));
        document.getElementById("btnPNG")?.addEventListener("click", () => this.exportPNG());
        document.getElementById("btnKit")?.addEventListener("click", () => this.exportKit());

        console.log("Forge ANOR opérationnelle");
    },

    chargerPays() {
        const liste = document.getElementById("listePays");
        if (!liste) return;
        liste.innerHTML = "";
        PAYS_MONDE.forEach(pays => {
            const option = document.createElement("option");
            option.value = pays;
            liste.appendChild(option);
        });
    },

    gestionPays(pays) {
        const cameroun = document.getElementById("cameroonFields");
        const international = document.getElementById("internationalFields");
        if (!cameroun || !international) return;

        pays = pays.trim();
        if (pays.toLowerCase() === "cameroun") {
            cameroun.style.display = "block";
            international.style.display = "none";
        } else if (pays.length > 0) {
            cameroun.style.display = "none";
            international.style.display = "block";
        } else {
            cameroun.style.display = "none";
            international.style.display = "none";
        }
    },

    /* ==========================================================
        GÉNÉRATION SÉRIALISATION
    ========================================================== */
    genererNumeros() {
        const lot = document.getElementById("lot").value.trim();
        const qte = parseInt(document.getElementById("quantite").value);

        let liste = [];
        for (let i = 1; i <= qte; i++) {
            liste.push({
                numero: String(i).padStart(6, "0"),
                identifiant: `${lot}-${String(i).padStart(6, "0")}`
            });
        }
        return liste;
    },

    /* ==========================================================
        GÉNÉRATION SCEAU
    ========================================================== */
    async forge() {
        const produit = document.getElementById("nom_produit").value.trim();
        const producteur = document.getElementById("nom_producteur").value.trim();
        const lot = document.getElementById("lot").value.trim();
        const pays = document.getElementById("pays_origine").value.trim();
        const quantite = document.getElementById("quantite").value.trim();

        if (!produit || !lot || !pays || !quantite) {
            alert("Nom produit, lot, pays et quantité sont obligatoires.");
            return;
        }

        // Signature incluant la quantité pour unicité
        const signature = [produit, producteur, lot, pays, quantite].join("_");

        if (!window.ForgeRenderer) {
            console.error("ForgeRenderer absent");
            alert("Moteur de sceau non chargé");
            return;
        }

        // ==========================================================
        // Génération visuelle locale
        // ==========================================================
        await window.ForgeRenderer.render(
            "seal-container",
            signature
        );
        document.getElementById("status").innerText = "ENVOI AU SERVEUR...";
        document.getElementById("debug").innerText = signature;
        
        // ==========================================================
        // Construction du FormData
        // ==========================================================
        const formData = new FormData();
        formData.append("nom_produit", produit);
        formData.append("nom_producteur", producteur);
        formData.append(
            "composition",
            document.getElementById("composition").value.trim()
        );
        formData.append("lot", lot);
        formData.append(
            "quantite",
            quantite
        );
        formData.append(
            "type_emballage",
            document.getElementById("type_emballage").value.trim()
        );
        formData.append(
            "pays_origine",
            pays
        );
        // Cameroun
        formData.append(
            "date_certificat_conformite",
            document.getElementById("date_certificat_conformite").value
        );
        // International
        formData.append(
            "date_fabrication",
            document.getElementById("date_fabrication").value
        );
        formData.append(
            "date_peremption",
            document.getElementById("date_peremption").value
        );
        
        // Fichiers
        const visuel = document.getElementById("visuel").files[0];
        if(visuel){
            formData.append(
                "visuel",
                visuel
            );
        }
        
        const certificat = document.getElementById("certificat_pdf").files[0];
        if(certificat){
            formData.append(
                "certificat_pdf",
                certificat
            );
        }

        // ==========================================================
        // Envoi serveur
        // ==========================================================
        try{
            const reponse =
            await fetch(
                window.API + "/forge",
                {
                    method:"POST",
                    body:formData
                }
            );

            const resultat =
            await reponse.json();

            if(!resultat.success){
                throw new Error(
                    resultat.message
                );
            }

            document.getElementById("status").innerText =
            "FORGE TERMINÉE";

            alert(
                "Produit enregistré.\n\nKit :\n" +
                resultat.kit
            );

        }catch(err){
            console.error(err);
            document.getElementById("status").innerText =
            "ERREUR";
            alert(err.message);
        }
    },

    /* ==========================================================
        IMAGE PRODUIT
    ========================================================== */
    previewImage(event){
        const fichier=event.target.files[0];
        if(!fichier){
            return;
        }
        const img=document.getElementById("previewImg");
        const placeholder=document.getElementById("imagePlaceholder");
        const reader=new FileReader();
        reader.onload=function(e){
            img.src=e.target.result;
            img.style.display="block";
            placeholder.style.display="none";
        };
        reader.readAsDataURL(fichier);
    },

    /* ==========================================================
        RESET
    ========================================================== */
    reset() {
        document.getElementById("forgeForm").reset();
        const seal = document.getElementById("seal-container");
        if (seal) seal.innerHTML = "";

        const img = document.getElementById("previewImg");
        if (img) {
            img.src = "";
            img.style.display = "none";
        }

        const placeholder = document.getElementById("imagePlaceholder");
        if (placeholder) placeholder.style.display = "block";
        document.getElementById("status").innerText = "PRÊT";
        document.getElementById("debug").innerText = "-";
        this.gestionPays("");
    },

    /* ==========================================================
        EXPORT PNG HD
    ========================================================== */
    async exportPNG() {
        const svg = document.querySelector("#seal-container svg");
        if (!svg) {
            alert("Aucun sceau à exporter.");
            return;
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const image = new Image();

        image.onload = () => {
            const SIZE = 2048;

            const canvas = document.createElement("canvas");
            canvas.width = SIZE;
            canvas.height = SIZE;

            const ctx = canvas.getContext("2d");

            // fond transparent
            ctx.clearRect(0,0,SIZE,SIZE);

            // dessin du sceau
            ctx.drawImage(image,0,0,SIZE,SIZE);

            // dessin du logo
            const logo = new Image();

            logo.onload = () => {

                const logoSize = SIZE * 0.32;

                ctx.drawImage(
                    logo,
                    (SIZE-logoSize)/2,
                    (SIZE-logoSize)/2,
                    logoSize,
                    logoSize
                );

                const lot = document.getElementById("lot").value.trim() || "SCEAU";

                const lien = document.createElement("a");
                lien.download = `SCEAU_ANOR_${lot}.png`;
                lien.href = canvas.toDataURL("image/png");
                lien.click();

                URL.revokeObjectURL(url);

            };

            logo.src = "/assets/logo_anor_master.png";

        };image.src = url;
    },

    /* ==========================================================
    CONVERSION SVG VERS PNG HD POUR KIT
    ========================================================== */

    async convertirSVG_PNG(svg){

        return new Promise(resolve=>{

            const serializer = new XMLSerializer();

            const svgString =
            serializer.serializeToString(svg);


            const blob = new Blob(
                [svgString],
                {
                    type:"image/svg+xml;charset=utf-8"
                }
            );


            const url =
            URL.createObjectURL(blob);


            const image = new Image();


            image.onload = ()=>{


                const SIZE = 4096;


                const canvas =
                document.createElement("canvas");


                canvas.width = SIZE;
                canvas.height = SIZE;


                const ctx =
                canvas.getContext("2d");


                // transparent
                ctx.clearRect(
                    0,
                    0,
                    SIZE,
                    SIZE
                );


                ctx.drawImage(
                    image,
                    0,
                    0,
                    SIZE,
                    SIZE
                );


                canvas.toBlob(
                    blobPNG=>{

                        URL.revokeObjectURL(url);

                        resolve(blobPNG);

                    },
                    "image/png",
                    1
                );


            };


            image.src=url;


        });

    },

    /* ==========================================================
        EXPORT KIT COMPLET
    ========================================================== */
    async exportKit() {

        const zip = new JSZip();

        const svg = document.querySelector("#seal-container svg");

        if (!svg) {

            alert("Veuillez d'abord générer un sceau.");

            return;

        }

        //==================================================
        // Informations produit
        //==================================================

        const produit = document.getElementById("nom_produit").value.trim();
        const producteur = document.getElementById("nom_producteur").value.trim();
        const lot = document.getElementById("lot").value.trim();
        const quantite = parseInt(document.getElementById("quantite").value || "1");

        const infos = {
            produit,
            producteur,
            lot,
            quantite,
            pays: document.getElementById("pays_origine").value.trim(),
            date_generation: new Date().toISOString()
        };

        //==================================================
        // 01 - Sceau maître
        //==================================================

        zip.file(
            "01_SCEAU_MAITRE.svg",
            svg.outerHTML
        );


        //==================================================
        // 02 - Sceau maître PNG HD
        //==================================================

        const pngHD =
        await this.convertirSVG_PNG(svg);


        zip.file(
            "02_SCEAU_MAITRE_HD.png",
            pngHD
        );

        //==================================================
        // 02 - Signature
        //==================================================

        zip.file(
            "02_SIGNATURE.txt",
            document.getElementById("debug").innerText
        );

        //==================================================
        // 03 - Produit
        //==================================================

        zip.file(
            "03_PRODUIT.json",
            JSON.stringify(infos,null,4)
        );

        //==================================================
        // 04 - Guide impression
        //==================================================

        zip.file(
            "04_GUIDE_UTILISATION.txt",

            `GUIDE OFFICIEL DU SCEAU NUMERIQUE ANOR

Taille minimale :
22 mm

Résolution :
600 dpi minimum

Impression :
Laser
Offset
Numérique HD

Ne jamais :

- modifier les glyphes
- modifier le logo
- déformer le sceau
- changer la couleur officielle

Le sceau doit être imprimé exactement tel que fourni.

`
        );

        //==================================================
        // 05 - Juridique
        //==================================================

        zip.file(
            "05_AVERTISSEMENT_JURIDIQUE.txt",

            `AVERTISSEMENT

Toute reproduction,
copie,
contrefaçon,
altération,
fabrication frauduleuse
ou imitation du sceau ANOR
expose son auteur à des poursuites.

Sanctions possibles :

- retrait certification

- dommages et intérêts

- faux et usage de faux

- poursuites judiciaires

`
        );

        //==================================================
        // 06 - Partenaires
        //==================================================

        zip.file(
            "06_IMPRIMEURS_PARTENAIRES.txt",

            `IMPRIMERIES PARTENAIRES ANOR

Cette liste est administrée par l'ANOR.

Ville
Téléphone
Email

(à compléter par l'administration ANOR)

`
        );

        //==================================================
        // 07 - Sérialisation CSV
        //==================================================

        let csv = "Numero;Identifiant;Lot\n";

        for(let i=1;i<=quantite;i++){

            const numero = String(i).padStart(6,"0");

            const identifiant = `${lot}-${numero}`;

            csv += `${numero};${identifiant};${lot}\n`;

        }

        zip.file(
            "07_SERIALISATION.csv",
            csv
        );

        //==================================================
        // 08 - Sérialisation XML
        //==================================================

        let xml =
        `<?xml version="1.0" encoding="UTF-8"?>
<serialisation>
`;

        for(let i=1;i<=quantite;i++){

            const numero = String(i).padStart(6,"0");

            const identifiant = `${lot}-${numero}`;

            xml +=
        `    <produit>
        <numero>${numero}</numero>
        <identifiant>${identifiant}</identifiant>
        <lot>${lot}</lot>
    </produit>
`;

        }

        xml += `</serialisation>`;

        zip.file(
            "08_SERIALISATION.xml",
            xml
        );

        //==================================================
        // 09 - Sérialisation JSON
        //==================================================

        const serialisation = [];

        for(let i=1;i<=quantite;i++){

            const numero = String(i).padStart(6,"0");

            serialisation.push({

                numero,

                identifiant: `${lot}-${numero}`,

                lot

            });

        }

        zip.file(
            "09_SERIALISATION.json",
            JSON.stringify(serialisation,null,4)
        );

        //==================================================
        // 09 - Manifest
        //==================================================

        const hashSVG =
        await calculerHash(svg.outerHTML);


        const manifest = {


            version:"ANOR-1.0",


            lot,


            produit,


            producteur,


            quantite,


            date_generation:
            new Date().toISOString(),


            format_sceau:
            "SVG + PNG HD 4096px",


            empreinte_SHA256:{


                "SCEAU_MAITRE.svg":
                hashSVG


            },


            fichiers:[

                "01_SCEAU_MAITRE.svg",

                "02_SCEAU_MAITRE_HD.png",

                "03_SIGNATURE.txt",

                "04_PRODUIT.json",

                "05_GUIDE_UTILISATION.txt",

                "06_AVERTISSEMENT_JURIDIQUE.txt",

                "07_IMPRIMEURS_PARTENAIRES.txt",

                "08_SERIALISATION.csv",

                "09_SERIALISATION.xml",

                "10_SERIALISATION.json",

                "11_MANIFEST_ANOR.json"

            ]

        };


        zip.file(

            "11_MANIFEST_ANOR.json",

            JSON.stringify(
                manifest,
                null,
                4
            )

        );

        //==================================================
        // Génération ZIP
        //==================================================

        const contenu = await zip.generateAsync({

            type:"blob"

        });

        const lien = document.createElement("a");

        lien.href = URL.createObjectURL(contenu);

        lien.download =
        `KIT_ANOR_${lot}.zip`;

        lien.click();

        URL.revokeObjectURL(lien.href);
    }
};

document.addEventListener("DOMContentLoaded", () => ForgeController.init());