import { GoogleGenAI } from '@google/genai';

export async function translateAndFormatWithAI(rawText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A Gemini API Key is required in .env.local to perform High-Quality Translation & Formatting.");

    console.log('[AI] Translating and formatting document with Gemini 1.5 Pro...');

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
You are an expert bilingual Translator and professional Document Formatter. 
I am providing you with text extracted from a document (which might be in Kannada, Hindi, or English) via OCR. The text may have messy sentence boundaries.

Your task is to:
1. Accurately and fluently translate the ENTIRE text into highly professional English.
2. Carefully analyze the context and semantic structure of the document to powerfully recreate its layout.
3. Use standard Markdown to format the output:
   - Mark the Main Document Title with # (H1)
   - Mark Major Section Headings with ## (H2)
   - Mark Subheadings with ### (H3)
   - **Crucially:** Ensure that paragraphs logically follow and belong under their respective headings.
   - Reconstruct list items clearly using Markdown bullets (-) or numbering (1., 2.).
4. Automatically correct any OCR spelling misinterpretations based on context.
5. Provide ONLY the final translated Markdown output. Do not output anything else.

Raw Extracted Text:
"""
${rawText}
"""
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: prompt,
        });

        console.log('[AI] Translation and Formatting complete.');
        return response.text.trim();
    } catch (e) {
        console.error("[AI] Semantic Pipeline failed:", e.message);
        throw new Error("AI Processing Failed: " + e.message);
    }
}
