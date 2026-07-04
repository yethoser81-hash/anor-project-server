const API = window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://anor-back.onrender.com/api";

async function loadStats(){

    try{

        const res = await fetch(`${API}/admin/stats`);
        const data = await res.json();

        document.getElementById("products").innerText = data.totalProducts || 0;
        document.getElementById("seals").innerText = data.totalSeals || 0;
        document.getElementById("scans").innerText = data.totalScans || 0;
        document.getElementById("alerts").innerText = data.totalAlerts || 0;

    }catch(e){

        console.error(e);

    }

}

async function loadActivity(){

    const box = document.getElementById("activity");

    box.innerHTML = "";

    try{

        const res = await fetch(`${API}/admin/activity`);
        const data = await res.json();

        data.slice(0,10).forEach(item=>{

            const div = document.createElement("div");

            div.innerHTML = `
                <p><b>${item.type}</b></p>
                <small>${item.date}</small>
                <hr>
            `;

            box.appendChild(div);

        });

    }catch(e){
        console.error(e);
    }

}

loadStats();
loadActivity();

setInterval(loadStats, 5000);
setInterval(loadActivity, 8000);