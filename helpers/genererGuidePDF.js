// ==========================================================
// helpers/genererGuidePDF.js
// ==========================================================

const PDFDocument=require("pdfkit");
const fs=require("fs");

async function genererGuidePDF(destination)
{

const pdf=new PDFDocument();

pdf.pipe(fs.createWriteStream(destination));

pdf.fontSize(24)
.text("GUIDE OFFICIEL DU SCEAU ANOR");

pdf.moveDown();

pdf.fontSize(14);

pdf.text("Couleur officielle : BLEU");

pdf.text("Taille minimale : 22 mm");

pdf.text("Résolution minimale : 600 dpi");

pdf.text("Supports : Offset - Laser - Numérique HD");

pdf.text("Ne jamais modifier les glyphes.");

pdf.text("Ne jamais changer la couleur.");

pdf.text("Ne jamais déformer le sceau.");

pdf.end();

}

module.exports=genererGuidePDF;