// ==========================================================
// helpers/genererSerialisationXML.js
// ==========================================================

const fs=require("fs");

async function genererXML(
liste,
destination
)
{

let xml='<?xml version="1.0"?>\n';

xml+='<serialisation>\n';

liste.forEach(n=>{

xml+=`   <numero>${n}</numero>\n`;

});

xml+='</serialisation>';

fs.writeFileSync(
destination,
xml,
"utf8"
);

}

module.exports=genererXML;