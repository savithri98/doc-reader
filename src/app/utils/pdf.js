import PDFDocument from 'pdfkit';

export async function generatePdfBuffer(text) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            doc.font('Helvetica');
            doc.fontSize(12);

            doc.text(text, { width: 495, align: 'left' });
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
