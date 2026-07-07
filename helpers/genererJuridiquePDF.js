// ==========================================================
// helpers/genererJuridiquePDF.js
// ==========================================================

const PDFDocument=require("pdfkit");
const fs=require("fs");

async function genererJuridiquePDF(destination)
{

const pdf=new PDFDocument();

pdf.pipe(fs.createWriteStream(destination));

pdf.fontSize(22);

pdf.text("AVERTISSEMENT JURIDIQUE");

pdf.moveDown();

pdf.fontSize(12);

pdf.text(
`Le sceau numérique ANOR est protégé.

Toute reproduction,
contrefaçon,
imitation,
altération,
fabrication,
utilisation frauduleuse
ou diffusion
est susceptible de poursuites.

Sanctions possibles :

• Faux et usage de faux.

• Contrefaçon.

• Dommages et intérêts.

• Retrait immédiat de la certification.

• Suspension des autorisations.

• Saisine des juridictions compétentes.

L'ANOR se réserve toute action judiciaire.
`
);

pdf.end();

}

module.exports=genererJuridiquePDF;