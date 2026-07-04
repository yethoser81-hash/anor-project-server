const TOKEN = localStorage.getItem("anor_token") || "";

let map;
let markers = [];
let heatLayer = null;
let scanChart = null;

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${TOKEN}`
};

const ICONS = {

    verified: L.icon({
        iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize:[25,41],
        iconAnchor:[12,41]
    }),

    warning: L.icon({
        iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
        shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize:[25,41],
        iconAnchor:[12,41]
    }),

    fraud: L.icon({
        iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize:[25,41],
        iconAnchor:[12,41]
    })

};

function initMap(){

    map = L.map("map",{

        zoomControl:true,
        attributionControl:true

    }).setView([5.9631,12.7182],6);

    L.tileLayer(

        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',

        {

            attribution:'ANOR',

            maxZoom:19

        }

    ).addTo(map);

    const bounds = [

        [1.4,8.2],

        [13.5,16.8]

    ];

    map.setMaxBounds(bounds);

    map.setMinZoom(6);

    map.setMaxZoom(17);

}

async function api(endpoint){

    const r = await fetch(

        `${window.API}${endpoint}`,

        {

            headers

        }

    );

    if(!r.ok){

        throw new Error(endpoint);

    }

    return await r.json();

}

async function loadDashboard(){

    await Promise.all([

        loadStats(),

        loadScans(),

        loadAlerts(),

        loadHistory()

    ]);

}

async function reloadMap(){

    clearMarkers();

    await loadDashboard();

}

function clearMarkers(){

    markers.forEach(m=>map.removeLayer(m));

    markers=[];

}

async function loadStats(){

    try{

        const stats = await api("/map/stats");

        document.getElementById("todayScans").textContent =
        stats.todayScans || 0;

        document.getElementById("activeInspectors").textContent =
        stats.activeInspectors || 0;

        document.getElementById("suspicious").textContent =
        stats.suspicious || 0;

        document.getElementById("verifiedProducts").textContent =
        stats.verifiedProducts || 0;

    }

    catch(e){

        console.error(e);

    }

}

async function loadScans(){

    try{

        const scans = await api("/map/scans");

        const tbody = document.getElementById("scanTable");

        tbody.innerHTML = "";

        scans.forEach(scan=>{

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${scan.id}</td>
                <td>${scan.product}</td>
                <td>${scan.city}</td>
                <td class="${scan.status}">
                    ${scan.status}
                </td>
            `;

            tbody.appendChild(tr);

            if(scan.latitude && scan.longitude){

                let color = "#00ff88"; // Par défaut Authentique
                if(scan.status === "warning") color = "#FFD700";
                if(scan.status === "fraud") color = "#ff0000";

                const marker = L.circleMarker(

                    [scan.latitude,scan.longitude],

                    {

                        radius:9,

                        color:color,

                        fillColor:color,

                        fillOpacity:0.95,

                        weight:3

                    }

                );

                marker.addTo(map);

                marker.bindPopup(`

                <b>${scan.product}</b>

                <br>

                ${scan.city}

                <br>

                ${scan.date}

                `);

                markers.push(marker);

                if(scan.status === "fraud"){
                    L.circle(
                        [scan.latitude,scan.longitude],
                        {
                            radius:4500,
                            color:"#ff0000",
                            fillColor:"#ff0000",
                            fillOpacity:.18,
                            weight:2
                        }
                    ).addTo(map);
                }

            }

        });

        drawChart(scans);

    }

    catch(e){

        console.error(e);

    }

}

async function loadAlerts(){

    try{

        const alerts = await api("/map/alerts");

        const table = document.getElementById("alertsTable");

        const feed = document.getElementById("liveFeed");

        table.innerHTML = "";

        feed.innerHTML = "";

        alerts.forEach(alert=>{

            table.innerHTML += `
                <tr>
                    <td>${alert.time}</td>
                    <td>${alert.city}</td>
                    <td class="${alert.level}">
                        ${alert.type}
                    </td>
                </tr>
            `;

            feed.innerHTML += `
                <div class="feedItem ${alert.level}">
                    <strong>${alert.type}</strong>
                    ${alert.message}<br>
                    <small>${alert.city} • ${alert.time}</small>
                </div>
            `;

        });

    }

    catch(e){

        console.error(e);

    }

}

function drawChart(scans){

    const verified =
    scans.filter(x=>x.status==="verified").length;

    const warning =
    scans.filter(x=>x.status==="warning").length;

    const fraud =
    scans.filter(x=>x.status==="fraud").length;

    const ctx =
    document.getElementById("scanChart");

    if(scanChart){

        scanChart.destroy();

    }

    scanChart = new Chart(ctx,{

        type:"doughnut",

        data:{

            labels:[
                "Authentique",
                "Suspect",
                "Fraude"
            ],

            datasets:[{

                data:[
                    verified,
                    warning,
                    fraud
                ],

                backgroundColor:[
                    "#00C853",
                    "#FFD600",
                    "#D50000"
                ]

            }]

        },

        options:{

            responsive:true,

            plugins:{

                legend:{

                    labels:{

                        color:"#ffffff"

                    }

                }

            }

        }

    });

}

async function loadHistory(){

    try{

        const history = await api("/map/history");

        const tbody =
        document.getElementById("historyTable");

        tbody.innerHTML="";

        history.forEach(item=>{

            tbody.innerHTML += `
                <tr>
                    <td>${item.date}</td>
                    <td>${item.time}</td>
                    <td>${item.product}</td>
                    <td>${item.seal}</td>
                    <td>${item.company}</td>
                    <td>${item.city}</td>
                    <td>${item.region}</td>
                    <td>${item.inspector}</td>
                    <td class="${item.status}">
                        ${item.status}
                    </td>
                </tr>
            `;

        });

    }

    catch(e){

        console.error(e);

    }

}

function applyFilters(){

    loadScans();

    loadAlerts();

    loadHistory();

}

document
.getElementById("refreshMap")
.addEventListener(
    "click",
    applyFilters
);

document
.getElementById("filterRegion")
.addEventListener(
    "change",
    applyFilters
);

document
.getElementById("filterStatus")
.addEventListener(
    "change",
    applyFilters
);

document
.getElementById("dateStart")
.addEventListener(
    "change",
    applyFilters
);

document
.getElementById("dateEnd")
.addEventListener(
    "change",
    applyFilters
);

async function initialize(){

    initMap();

    await Promise.all([

        loadStats(),

        loadScans(),

        loadAlerts(),

        loadHistory()

    ]);

}

initialize();

setInterval(loadStats,30000);

setInterval(loadScans,30000);

setInterval(loadAlerts,15000);

setInterval(loadHistory,60000);