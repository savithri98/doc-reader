import { NextResponse } from 'next/server';
import { translateAndFormatVisionBuffer, processDocxBuffer } from '@/app/utils/ai';
import { generatePdfBuffer } from '@/app/utils/pdf';

// Allow up to 5 minutes for large Gemini processing jobs
export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const { name, type } = file;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 20 * 1024 * 1024) {
            return NextResponse.json({ error: 'File is too large (over 20MB). Please upload a smaller document.' }, { status: 400 });
        }

        let formattedMarkdownText = '';
        let extension = name.substring(name.lastIndexOf('.'));
        const lName = name.toLowerCase();

        if (lName.match(/\.(pdf|jpg|jpeg|png)$/) || type.startsWith('image/') || type === 'application/pdf') {
            const finalMime = type || (lName.endsWith('.pdf') ? 'application/pdf' : (lName.endsWith('.png') ? 'image/png' : 'image/jpeg'));
            formattedMarkdownText = await translateAndFormatVisionBuffer(buffer, finalMime, extension);
        } else if (lName.endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            formattedMarkdownText = await processDocxBuffer(buffer);
        } else {
            return NextResponse.json({ error: 'Unsupported file format. Please upload PDF, DOCX, JPG, or PNG.' }, { status: 400 });
        }

        if (!formattedMarkdownText || formattedMarkdownText.trim() === '') {
            return NextResponse.json({ error: 'Translation and formatting failed or generated empty text.' }, { status: 500 });
        }

        const pdfBuffer = await generatePdfBuffer(formattedMarkdownText);

        // HTTP Headers only support Latin-1 (ASCII). Unicode filenames (like Kannada) will crash Next.js
        // We use the universally safe filename*=UTF-8'' encoding for the exact filename.
        const safeFilename = encodeURIComponent(`translated_${name.replace(/\.[^/.]+$/, "")}.pdf`);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="translated_document.pdf"; filename*=UTF-8''${safeFilename}`,
            },
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An error occurred during processing.' }, { status: 500 });
    }
}
