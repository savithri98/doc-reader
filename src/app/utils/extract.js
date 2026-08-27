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
    // Step 1: Try digital text extraction first (fast, works on digitally created PDFs)
    let textFromLayer = '';
    try {
        const { extractText } = await import('unpdf');
        const uint8Array = new Uint8Array(buffer);
        const result = await extractText(uint8Array, { mergePages: true });
        textFromLayer = Array.isArray(result.text)
            ? result.text.join('\n')
            : (result.text || '');
        console.log(`[PDF] Text layer: ${textFromLayer.trim().length} chars`);
    } catch (e) {
        console.warn('[PDF] Text layer extraction failed:', e.message);
    }

    if (textFromLayer && textFromLayer.trim().length > 20) {
        return textFromLayer.trim();
    }

    // Step 2: OCR pipeline for scanned/image-based PDFs
    console.log('[PDF] No text layer. Running Tesseract OCR...');
    const tmpPath = join(tmpdir(), `ocr_input_${Date.now()}.pdf`);
    try {
        // Write buffer to a temp file (pdf-to-img requires a file path)
        await writeFile(tmpPath, buffer);

        const { pdf } = await import('pdf-to-img');
        const doc = await pdf(tmpPath, { scale: 2 });

        let fullText = '';
        let pageNum = 0;

        for await (const pageImage of doc) {
            pageNum++;
            console.log(`[OCR] Page ${pageNum}...`);
            const { data: { text } } = await Tesseract.recognize(
                pageImage,
                'kan+hin+eng',
                { logger: () => { } }
            );
            fullText += text + '\n';
            if (pageNum >= 10) break; // Max 10 pages
        }

        console.log(`[OCR] Done: ${pageNum} pages, ${fullText.length} chars`);
        return fullText.trim();
    } catch (err) {
        console.error('[OCR] Error:', err);
        throw new Error('Failed to parse PDF document: ' + err.message);
    } finally {
        // Clean up temp file
        try { await unlink(tmpPath); } catch (_) { }
    }
}
