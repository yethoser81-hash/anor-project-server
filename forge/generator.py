import os
import json
import uuid
import hashlib
import random
import requests
import sys

# 1. Gestion dynamique de la configuration (Zéro blocage local)
# On tente d'abord de charger le fichier de configuration par défaut
try:
    with open("config.json", "r", encoding="utf-8") as f:
        config_local = json.load(f)
except FileNotFoundError:
    config_local = {}

# Injection dynamique : Priorité absolue aux variables d'environnement de production (Cloud)
SECRET_KEY = os.environ.get("SYA_SECRET_KEY", config_local.get("SECRET_KEY", "DEFAULT_FALLBACK_TOKEN"))
SERVER_URL = os.environ.get("SYA_SERVER_URL", config_local.get("PRODUCTION_SERVER_URL"))

if not SERVER_URL or SERVER_URL == "https://sya-anor-check.onrender.com/api/sceau/enregistrer":
    print("[ATTENTION] La Forge utilise l'URL par défaut ou vide. Assure-toi de configurer l'URL Render finale.")

def generer_matrice_logique():
    """
    Génère la matrice géométrique 8x8 (64 blocs binaires).
    Cette empreinte brute sert de signature de terrain pour l'APK.
    """
    return [random.choice([0, 1]) for _ in range(64)]

def compiler_sceau_svg(id_sceau, id_produit, signature, matrice):
    """
    Assemble le logo vectoriel ANOR en injectant la matrice géométrique de scan
    et les métadonnées de sécurité invisibles à l'œil nu.
    """
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <defs>
        <path id="text-path-top" d="M 90,300 A 210,210 0 1,1 510,300" fill="none"/>
        <path id="text-path-bottom" d="M 510,300 A 210,210 0 0,1 90,300" fill="none"/>
    </defs>
    
    <rect width="100%" height="100%" fill="#0a0f1d" />
    
    <g id="matrice-detection" transform="translate(140, 140)">
    """
    
    taille_bloc = 40
    for idx, bit in enumerate(matrice):
        rangee = idx // 8
        col = idx % 8
        
        x = col * taille_bloc
        y = rangee * taille_bloc
        
        # Préservation de l'espace central (Blason de marque NC ANOR)
        if 2 <= rangee <= 5 and 2 <= col <= 5:
            continue
            
        if bit == 1:
            # Bloc plein : contraste binaire capté par imageProcessor
            svg += f'<rect x="{x}" y="{y}" width="{taille_bloc-4}" height="{taille_bloc-4}" fill="#3b82f6" rx="4" />\n'
        else:
            # Bloc vide avec repère central : résistant aux distorsions lumineuses
            svg += f'<rect x="{x}" y="{y}" width="{taille_bloc-4}" height="{taille_bloc-4}" fill="none" stroke="#1e3a8a" stroke-width="2" rx="4" />\n'
            svg += f'<circle cx="{x + taille_bloc/2 - 2}" cy="{y + taille_bloc/2 - 2}" r="4" fill="#1e3a8a" />\n'

    # Couches esthétiques et textuelles de conformité ANOR
    svg += f"""    </g>
    <circle cx="300" cy="300" r="280" fill="none" stroke="#5cc0ff" stroke-width="6" />
    <circle cx="300" cy="300" r="270" fill="none" stroke="#5cc0ff" stroke-width="2" stroke-dasharray="8,6" />
    
    <style>
        .txt-style {{ font-family: 'Arial', sans-serif; font-size: 18px; fill: #ffffff; letter-spacing: 5px; font-weight: bold; }}
    </style>
    
    <text class="txt-style">
        <textPath href="#text-path-top" startOffset="50%" text-anchor="middle">ANOR • CONFORMITÉ • FIABILITÉ • TRAÇABILITÉ</textPath>
    </text>
    <text class="txt-style">
        <textPath href="#text-path-bottom" startOffset="50%" text-anchor="middle">PRODUIT CERTIFIÉ • QUALITÉ GARANTIE</textPath>
    </text>
    
    <g id="logo-central" transform="translate(300, 300)">
        <circle cx="0" cy="0" r="90" fill="#0a0f1d" stroke="#5cc0ff" stroke-width="4" />
        <circle cx="0" cy="0" r="75" fill="#5cc0ff" />
        <circle cx="0" cy="0" r="65" fill="#ffffff" />
        <circle cx="0" cy="0" r="50" fill="none" stroke="#5cc0ff" stroke-width="3" />
        <text x="0" y="-15" font-family='Arial' font-size='22' font-weight='bold' fill='#ffffff' text-anchor='middle' letter-spacing='6'>ANOR</text>
        <text x="0" y="15" font-family='Arial' font-size='38' font-weight='bold' fill='#5cc0ff' text-anchor='middle'>NC</text>
        <text x="0" y="38" font-family='Arial' font-size='12' font-weight='bold' fill='#5cc0ff' text-anchor='middle' letter-spacing='2'>CERTIFIED</text>
    </g>
    
    <metadata id="security-data" id_sceau="{id_sceau}" id_produit="{id_produit}" signature="{signature}" />
    
    <rect x="180" y="520" width="240" height="35" rx="10" fill="#5cc0ff" />
    <text x="300" y="542" font-family="Arial" font-size="12" fill="#0a0f1d" font-weight="bold" text-anchor="middle">À SCANNER AVEC L'APP ANOR</text>
</svg>"""
    return svg

def forger_et_synchroniser(id_produit):
    """
    Exécute l'algorithme de signature, crée le livrable vectoriel
    et pousse la structure binaire vers l'API en ligne.
    """
    if not SERVER_URL:
        print("[ERREUR CRITIQUE] URL du serveur introuvable. Configure config.json ou la variable SYA_SERVER_URL.")
        sys.exit(1)

    # 1. Génération des clés uniques
    id_sceau = str(uuid.uuid4())[:8].upper()
    matrice_liste = generer_matrice_logique()
    matrice_string = "".join(str(b) for b in matrice_liste)
    
    # 2. Empreinte cryptographique d'authentification (Anti-contrefaçon)
    unite_controle = f"{id_sceau}-{id_produit}-{matrice_string}-{SECRET_KEY}"
    signature = hashlib.sha256(unite_controle.encode()).hexdigest()
    
    # 3. Génération du fichier physique SVG
    svg_code = compiler_sceau_svg(id_sceau, id_produit, signature, matrice_liste)
    
    os.makedirs("outputs", exist_ok=True)
    chemin_fichier = os.path.join("outputs", f"sceau_anor_{id_sceau}.svg")
    with open(chemin_fichier, "w", encoding="utf-8") as f:
        f.write(svg_code)
        
    print(f"[FORGE] Fichier SVG sécurisé généré : {chemin_fichier}")
    
    # 4. Synchronisation réseau vers l'API Cloud (Render)
    payload = {
        "id_sceau": id_sceau,
        "id_produit": id_produit,
        "signature": signature,
        "matrice_binaire": matrice_string
    }
    
    print(f"[FORGE] Synchronisation en cours vers : {SERVER_URL}...")
    try:
        reponse = requests.post(SERVER_URL, json=payload, timeout=10)
        if reponse.status_code == 201:
            print(f"[FORGE] Succès : Le sceau {id_sceau} a été enregistré avec succès dans le cloud via SYA.\n")
        else:
            print(f"[FORGE] Échec : Le serveur en ligne a retourné une erreur : {reponse.status_code} - {reponse.text}\n")
    except requests.exceptions.RequestException as e:
        print(f"[FORGE] Erreur réseau critique : Impossible de joindre l'API en ligne. Détails : {e}\n")

if __name__ == "__main__":
    print("--- DEMARRAGE DE L'AUTORITÉ DE FORGE EN LIGNE (SYA) ---")
    id_test = input("Entrez la référence produit pour la certification : ")
    if id_test.strip():
        forger_et_synchroniser(id_test.strip())