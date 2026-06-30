const PDFDocument=require("pdfkit");
const fs=require("fs");
const path=require("path");

module.exports=function(produit){

const fichier=path.join(
__dirname,
"generated",
`CERTIFICAT_${produit.lot}.pdf`
);

const pdf=new PDFDocument();

pdf.pipe(fs.createWriteStream(fichier));

pdf.fontSize(24);

pdf.text("CERTIFICAT OFFICIEL");

pdf.moveDown();

pdf.fontSize(14);

pdf.text("Produit : "+produit.nom_produit);

pdf.text("Fabricant : "+produit.nom_producteur);

pdf.text("Lot : "+produit.lot);

pdf.text("Origine : "+produit.pays_origine);

pdf.text("Date de fabrication : "+produit.date_fabrication);

pdf.text("Date péremption : "+produit.date_peremption);

pdf.end();

return fichier;

}