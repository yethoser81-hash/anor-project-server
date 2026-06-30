const PDFDocument=require("pdfkit");
const fs=require("fs");
const path=require("path");

module.exports=function(produit){

const fichier=path.join(
__dirname,
"generated",
`NOTICE_${produit.lot}.pdf`
);

const pdf=new PDFDocument();

pdf.pipe(fs.createWriteStream(fichier));

pdf.fontSize(22);

pdf.text("NOTICE D'UTILISATION");

pdf.moveDown();

pdf.fontSize(12);

pdf.text("Le sceau doit être imprimé à 600 dpi minimum.");

pdf.text("Ne jamais redimensionner.");

pdf.text("Ne jamais modifier.");

pdf.text("Lecture recommandée : 5 cm.");

pdf.text("");

pdf.text("Produit : "+produit.nom_produit);

pdf.end();

return fichier;

}