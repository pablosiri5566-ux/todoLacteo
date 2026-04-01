const PDFExtract = require('pdf.js-extract').PDFExtract;
const fs = require('fs');
const path = require('path');

const pdfExtract = new PDFExtract();
const options = {};

const files = [
    '../Product Card-ESpanol Final boumatic (1).pdf',
    '../score card productos externos.pdf'
];

async function parseFiles() {
    for (const file of files) {
        const fullPath = path.join(__dirname, file);
        if (!fs.existsSync(fullPath)) {
            console.log(`Not found: ${fullPath}`);
            continue;
        }
        
        console.log(`\n======================================`);
        console.log(`READING: ${file}`);
        console.log(`======================================\n`);
        
        try {
            const data = await new Promise((resolve, reject) => {
                pdfExtract.extract(fullPath, options, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
            
            for (let i = 0; i < Math.min(4, data.pages.length); i++) {
                const page = data.pages[i];
                console.log(`\n[ PAGE ${i + 1} SAMPLE ] ->`);
                let lastY = -1;
                let text = '';
                for (const item of page.content) {
                    if (lastY !== -1 && Math.abs(item.y - lastY) > 5) {
                        text += '\n'; // new line
                    } else if (lastY !== -1) {
                        text += ' ';
                    }
                    text += item.str.trim();
                    lastY = item.y;
                }
                
                console.log(text.replace(/\n+/g, '\n').substring(0, 800));
            }
            
        } catch (err) {
            console.error(err);
        }
    }
}

parseFiles();
