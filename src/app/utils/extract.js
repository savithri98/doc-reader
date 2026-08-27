import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

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
    console.log('[PDF] Running OCR pipeline via tesseract.js...');
    const tmpPath = join(tmpdir(), `ocr_input_${Date.now()}.pdf`);
    try {
        await writeFile(tmpPath, buffer);

        const { pdf } = await import('pdf-to-img');
        const doc = await pdf(tmpPath, { scale: 2 });

        let fullText = '';
        let pageNum = 0;

        for await (const pageImage of doc) {
            pageNum++;
            console.log(`[OCR] Processing page ${pageNum}...`);
            const { data: { text } } = await Tesseract.recognize(
                pageImage,
                'kan+hin+eng',
                { logger: () => { } }
            );
            fullText += text + '\n';
            if (pageNum >= 10) break;
        }

        console.log(`[OCR] Done: ${pageNum} pages, ${fullText.length} chars`);
        return fullText.trim();
    } catch (err) {
        console.error('[OCR] Error:', err);
        throw new Error('Failed to parse PDF document: ' + err.message);
    } finally {
        try { await unlink(tmpPath); } catch (_) { }
    }
}
