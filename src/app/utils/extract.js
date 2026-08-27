import mammoth from 'mammoth';
// pdf-parse loaded dynamically

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
        const pdfParse = require('pdf-parse');
        const result = await pdfParse(buffer);
        return result.text || '';
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF document.');
    }
}
