import { NextResponse } from 'next/server';
import { translateAndFormatPdfBuffer, processDocxBuffer } from '@/app/utils/ai';
import { generatePdfBuffer } from '@/app/utils/pdf';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const { name, type } = file;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File is too large (over 5MB). Please upload a smaller document.' }, { status: 400 });
        }

        let formattedMarkdownText = '';

        if (name.toLowerCase().endsWith('.pdf') || type === 'application/pdf') {
            formattedMarkdownText = await translateAndFormatPdfBuffer(buffer);
        } else if (name.toLowerCase().endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            formattedMarkdownText = await processDocxBuffer(buffer);
        } else {
            return NextResponse.json({ error: 'Unsupported file format. Please upload PDF or DOCX.' }, { status: 400 });
        }

        if (!formattedMarkdownText || formattedMarkdownText.trim() === '') {
            return NextResponse.json({ error: 'Translation and formatting failed or generated empty text.' }, { status: 500 });
        }

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
