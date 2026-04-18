const { PDFDocument, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function rotatePdf() {
    const filePath = path.resolve('public/pdfs/Siloking_Premium_30m3.pdf');
    const pdfBytes = fs.readFileSync(filePath);
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    pages.forEach((page) => {
        const { width, height } = page.getSize();
        // If it's already portrait or has a rotation, we might need to adjust
        // But the user specifically said it's horizontal and wants it vertical.
        // Landscape is usually width > height.
        if (width > height) {
            page.setRotation(degrees(90));
        }
    });
    
    const rotatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, rotatedPdfBytes);
    console.log('PDF rotated successfully.');
}

rotatePdf().catch(console.error);
