const { PDFDocument, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function fixPdfs() {
    const jobs = [
        {
            src: 'public/Trailer Classic Compact 12m Argentina.cleaned espaniol.pdf',
            dest: 'public/pdfs/Siloking_Compact_12m3.pdf'
        },
        {
            src: 'public/Trailer Premium 30 m3 Argentina_0704026.cleaned_Censurado espaniol.pdf',
            dest: 'public/pdfs/Siloking_Premium_30m3.pdf'
        },
        {
            src: 'public/Trailer line Premium26.pdf',
            dest: 'public/pdfs/Siloking_Premium_26m.pdf'
        }
    ];

    for (const job of jobs) {
        const srcPath = path.resolve(job.src);
        const destPath = path.resolve(job.dest);
        
        if (!fs.existsSync(srcPath)) continue;

        const pdfBytes = fs.readFileSync(srcPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        pages.forEach((page) => {
            const { width, height } = page.getSize();
            const rotation = page.getRotation().angle;
            
            // Calculate effective view dimensions
            const isRotated = (rotation / 90) % 2 !== 0; // 90 or 270
            const viewWidth = isRotated ? height : width;
            const viewHeight = isRotated ? width : height;

            // If it's wider than tall, rotate it 90 degrees more
            if (viewWidth > viewHeight) {
                page.setRotation(degrees((rotation + 90) % 360));
            }
        });

        const finalPdfBytes = await pdfDoc.save();
        fs.writeFileSync(destPath, finalPdfBytes);
        console.log(`Updated ${job.dest}`);
    }
}

fixPdfs().catch(console.error);
