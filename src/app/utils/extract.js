// ==== DOM POLYFILLS (must be first - pdf-to-img uses pdfjs which needs these) ====
if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
            this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
            this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
            this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
            this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
            this.is2D = true; this.isIdentity = true;
        }
        static fromMatrix() { return new globalThis.DOMMatrix(); }
        static fromFloat32Array() { return new globalThis.DOMMatrix(); }
        static fromFloat64Array() { return new globalThis.DOMMatrix(); }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
        inverse() { return this; }
    };
}
if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = class Path2D {
        constructor() { }
        addPath() { }
        closePath() { }
        moveTo() { }
        lineTo() { }
        bezierCurveTo() { }
        quadraticCurveTo() { }
        arc() { }
        arcTo() { }
        ellipse() { }
        rect() { }
    };
}
if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
        constructor(data, width, height) {
            this.data = data; this.width = width; this.height = height;
        }
    };
}
if (typeof globalThis.OffscreenCanvas === 'undefined') {
    globalThis.OffscreenCanvas = class OffscreenCanvas {
        constructor(width, height) {
            this.width = width; this.height = height;
        }
        getContext() { return null; }
    };
}
// ================================================================================

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
