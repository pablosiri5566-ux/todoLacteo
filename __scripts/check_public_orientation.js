const PDFExtract = require('./node_modules/pdf.js-extract').PDFExtract;
const fs = require('fs');
const path = require('path');

const pdfExtract = new PDFExtract();
const options = {};

const files = [
    'public/Trailer Classic Compact 12m Argentina.cleaned espaniol.pdf',
    'public/Trailer Premium 30 m3 Argentina_0704026.cleaned_Censurado espaniol.pdf',
    'public/Trailer line Premium26.pdf'
];

async function checkOrientation() {
    let results = [];
    for (const file of files) {
        const fullPath = path.join(__dirname, '..', file);
        if (!fs.existsSync(fullPath)) {
            console.log(`Not found: ${fullPath}`);
            continue;
        }
        
        try {
            const data = await new Promise((resolve, reject) => {
                pdfExtract.extract(fullPath, options, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
            
            const page = data.pages[0];
            results.push({
                file: path.basename(file),
                width: page.pageInfo.width,
                height: page.pageInfo.height,
                orientation: page.pageInfo.width > page.pageInfo.height ? 'LANDSCAPE' : 'PORTRAIT'
            });
            
        } catch (err) {
            console.error(`Error in ${file}:`, err);
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

checkOrientation();
