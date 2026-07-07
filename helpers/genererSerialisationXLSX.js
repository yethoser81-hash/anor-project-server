// ==========================================================
// helpers/genererSerialisationXLSX.js
// ==========================================================

const Excel=require("exceljs");

async function genererXLSX(
liste,
destination
)
{

const wb=new Excel.Workbook();

const ws=wb.addWorksheet("Serialisation");

ws.columns=[

{

header:"Numero",

key:"numero",

width:35

}

];

liste.forEach(n=>{

ws.addRow({

numero:n

});

});

await wb.xlsx.writeFile(destination);

}

module.exports=genererXLSX;