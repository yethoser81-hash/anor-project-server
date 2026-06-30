const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function dessinerSceauHD(produit){

    const taille=3000;

    const canvas=createCanvas(taille,taille);

    const ctx=canvas.getContext("2d");

    ctx.fillStyle="#ffffff";
    ctx.fillRect(0,0,taille,taille);

    ctx.translate(taille/2,taille/2);

    ctx.strokeStyle="#000";

    ctx.lineWidth=12;

    ctx.beginPath();
    ctx.arc(0,0,1200,0,Math.PI*2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0,0,900,0,Math.PI*2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0,0,550,0,Math.PI*2);
    ctx.stroke();

    ctx.font="70px Arial";
    ctx.fillStyle="#000";

    ctx.fillText(produit.nom_produit,-500,-1280);
    ctx.fillText(produit.nom_producteur,-500,1350);

    const sortie=path.join(
        __dirname,
        "generated",
        `SCEAU_HD_${produit.lot}.png`
    );

    fs.writeFileSync(sortie,canvas.toBuffer());

    return sortie;

}

module.exports=dessinerSceauHD;