import { translate } from '@vitalets/google-translate-api';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Translates a single chunk with retry logic.
 */
async function translateChunk(text, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await translate(text, { to: 'en' });
            return result.text || '';
        } catch (e) {
            console.warn(`[Translate] Attempt ${attempt}/${retries} failed:`, e.message);
            if (attempt < retries) {
                // Exponential backoff: 2s, 4s, 8s
                const delay = 1000 * Math.pow(2, attempt);
                console.log(`[Translate] Retrying in ${delay}ms...`);
                await sleep(delay);
            } else {
                throw e;
            }
        }
    }
}

export async function translateTextToEnglish(text) {
    if (!text || text.trim() === '') return '';

    // Smaller chunks (1500 chars) to reduce per-request load
    const MAX_CHUNK_LENGTH = 1500;
    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split(/\n+/);

    for (const para of paragraphs) {
        if ((currentChunk.length + para.length) > MAX_CHUNK_LENGTH) {
            if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
            currentChunk = para + '\n';
        } else {
            currentChunk += para + '\n';
        }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());

    console.log(`[Translate] Translating ${chunks.length} chunks...`);
    let finalTranslatedText = '';

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;

        console.log(`[Translate] Chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);
        try {
            const translated = await translateChunk(chunk);
            finalTranslatedText += translated + '\n\n';
        } catch (e) {
            console.error(`[Translate] Chunk ${i + 1} permanently failed:`, e.message);
            // Append partial failure notice but continue rather than stopping entirely
            finalTranslatedText += `[Translation error for this section: ${e.message}]\n\n`;
        }

        // Polite delay between chunks to avoid rate limiting (500ms)
        if (i < chunks.length - 1) {
            await sleep(500);
        }
    }

    return finalTranslatedText.trim();
}
