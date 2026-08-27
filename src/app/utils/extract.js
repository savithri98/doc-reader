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
        const { extractText } = await import('unpdf');
        const uint8Array = new Uint8Array(buffer);
        const result = await extractText(uint8Array, { mergePages: true });
        // unpdf returns text as a string when mergePages:true, or array of strings per page
        const text = Array.isArray(result.text)
            ? result.text.join('\n')
            : (result.text || '');
        return text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF document: ' + error.message);
    }
}
