import { NextResponse } from 'next/server';
import { extractTextFromDocx, extractTextFromPdf } from '@/app/utils/extract';
import { translateAndFormatWithAI } from '@/app/utils/ai';
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

        // ─── Native AI Translation & Semantic Formatting Step ──────────
        // This leverages Gemini 1.5 Pro to intelligently translate the entire text
        // while simultaneously rebuilding perfect markdown layout.
        const formattedMarkdownText = await translateAndFormatWithAI(extractedText);

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
