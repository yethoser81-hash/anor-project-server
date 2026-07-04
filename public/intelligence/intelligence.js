const token=localStorage.getItem("anor_token")||"";

const headers={
Authorization:`Bearer ${token}`
};

let riskChart;
let distributionChart;
let regionChart;

async function api(url){

const r=await fetch(

`${API}${url}`,

{headers}

);

return await r.json();

}

async function loadDashboard(){

try{

const data=await api("/intelligence/dashboard");

document.getElementById("riskScore").textContent=
(data.riskScore||0)+"%";

document.getElementById("fraudPrediction").textContent=
data.predictions||0;

document.getElementById("clusters").textContent=
data.clusters||0;

document.getElementById("activeModels").textContent=
data.models||5;

drawRiskChart(data.timeline||[]);

drawDistribution(data.distribution||{});

drawRegions(data.regions||[]);

}catch(e){

console.error(e);

}

}

function drawRiskChart(values){

const ctx=document
.getElementById("riskChart")
.getContext("2d");

if(riskChart) riskChart.destroy();

riskChart=new Chart(ctx,{

type:"line",

data:{

labels:values.map(v=>v.date),

datasets:[{

label:"Indice IA",

data:values.map(v=>v.value),

borderColor:"#f6c445",

backgroundColor:"rgba(246,196,69,.15)",

fill:true,

tension:.35

}]

},

options:{

responsive:true,

plugins:{
legend:{display:false}
}

}

});

}

function drawDistribution(data){

const ctx=document
.getElementById("distributionChart")
.getContext("2d");

if(distributionChart)
distributionChart.destroy();

distributionChart=new Chart(ctx,{

type:"doughnut",

data:{

labels:[
"Authentiques",
"Suspects",
"Fraudes"
],

datasets:[{

data:[
data.valid||0,
data.warning||0,
data.fraud||0
],

backgroundColor:[
"#00b86b",
"#f6c445",
"#dc2626"
]

}]

},

options:{

responsive:true

}

});

}

function drawRegions(list){

const ctx=document
.getElementById("regionChart")
.getContext("2d");

if(regionChart)
regionChart.destroy();

regionChart=new Chart(ctx,{

type:"bar",

data:{

labels:list.map(x=>x.region),

datasets:[{

label:"Indice",

data:list.map(x=>x.score),

backgroundColor:"#6d28d9"

}]

},

options:{

responsive:true,

plugins:{
legend:{display:false}
}

}

});

}

async function loadPredictions(){

const data=await api("/intelligence/predictions");

const tbody=document
.getElementById("predictionTable");

tbody.innerHTML="";

data.forEach(p=>{

tbody.innerHTML+=`

<tr>

<td>${p.product}</td>

<td>${p.company}</td>

<td>${p.city}</td>

<td>${p.probability}%</td>

<td>${p.level}</td>

</tr>

`;

});

}

async function loadHistory(){

const data=await api("/intelligence/history");

const tbody=document
.getElementById("historyTable");

tbody.innerHTML="";

data.forEach(r=>{

tbody.innerHTML+=`

<tr>

<td>${r.date}</td>

<td>${r.product}</td>

<td>${r.city}</td>

<td>${r.engine}</td>

<td>${r.decision}</td>

<td>${r.confidence}%</td>

</tr>

`;

});

}

async function loadZones(){

const data=await api("/intelligence/zones");

const tbody=document
.getElementById("zoneTable");

tbody.innerHTML="";

data.forEach(z=>{

tbody.innerHTML+=`

<tr>

<td>${z.city}</td>

<td>${z.score}</td>

</tr>

`;

});

}

async function loadAlerts(){

const data=await api("/intelligence/alerts");

const box=document
.getElementById("liveAlerts");

box.innerHTML="";

data.forEach(a=>{

box.innerHTML+=`

<div class="alert">

<strong>${a.title}</strong>

<br>

${a.description}

<br>

<small>

${a.time}

</small>

</div>

`;

});

}

async function refresh(){

await loadDashboard();

await loadPredictions();

await loadHistory();

await loadZones();

await loadAlerts();

}

refresh();

setInterval(

refresh,

30000

);