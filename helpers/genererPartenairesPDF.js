// ==========================================================
// helpers/genererPartenairesPDF.js
// ==========================================================

const PDFDocument=require("pdfkit");
const fs=require("fs");

async function genererPartenairesPDF(destination)
{

const pdf=new PDFDocument();

pdf.pipe(fs.createWriteStream(destination));

pdf.fontSize(22);

pdf.text("IMPRIMEURS PARTENAIRES");

pdf.moveDown();

pdf.fontSize(13);

pdf.text(
`Entreprise
Ville
Téléphone
Email

(Liste administrée par l'ANOR)`
);

pdf.end();

}

module.exports=genererPartenairesPDF;