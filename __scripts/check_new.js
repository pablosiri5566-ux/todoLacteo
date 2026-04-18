const PDFExtract = require('./node_modules/pdf.js-extract').PDFExtract;
const fs = require('fs');
const path = require('path');

const pdfExtract = new PDFExtract();
const options = {};

const files = [
    '../public/pdfs/Siloking_Compact_12m3.pdf',
    '../public/pdfs/Siloking_Premium_30m3.pdf',
    '../public/pdfs/Siloking_Premium_26m.pdf'
];

async function parseNewFiles() {
    let results = [];
    for (const file of files) {
        const fullPath = path.join(__dirname, file);
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
            
            // Get text from first page
            const page = data.pages[0];
            let lastY = -1;
            let text = '';
            for (const item of page.content) {
                if (lastY !== -1 && Math.abs(item.y - lastY) > 5) {
                    text += '\n';
                } else if (lastY !== -1) {
                    text += ' ';
                }
                text += item.str.trim();
                lastY = item.y;
            }
            
            const cleanText = text.replace(/\n+/g, '\n').replace(/  +/g, ' ');
            results.push({
                file: path.basename(file),
                text: cleanText.substring(0, 1000),
                width: page.pageInfo.width,
                height: page.pageInfo.height
            });
            
        } catch (err) {
            console.error(`Error in ${file}:`, err);
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

parseNewFiles();
