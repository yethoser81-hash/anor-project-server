const PDFDocument=require("pdfkit");
const fs=require("fs");
const path=require("path");

module.exports=function(produit){

const fichier=path.join(
__dirname,
"generated",
`MENTIONS_LEGALES_${produit.lot}.pdf`
);

const pdf=new PDFDocument();

pdf.pipe(fs.createWriteStream(fichier));

pdf.fontSize(22);

pdf.text("AVERTISSEMENT JURIDIQUE");

pdf.moveDown();

pdf.fontSize(12);

pdf.text("Toute copie ou reproduction du sceau ANOR est interdite.");

pdf.text("");

pdf.text("Toute falsification pourra entraîner des poursuites.");

pdf.text("");

pdf.text("Produit concerné :");

pdf.text(produit.nom_produit);

pdf.text("Lot : "+produit.lot);

pdf.end();

return fichier;

}