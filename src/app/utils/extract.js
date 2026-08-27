import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

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
    // Step 1: Try digital text extraction first (fast, works on digitally created PDFs)
    let textFromLayer = '';
    try {
        const { extractText } = await import('unpdf');
        const uint8Array = new Uint8Array(buffer);
        const result = await extractText(uint8Array, { mergePages: true });
        textFromLayer = Array.isArray(result.text)
            ? result.text.join('\n')
            : (result.text || '');
        console.log(`[PDF] Text layer extraction: ${textFromLayer.length} characters`);
    } catch (e) {
        console.warn('[PDF] Text layer extraction failed, will try OCR:', e.message);
    }

    // If we got meaningful text (>20 chars) from text layer, use it
    if (textFromLayer && textFromLayer.trim().length > 20) {
        return textFromLayer.trim();
    }

    // Step 2: PDF is scanned (image-based). Use pdf-to-img + Tesseract OCR
    console.log('[PDF] No text layer found. Running OCR pipeline...');
    try {
        const { pdfToPng } = await import('pdf-to-img');
        let fullText = '';
        let pageNum = 0;

        for await (const pageImage of pdfToPng(buffer)) {
            pageNum++;
            console.log(`[OCR] Processing page ${pageNum}...`);
            const { data: { text } } = await Tesseract.recognize(
                pageImage,
                'kan+hin+eng', // Kannada + Hindi + English language detection
                { logger: () => { } }
            );
            fullText += text + '\n';
            // Limit to 10 pages to avoid timeout
            if (pageNum >= 10) break;
        }

        console.log(`[OCR] Done. Total pages: ${pageNum}. Chars: ${fullText.length}`);
        return fullText.trim();
    } catch (err) {
        console.error('[OCR] Error:', err);
        throw new Error('Failed to parse PDF document: ' + err.message);
    }
}
