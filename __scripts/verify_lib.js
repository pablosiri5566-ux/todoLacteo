const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function verifyRotation() {
    const files = [
        'public/pdfs/Siloking_Compact_12m3.pdf',
        'public/pdfs/Siloking_Premium_30m3.pdf',
        'public/pdfs/Siloking_Premium_26m.pdf'
    ];

    for (const file of files) {
        const filePath = path.resolve(file);
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const rot = pages[0].getRotation().angle;
        const { width, height } = pages[0].getSize();
        console.log(`FILE: ${file} | SIZE: ${width}x${height} | ROTATION: ${rot}deg`);
    }
}

verifyRotation().catch(console.error);
