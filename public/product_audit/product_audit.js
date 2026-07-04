const API = window.location.hostname === "localhost"
    ? "http://localhost:10000/api"
    : "https://anor-back.onrender.com/api";

async function loadProducts() {

    try {

        const res = await fetch(`${API}/product_audit`);
        const data = await res.json();

        const container = document.getElementById("productList");
        container.innerHTML = "";

        data.produits.forEach(p => {

            container.innerHTML += `
                <div class="product-card">
                    <img src="${p.visuel_url || '../assets/default.png'}" />
                    <h3>${p.nom_produit}</h3>
                    <p>${p.nom_producteur}</p>
                </div>
            `;

        });

    } catch (e) {
        console.error("Erreur chargement product audit", e);
    }
}

loadProducts();

let auditChart = null;
let currentSeal = null;

const $ = id => document.getElementById(id);

async function api(url){

    const token = localStorage.getItem("anor_token");

    const res = await fetch(url,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    if(!res.ok){

        throw new Error(await res.text());

    }

    return res.json();

}

window.addEventListener("load",()=>{

    $("searchButton").onclick = searchProduct;

    $("sealInput").addEventListener("keypress",e=>{

        if(e.key==="Enter"){

            searchProduct();

        }

    });

});

async function searchProduct(){

    const value = $("sealInput").value.trim();

    if(value===""){

        alert("Entrer un Seal ID, Product ID ou nom de produit.");

        return;

    }

    try{

        const data = await api(

            `${API}/product_audit/search?q=${encodeURIComponent(value)}`

        );

        currentSeal = data;

        fillIdentity(data);

        fillStats(data);

        fillDocuments(data.documents || []);

        fillHistory(data.history || []);

        fillAudit(data.audit || []);

        drawRiskChart(data);

    }

    catch(e){

        console.error(e);

        alert("Produit introuvable.");

    }

}

function fillIdentity(data){

    $("photo").src =

        data.photo ||

        "../assets/no-product.png";

    $("sealId").innerText =

        data.seal_id || "-";

    $("productId").innerText =

        data.product_id || "-";

    $("productName").innerText =

        data.product_name || "-";

    $("company").innerText =

        data.company || "-";

    $("category").innerText =

        data.category || "-";

    $("factory").innerText =

        data.factory || "-";

    $("certification").innerText =

        data.certification || "-";

    $("productionDate").innerText =

        data.production_date || "-";

    $("expirationDate").innerText =

        data.expiration_date || "-";

    $("status").innerText =

        data.status || "-";

}

function fillStats(data){

    $("totalScans").innerText =
        data.total_scans || 0;

    $("successfulScans").innerText =
        data.successful_scans || 0;

    $("failedScans").innerText =
        data.failed_scans || 0;

    $("fraudIndex").innerText =
        (data.fraud_index || 0) + "%";

}

function fillDocuments(documents){

    const box = $("documents");

    box.innerHTML = "";

    if(documents.length===0){

        box.innerHTML="<p>Aucun document disponible.</p>";

        return;

    }

    documents.forEach(doc=>{

        const btn=document.createElement("button");

        btn.innerText=doc.label;

        btn.onclick=()=>{

            window.open(doc.url,"_blank");

        };

        box.appendChild(btn);

    });

}

function fillHistory(history){

    const body=$("historyTable");

    body.innerHTML="";

    history.forEach(item=>{

        body.innerHTML+=`

        <tr>

            <td>${item.date}</td>

            <td>${item.city}</td>

            <td>${item.inspector}</td>

            <td>${item.result}</td>

            <td>${item.device}</td>

        </tr>

        `;

    });

}

function fillAudit(audit){

    const body=$("auditTable");

    body.innerHTML="";

    audit.forEach(item=>{

        body.innerHTML+=`

        <tr>

            <td>${item.date}</td>

            <td>${item.type}</td>

            <td>${item.auditor}</td>

            <td>${item.decision}</td>

            <td>${item.score}</td>

        </tr>

        `;

    });

}

function drawRiskChart(data){

    const ctx=$("riskChart").getContext("2d");

    if(auditChart){

        auditChart.destroy();

    }

    auditChart=new Chart(ctx,{

        type:"line",

        data:{

            labels:data.risk_history?.labels || [],

            datasets:[{

                label:"Indice de risque",

                data:data.risk_history?.values || [],

                borderColor:"#ce1126",

                backgroundColor:"rgba(206,17,38,.15)",

                fill:true,

                tension:.35

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{

                    display:false

                }

            },

            scales:{

                y:{

                    beginAtZero:true,

                    max:100

                }

            }

        }

    });

}

$("btnCertificate").onclick=()=>{

    if(!currentSeal) return;

    window.open(

        `${API}/certificate/${currentSeal.seal_id}`,

        "_blank"

    );

};

$("btnTimeline").onclick=()=>{

    if(!currentSeal) return;

    window.location.href=

    `../registry/index.html?seal=${currentSeal.seal_id}`;

};

$("btnMap").onclick=()=>{

    if(!currentSeal) return;

    window.location.href=

    `../map_surveillance/index.html?seal=${currentSeal.seal_id}`;

};

$("btnIntelligence").onclick=()=>{

    if(!currentSeal) return;

    window.location.href=

    `../intelligence/index.html?seal=${currentSeal.seal_id}`;

};

$("btnExport").onclick=async()=>{

    if(!currentSeal) return;

    window.open(

        `${API}/product_audit/export/${currentSeal.seal_id}`,

        "_blank"

    );

};

async function loadGlobalStats(){

    try{

        const stats=await api(

            `${API}/product_audit/stats`

        );

        $("productsCount").innerText=

            stats.products || 0;

        $("auditCount").innerText=

            stats.audits || 0;

        $("scanCount").innerText=

            stats.scans || 0;

        $("fraudCount").innerText=

            stats.frauds || 0;

    }

    catch(err){

        console.error(err);

    }

}

loadGlobalStats();