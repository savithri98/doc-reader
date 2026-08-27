import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';

/**
 * Translates and formats a raw text string (Used for Word Documents)
 */
export async function translateAndFormatText(rawText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A Gemini API Key is required in .env.local.");

    console.log('[AI] Translating DOCX text with Gemini 1.5 Pro...');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert bilingual Translator and Document Formatter.
Translate the following text into highly professional English and format it perfectly using standard Markdown (H1, H2, bullets, paragraphs).
Do not output anything except the Markdown.

Text:
"""
${rawText}
"""`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });

    console.log('[AI] DOCX Translation complete.');
    return response.text.trim();
}

/**
 * Parses, Translates, and Formats a raw PDF buffer natively using Gemini (Skipping all local OCR!)
 */
export async function translateAndFormatPdfBuffer(pdfBuffer) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A Gemini API Key is required in .env.local.");

    console.log('[AI] Natively reading and translating PDF with Gemini 1.5 Pro...');
    const ai = new GoogleGenAI({ apiKey });

    // Passing the file natively as inline Data allows Gemini to perform its own world-class OCR
    const documentPart = {
        inlineData: {
            data: pdfBuffer.toString('base64'),
            mimeType: 'application/pdf'
        }
    };

    const prompt = `
You are an expert bilingual Translator and professional Document Formatter.
Please read this attached PDF document (which may contain Kannada, Hindi, or English text, either digital or scanned).

Your task is to:
1. Accurately and fluently translate the ENTIRE document into highly professional English.
2. Carefully analyze the semantic structure of the document to powerfully recreate its layout.
3. Use standard Markdown to format the output:
   - Mark the Main Document Title with # (H1)
   - Mark Major Section Headings with ## (H2)
   - Mark Subheadings with ### (H3)
   - Ensure that paragraphs logically follow and belong under their respective headings.
   - Reconstruct list items clearly using Markdown bullets (-) or numbering (1., 2.).
4. Provide ONLY the final translated Markdown output. Do not output conversational filler.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [documentPart, prompt]
    });

    console.log('[AI] PDF Processing complete.');
    return response.text.trim();
}

/**
 * Helper to process DOCX since Gemini API handles PDFs better natively than DOCX in inlineData
 */
export async function processDocxBuffer(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return translateAndFormatText(result.value || '');
}
