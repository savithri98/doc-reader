import PDFDocument from 'pdfkit';

/**
 * Generates a clean, well-formatted PDF from the translated English text.
 */
export async function generatePdfBuffer(text) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 72, // 1 inch margins
                size: 'A4',
                info: {
                    Title: 'Translated Document',
                    Author: 'Document Translator',
                }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Document Title Header
            doc.font('Helvetica-Bold')
                .fontSize(18)
                .fillColor('#1a1a2e')
                .text('Translated Document', { align: 'center' });

            doc.moveDown(0.3);

            // Divider line
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.margins.left + pageWidth, doc.y)
                .strokeColor('#8b5cf6')
                .lineWidth(2)
                .stroke();

            doc.moveDown(1);

            // Clean and split text into meaningful paragraphs
            const cleanedText = text
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to double
                .trim();

            const paragraphs = cleanedText.split(/\n\n+/);

            doc.font('Helvetica')
                .fontSize(12)
                .fillColor('#1a1a1a');

            for (const para of paragraphs) {
                const lines = para.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                const paraText = lines.join(' ').trim();

                if (!paraText) continue;

                doc.text(paraText, {
                    width: pageWidth,
                    align: 'justify',
                    lineGap: 4,
                });

                doc.moveDown(0.8); // Space between paragraphs
            }

            // Page number footer
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.font('Helvetica')
                    .fontSize(9)
                    .fillColor('#888')
                    .text(
                        `Page ${i + 1} of ${range.count}`,
                        doc.page.margins.left,
                        doc.page.height - 40,
                        { align: 'center', width: pageWidth }
                    );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
