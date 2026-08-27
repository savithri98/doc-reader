import { GoogleGenAI } from '@google/genai';

export async function formatDocumentWithAI(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return text; // Silently fallback to raw if no API key is provided

    console.log('[AI] Formatting document structure with Gemini 1.5 Flash...');

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
You are a highly intelligent professional document formatter. I will provide you with a long block of translated text extracted via OCR from a PDF. Sentences and formatting are messy.
Your task is to completely reconstruct the original semantic structure of the document using standard Markdown formatting.

Follow these strict rules:
1. Identify the Main Document Title and mark it with # (H1)
2. Identify Section Headings and mark them with ## (H2)
3. Identify Subheadings and mark them with ### (H3)
4. Reconstruct any bullet points or numbered lists and format them cleanly as Markdown lists (using - or 1.)
5. Group regular prose into clean, highly readable paragraphs separated by a single blank line.
6. Fix any obvious sentence fragments that were broken by random line breaks.
7. Do NOT change the meaning or words of the translation, only repair grammar, structure and formatting.
8. Output STRICTLY the Markdown text and nothing else. No introductory/concluding chat.

Text to format:
"""
${text}
"""
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        console.log('[AI] Formatting complete.');
        return response.text.trim();
    } catch (e) {
        console.error("[AI] Semantic Formatting failed:", e.message);
        return text; // Fallback to raw text if AI fails
    }
}
