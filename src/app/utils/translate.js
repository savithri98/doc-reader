import { translate } from '@vitalets/google-translate-api';

export async function translateTextToEnglish(text) {
    if (!text || text.trim() === '') return '';
    const MAX_CHUNK_LENGTH = 3000;
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

    let finalTranslatedText = '';
    for (const chunk of chunks) {
        try {
            const result = await translate(chunk, { to: 'en' });
            finalTranslatedText += result.text + '\n\n';
        } catch (e) {
            console.error('Error translating chunk:', e);
            throw new Error('Failed to translate portions of the document.');
        }
    }
    return finalTranslatedText.trim();
}
