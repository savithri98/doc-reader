import mammoth from 'mammoth';

export async function extractTextFromDocx(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        throw new Error('Failed to parse Word document.');
    }
}

export async function extractTextFromPdf(buffer) {
    try {
        // Use pdfjs-dist legacy build which works properly in Node.js
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdfDocument = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF document: ' + error.message);
    }
}
