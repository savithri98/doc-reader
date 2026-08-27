import PDFDocument from 'pdfkit';

/**
 * Generates a clean, structured PDF by natively parsing the AI's Markdown output.
 */
export async function generatePdfBuffer(markdownText) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 72,
                size: 'A4',
                autoFirstPage: true,
                bufferPages: true,
                info: {
                    Title: 'Translated Document',
                    Author: 'Document Translator',
                }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

            // ─── Header ───────────────────────────────────────────────
            doc.font('Helvetica-Bold')
                .fontSize(20)
                .fillColor('#1a1a2e')
                .text('Translated Document', { align: 'center' });

            doc.moveDown(0.4);
            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.margins.left + pageWidth, doc.y)
                .strokeColor('#8b5cf6').lineWidth(2).stroke();
            doc.moveDown(1.2);

            // ─── Parse Markdown Line by Line ───────────────────────────────────
            const lines = markdownText.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (!line) {
                    doc.moveDown(0.3); // Minor spacing for blank lines
                    continue;
                }

                // H1
                if (line.startsWith('# ')) {
                    doc.moveDown(0.8);
                    doc.font('Helvetica-Bold')
                        .fontSize(18)
                        .fillColor('#2d2d6e')
                        .text(line.replace(/^#\s*/, ''), { width: pageWidth, align: 'left' });
                    // Underline Main Headings
                    doc.moveTo(doc.page.margins.left, doc.y + 3)
                        .lineTo(doc.page.margins.left + pageWidth * 0.5, doc.y + 3)
                        .strokeColor('#8b5cf6').lineWidth(1).stroke();
                    doc.moveDown(0.8);
                    continue;
                }

                // H2
                if (line.startsWith('## ')) {
                    doc.moveDown(0.6);
                    doc.font('Helvetica-Bold')
                        .fontSize(15)
                        .fillColor('#3d3d82')
                        .text(line.replace(/^##\s*/, ''), { width: pageWidth, align: 'left' });
                    doc.moveDown(0.5);
                    continue;
                }

                // H3 / H4
                if (line.startsWith('### ') || line.startsWith('#### ')) {
                    doc.moveDown(0.5);
                    doc.font('Helvetica-Bold')
                        .fontSize(13)
                        .fillColor('#505096')
                        .text(line.replace(/^#{3,4}\s*/, ''), { width: pageWidth, align: 'left' });
                    doc.moveDown(0.3);
                    continue;
                }

                // List Items (Bullet or Numbered)
                if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
                    // Remove Markdown Bold (**text**) just for cleaner output since Helvetica-Bold inline is tricky in PDFKit
                    const cleanListLine = line.replace(/\*\*/g, '');

                    doc.font('Helvetica')
                        .fontSize(12)
                        .fillColor('#222222')
                        .text(cleanListLine, {
                            width: pageWidth - 20,
                            indent: 20,
                            align: 'left',
                            lineGap: 4,
                        });
                    doc.moveDown(0.2);
                    continue;
                }

                // Regular Paragraph
                const cleanPara = line.replace(/\*\*/g, ''); // strip markdown bold markers
                doc.font('Helvetica')
                    .fontSize(12)
                    .fillColor('#1a1a1a')
                    .text(cleanPara, {
                        width: pageWidth,
                        align: 'justify',
                        lineGap: 5,
                    });
                doc.moveDown(0.5);
            }

            // ─── Page Numbers ──────────────────────────────────────────────────
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(range.start + i);
                doc.font('Helvetica')
                    .fontSize(9)
                    .fillColor('#999')
                    .text(
                        `Page ${i + 1} of ${range.count}`,
                        doc.page.margins.left,
                        doc.page.height - 45,
                        { align: 'center', width: pageWidth }
                    );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
