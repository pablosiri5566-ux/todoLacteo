const PDFExtract = require('pdf.js-extract').PDFExtract;
const path = require('path');

const pdfExtract = new PDFExtract();
const options = {};

const files = [
    'public/pdfs/Siloking_Compact_12m3.pdf',
    'public/pdfs/Siloking_Premium_30m3.pdf',
    'public/pdfs/Siloking_Premium_26m.pdf'
];

async function checkOrientation() {
    for (const file of files) {
        const fullPath = path.resolve(file);
        try {
            const data = await new Promise((resolve, reject) => {
                pdfExtract.extract(fullPath, options, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
            
            const firstPage = data.pages[0];
            const width = firstPage.pageInfo.width;
            const height = firstPage.pageInfo.height;
            console.log(`FILE: ${file} | WIDTH: ${width} | HEIGHT: ${height} | ORIENTATION: ${width > height ? 'LANDSCAPE (Horizontal)' : 'PORTRAIT (Vertical)'}`);
            
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    }
}

checkOrientation();
