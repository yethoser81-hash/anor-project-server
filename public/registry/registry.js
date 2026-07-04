const API = window.API;

let registry = [];
let filtered = [];
let currentPage = 1;
const pageSize = 15;

const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const statusFilter = document.getElementById("statusFilter");

const registryTable = document.getElementById("registryTable");
const historyTable = document.getElementById("historyTable");
const traceabilityTable = document.getElementById("traceabilityTable");

const totalProducts = document.getElementById("totalProducts");
const activeCertificates = document.getElementById("activeCertificates");
const suspendedCertificates = document.getElementById("suspendedCertificates");
const revokedCertificates = document.getElementById("revokedCertificates");

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

    const url =

`${API}/registry/produits?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&producteur=${encodeURIComponent(producteur)}&pays=${encodeURIComponent(pays)}`;

    const res = await fetch(url);

    const json = await res.json();

    construireTable(json.produits);

    construirePagination(json.total);

}

function construireTable(list){

    const tbody=document.getElementById("registryTable");

    tbody.innerHTML="";

    list.forEach(p=>{

        tbody.innerHTML+=`

<tr>

<td>

<img

src="${p.visuel_url||'../assets/no-image.png'}"

style="width:70px;height:70px;object-fit:cover;border-radius:8px"

onerror="this.src='../assets/no-image.png'"

>

</td>

<td>${p.nom_produit}</td>

<td>${p.nom_producteur}</td>

<td>${p.lot}</td>

<td>${p.pays_origine}</td>

<td>

<button

class="auditBtn"

onclick="ouvrirAudit('${p.id}')"

>

Audit

</button>

</td>

</tr>

`;

    });

}

function ouvrirAudit(id){

location.href=`../product_audit/index.html?id=${id}`;

}

function construirePagination(total){

    const pages=Math.ceil(total/limit);

    let html="";

    for(let i=1;i<=pages;i++){

        html+=`

<button

class="pageBtn"

onclick="gotoPage(${i})"

>

${i}

</button>

`;

    }

    document.getElementById("pagination").innerHTML=html;

}

function gotoPage(p){

page=p;

chargerProduits();

}

window.onload=()=>{

chargerProduits();

};

async function loadRegistry(){

    try{

        const response = await fetch(

            `${API}/registry`,

            {

                headers:authHeaders()

            }

        );

        registry = await response.json();

        filtered=[...registry];

        computeStats();

        renderTable();

    }

    catch(e){

        console.error(e);

    }

}

function computeStats(){

    totalProducts.innerText=registry.length;

    activeCertificates.innerText=

        registry.filter(

            p=>p.status==="active"

        ).length;

    suspendedCertificates.innerText=

        registry.filter(

            p=>p.status==="suspended"

        ).length;

    revokedCertificates.innerText=

        registry.filter(

            p=>p.status==="revoked"

        ).length;

}

function applyFilters(){

    const keyword=

        searchInput.value

        .toLowerCase()

        .trim();

    filtered=

        registry.filter(item=>{

            const matchText=

                item.product_name

                .toLowerCase()

                .includes(keyword)

                ||

                item.company_name

                .toLowerCase()

                .includes(keyword)

                ||

                item.seal_id

                .toLowerCase()

                .includes(keyword);

            const matchRegion=

                !regionFilter.value ||

                item.region===regionFilter.value;

            const matchStatus=

                !statusFilter.value ||

                item.status===statusFilter.value;

            return(

                matchText

                &&

                matchRegion

                &&

                matchStatus

            );

        });

    currentPage=1;

    renderTable();

}

function badge(status){

    return `<span class="badge ${status}">${status.toUpperCase()}</span>`;

}

function renderTable(){

    registryTable.innerHTML="";

    const start=

        (currentPage-1)

        *

        pageSize;

    const page=

        filtered.slice(

            start,

            start+pageSize

        );

    page.forEach(item=>{

        const tr=

        document.createElement("tr");

        tr.innerHTML=`

        <td>${item.product_name}</td>

        <td>${item.company_name}</td>

        <td>${item.seal_id}</td>

        <td>${item.region}</td>

        <td>${badge(item.status)}</td>

        <td>${item.expiration_date}</td>

        `;

        tr.onclick=()=>showDetails(item);

        registryTable.appendChild(tr);

    });

    const totalPages=

        Math.max(

            1,

            Math.ceil(

                filtered.length/pageSize

            )

        );

    pageIndicator.innerText=

        `Page ${currentPage} / ${totalPages}`;

}

function showDetails(item){

    productDetails.innerHTML=`

    <table>

    <tr>

    <td>Produit</td>

    <td>${item.product_name}</td>

    </tr>

    <tr>

    <td>Sceau</td>

    <td>${item.seal_id}</td>

    </tr>

    <tr>

    <td>Catégorie</td>

    <td>${item.category}</td>

    </tr>

    <tr>

    <td>Certification</td>

    <td>${item.certificate_number}</td>

    </tr>

    <tr>

    <td>Expiration</td>

    <td>${item.expiration_date}</td>

    </tr>

    </table>

    `;

    companyDetails.innerHTML=`

    <table>

    <tr>

    <td>Entreprise</td>

    <td>${item.company_name}</td>

    </tr>

    <tr>

    <td>Ville</td>

    <td>${item.city}</td>

    </tr>

    <tr>

    <td>Région</td>

    <td>${item.region}</td>

    </tr>

    <tr>

    <td>Inspecteur</td>

    <td>${item.inspector}</td>

    </tr>

    </table>

    `;

    loadHistory(item.id);

    loadTraceability(item.id);

}

async function loadHistory(id){

    const res=

    await fetch(

        `${API}/registry/${id}/history`,

        {

            headers:authHeaders()

        }

    );

    const data=

        await res.json();

    historyTable.innerHTML="";

    data.forEach(row=>{

        historyTable.innerHTML+=`

        <tr>

        <td>${row.date}</td>

        <td>${row.action}</td>

        <td>${row.agent}</td>

        </tr>

        `;

    });

}

async function loadTraceability(id){

    const res=

    await fetch(

        `${API}/registry/${id}/traceability`,

        {

            headers:authHeaders()

        }

    );

    const data=

        await res.json();

    traceabilityTable.innerHTML="";

    data.forEach(scan=>{

        traceabilityTable.innerHTML+=`

        <tr>

        <td>${scan.date}</td>

        <td>${scan.city}</td>

        <td>${scan.result}</td>

        </tr>

        `;

    });

}

document

.getElementById("previousPage")

.onclick=()=>{

    if(currentPage>1){

        currentPage--;

        renderTable();

    }

};

document

.getElementById("nextPage")

.onclick=()=>{

    const pages=

    Math.ceil(

        filtered.length/pageSize

    );

    if(currentPage<pages){

        currentPage++;

        renderTable();

    }

};

searchInput.addEventListener(

    "keyup",

    applyFilters

);

regionFilter.addEventListener(

    "change",

    applyFilters

);

statusFilter.addEventListener(

    "change",

    applyFilters

);

document

.getElementById("viewCertificate")

.onclick=()=>{

    alert("Ouverture du certificat.");

};

document

.getElementById("downloadCertificate")

.onclick=()=>{

    alert("Téléchargement du certificat.");

};

document

.getElementById("openAudit")

.onclick=()=>{

    location.href=

    "../product_audit/index.html";

};

document

.getElementById("showMap")

.onclick=()=>{

    location.href=

    "../map_surveillance/index.html";

};

loadRegistry();