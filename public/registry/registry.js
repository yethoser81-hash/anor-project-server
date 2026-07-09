const API = window.API;

let registry = [];
let filtered = [];
let currentPage = 1;
const pageSize = 15;

// ===== IDs corrigés =====
const searchInput = document.getElementById("search");
const regionFilter = document.getElementById("category");
const statusFilter = document.getElementById("status");

// ===== Ceux-ci restent inchangés =====
const registryTable = document.getElementById("registryTable");
const historyTable = document.getElementById("historyTable");
const traceabilityTable = document.getElementById("traceabilityTable");

// ===== IDs corrigés =====
const totalProducts = document.getElementById("productsTotal");
const activeCertificates = document.getElementById("companiesTotal");
const suspendedCertificates = document.getElementById("certificatesTotal");
const revokedCertificates = document.getElementById("expiredTotal");

const productDetails = document.getElementById("productDetails");
const companyDetails = document.getElementById("companyDetails");
const pageIndicator = document.getElementById("pageIndicator");

function authHeaders(){

    const token = localStorage.getItem("anor_token");

    return{

        Authorization:`Bearer ${token}`

    };

}

let page = 1;

const limit = 20;

async function chargerProduits(){

    const search = document.getElementById("search").value;

    const producteur = document.getElementById("producteur").value;

    const pays = document.getElementById("pays").value;

    const url = `${API}/registry/produits?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&producteur=${encodeURIComponent(producteur)}&pays=${encodeURIComponent(pays)}`;

    const res = await fetch(url);

    const json = await res.json();

    construireTable(json.produits);

    construirePagination(json.total);

    document.getElementById("productsTotal").textContent = json.total;
    document.getElementById("companiesTotal").textContent = new Set(json.produits.map(p => p.nom_producteur)).size;
    document.getElementById("certificatesTotal").textContent = json.total;
    document.getElementById("expiredTotal").textContent = 0;

}

function construireTable(list){

    const tbody = document.getElementById("registryTable");

    tbody.innerHTML = "";

    list.forEach(p => {

        const tr = document.createElement("tr");
        tr.onclick = () => afficherProduit(p);

        tr.innerHTML = `
            <td>
                <img src="${p.visuel_url || '../assets/no-image.png'}" style="width:70px;height:70px;object-fit:cover;border-radius:8px" onerror="this.src='../assets/no-image.png'">
            </td>
            <td>${p.nom_produit}</td>
            <td>${p.nom_producteur}</td>
            <td>${p.lot}</td>
            <td>${p.pays_origine}</td>
            <td>
                <button class="auditBtn" onclick="ouvrirAudit('${p.identifiant}')">Voir</button>
            </td>
        `;

        tbody.appendChild(tr);

    });

}

function afficherProduit(p){

    document.getElementById("productDetails").innerHTML = `

        <table>

            <tr>

                <td>Produit</td>

                <td>${p.nom_produit}</td>

            </tr>

            <tr>

                <td>Producteur</td>

                <td>${p.nom_producteur}</td>

            </tr>

            <tr>

                <td>Lot</td>

                <td>${p.lot}</td>

            </tr>

            <tr>

                <td>Pays</td>

                <td>${p.pays_origine}</td>

            </tr>

            <tr>

                <td>Identifiant</td>

                <td>${p.identifiant}</td>

            </tr>

        </table>

    `;

    document.getElementById("companyDetails").innerHTML = `

        <table>

            <tr>

                <td>Entreprise</td>

                <td>${p.nom_producteur}</td>

            </tr>

            <tr>

                <td>Pays</td>

                <td>${p.pays_origine}</td>

            </tr>

        </table>

    `;

}

function ouvrirAudit(id){

    location.href = `../product_audit/index.html?id=${id}`;

}

function construirePagination(total){

    const pages = Math.ceil(total/limit);

    let html = "";

    for(let i = 1; i <= pages; i++){

        html += `
            <button class="pageBtn" onclick="gotoPage(${i})">${i}</button>
        `;

    }

    document.getElementById("pagination").innerHTML = html;

}

function gotoPage(p){

    page = p;

    chargerProduits();

}

window.onload = () => {

    chargerProduits();

};