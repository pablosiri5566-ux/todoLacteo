const PDFExtract = require('pdf.js-extract').PDFExtract;
const fs = require('fs');
const path = require('path');

const pdfExtract = new PDFExtract();
const options = {};

const files = [
    '../Product Card-ESpanol Final boumatic (1).pdf',
    '../score card productos externos.pdf'
];

async function generateDB() {
    let db = [];
    
    for (const file of files) {
        const fullPath = path.join(__dirname, file);
        if (!fs.existsSync(fullPath)) continue;
        
        try {
            const data = await new Promise((resolve, reject) => {
                pdfExtract.extract(fullPath, options, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
            
            for (let i = 0; i < data.pages.length; i++) {
                const page = data.pages[i];
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
                
                const nameMatch = cleanText.match(/Nombre del Producto:\s*(.+)/i);
                if (nameMatch) {
                    let name = nameMatch[1].trim().split('\n')[0].trim();
                    
                    let description = '';
                    const descMatch = cleanText.match(/(?:Presentación|Descripción)\s+de\s+Producto\s*•?([\s\S]*?)Nombre del Producto:/i);
                    if (descMatch) {
                        description = descMatch[1].replace(/[\n•]/g, ' ').replace(/\s+/g, ' ').trim();
                    } else {
                        // Fallback description based on the first paragraph before "Nombre del Producto"
                        const fallbackDesc = cleanText.split(/Nombre del Producto/i)[0].replace(/[\n•]/g, ' ').replace(/\s+/g, ' ').trim();
                        // Get last 200 chars as a snippet
                        description = fallbackDesc.length > 200 ? fallbackDesc.substring(fallbackDesc.length - 200) : fallbackDesc;
                    }
                    
                    if(name) {
                        db.push({
                            id: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                            name: name,
                            description: description,
                            pdf: path.basename(file),
                            page: i + 1 
                        });
                    }
                }
            }
            
        } catch (err) {
            console.error(err);
        }
    }
    
    fs.writeFileSync(path.join(__dirname, 'products.json'), JSON.stringify(db, null, 2));
    console.log(`Generated DB with ${db.length} products to products.json`);
}

generateDB();
