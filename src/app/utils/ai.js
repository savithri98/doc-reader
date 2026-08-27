import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const PROMPT = `
You are an expert bilingual Translator and professional Document Formatter.
Please read this PDF document (which may contain Kannada, Hindi, or English text).

Your task is to:
1. Accurately and fluently translate the ENTIRE document into highly professional English.
2. Carefully analyze the semantic structure to recreate the document layout.
3. Format the output using standard Markdown:
   - Main Document Title: # (H1)
   - Major Section Headings: ## (H2)
   - Subheadings: ### (H3)
   - Group paragraphs logically under their headings.
   - Reconstruct list items as Markdown bullets (-) or numbers (1., 2.).
4. Provide ONLY the final translated Markdown. No conversational filler.
`;

/**
 * Translates and formats a raw DOCX text string using Gemini.
 */
export async function translateAndFormatText(rawText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A Gemini API Key is required in .env.local.");

    console.log('[AI] Translating DOCX text with Gemini...');
    const ai = new GoogleGenAI({ apiKey });

    const textPrompt = `
You are an expert bilingual Translator and Document Formatter.
Translate the following text into highly professional English and format it using standard Markdown (H1, H2, bullets, paragraphs).
Output ONLY the final Markdown, nothing else.

Text:
"""
${rawText}
"""`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt,
    });

    console.log('[AI] DOCX Translation complete.');
    return response.text.trim();
}

/**
 * Uploads the PDF via File API and then translates it with Gemini.
 * Using File API avoids the inline base64 size limits that cause 5-minute timeouts.
 */
export async function translateAndFormatPdfBuffer(pdfBuffer) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A Gemini API Key is required in .env.local.");

    console.log(`[AI] PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    const ai = new GoogleGenAI({ apiKey });

    // Write buffer to a temp file for upload
    const tmpPath = join(tmpdir(), `gemini_upload_${Date.now()}.pdf`);
    let uploadedFile;

    try {
        await writeFile(tmpPath, pdfBuffer);

        console.log('[AI] Uploading PDF via File API...');
        uploadedFile = await ai.files.upload({
            file: tmpPath,
            config: { mimeType: 'application/pdf' }
        });
        console.log(`[AI] Upload complete: ${uploadedFile.name}`);

        // Wait for the file to be ready
        let file = await ai.files.get({ name: uploadedFile.name });
        let attempts = 0;
        while (file.state === 'PROCESSING' && attempts < 30) {
            await new Promise(r => setTimeout(r, 3000));
            file = await ai.files.get({ name: uploadedFile.name });
            attempts++;
            console.log(`[AI] File state: ${file.state} (attempt ${attempts})`);
        }

        if (file.state !== 'ACTIVE') {
            throw new Error(`File processing failed with state: ${file.state}`);
        }

        console.log('[AI] Generating translation...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { fileData: { mimeType: 'application/pdf', fileUri: file.uri } },
                PROMPT
            ]
        });

        console.log('[AI] PDF Processing complete.');
        return response.text.trim();

    } finally {
        // Clean up temp file
        try { await unlink(tmpPath); } catch (_) { }
        // Clean up uploaded file from Gemini servers
        if (uploadedFile?.name) {
            try { await ai.files.delete({ name: uploadedFile.name }); } catch (_) { }
        }
    }
}

/**
 * Helper to process DOCX: extract raw text, then translate via Gemini.
 */
export async function processDocxBuffer(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return translateAndFormatText(result.value || '');
}
