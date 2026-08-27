import translate from 'google-translate-api-x';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Translates a single chunk with retry logic.
 */
async function translateChunk(text, retries = 4) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // google-translate-api-x handles most rate limiting under the hood,
            // but we add specific options to bypass strict IP limits
            const result = await translate(text, {
                to: 'en',
                forceBatch: false,
                fallback: true,
                rejectOnPartialFail: false
            });
            return result.text || '';
        } catch (e) {
            console.warn(`[Translate] Attempt ${attempt}/${retries} failed:`, e.name, e.message);
            if (attempt < retries) {
                // Exponential backoff: 3s, 6s, 12s
                const delay = 1500 * Math.pow(2, attempt);
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

    // Even smaller chunks to completely stay under anti-spam radar
    const MAX_CHUNK_LENGTH = 1000;
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

    console.log(`[Translate] Translating ${chunks.length} chunks safely...`);
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
            finalTranslatedText += `\n[Translation error for this section: ${e.message}]\n\n`;
        }

        // Extremely polite delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
            await sleep(1000);
        }
    }

    return finalTranslatedText.trim();
}
