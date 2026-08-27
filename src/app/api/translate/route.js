import { NextResponse } from 'next/server';
import { extractTextFromDocx, extractTextFromPdf } from '@/app/utils/extract';
import { translateTextToEnglish } from '@/app/utils/translate';
import { formatDocumentWithAI } from '@/app/utils/ai';
import { generatePdfBuffer } from '@/app/utils/pdf';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const { name, type } = file;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let extractedText = '';

        if (name.toLowerCase().endsWith('.pdf') || type === 'application/pdf') {
            extractedText = await extractTextFromPdf(buffer);
        } else if (name.toLowerCase().endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await extractTextFromDocx(buffer);
        } else {
            return NextResponse.json({ error: 'Unsupported file format. Please upload PDF or DOCX.' }, { status: 400 });
        }

        if (!extractedText || extractedText.trim() === '') return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 400 });

        if (extractedText.length > 50000) return NextResponse.json({ error: 'File is too large to translate in free tier.' }, { status: 400 });

        const translatedText = await translateTextToEnglish(extractedText);

        if (!translatedText || translatedText.trim() === '') return NextResponse.json({ error: 'Translation resulted in empty text.' }, { status: 500 });

        // ─── AI Semantic Formatting Step ─────────────────────────────────
        const formattedMarkdownText = await formatDocumentWithAI(translatedText);

        const pdfBuffer = await generatePdfBuffer(formattedMarkdownText);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="translated_${name.replace(/\.[^/.]+$/, "")}.pdf"`,
            },
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An error occurred during processing.' }, { status: 500 });
    }
}
