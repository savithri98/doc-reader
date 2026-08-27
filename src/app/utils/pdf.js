import PDFDocument from 'pdfkit';

/**
 * Detects what type of line this is for formatting purposes.
 * Returns: 'heading' | 'subheading' | 'list-item' | 'paragraph' | 'blank'
 */
function detectLineType(line, nextLine = '') {
    if (!line || line.trim().length === 0) return 'blank';

    const trimmed = line.trim();

    // Numbered list: "1.", "1)", "a.", "a)"
    if (/^(\d+[\.\)]\s|[a-z][\.\)]\s)/i.test(trimmed)) return 'list-item';

    // Bullet points
    if (/^[\•\-\*\u2022\u25CF\u2013]\s/.test(trimmed)) return 'list-item';

    // Short line (<= 60 chars) followed by longer content or blank = likely a heading/subheading
    const isShort = trimmed.length <= 70;
    const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed);

    if (isAllCaps && isShort) return 'heading';

    // Title-case short standalone lines followed by paragraph = subheading
    if (isShort && (nextLine.trim().length > 60 || nextLine.trim().length === 0)) {
        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount <= 8) return 'subheading';
    }

    return 'paragraph';
}

/**
 * Generates a clean, structured PDF with intelligent heading detection.
 */
export async function generatePdfBuffer(text) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 72,
                size: 'A4',
                autoFirstPage: true,
                bufferPages: true,
                info: {
                    Title: 'Translated Document',
                    Author: 'Document Translator',
                }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

            // ─── Document Header ───────────────────────────────────────────────
            doc.font('Helvetica-Bold')
                .fontSize(20)
                .fillColor('#1a1a2e')
                .text('Translated Document', { align: 'center' });

            doc.moveDown(0.4);
            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.margins.left + pageWidth, doc.y)
                .strokeColor('#8b5cf6').lineWidth(2).stroke();
            doc.moveDown(1.2);

            // ─── Body Text ─────────────────────────────────────────────────────
            const rawLines = text
                .replace(/\r\n/g, '\n')
                .replace(/[ \t]+/g, ' ')    // Collapse multiple spaces
                .split('\n');

            // Merge lines into logical blocks (paragraphs and headings)
            const blocks = [];
            let currentPara = [];

            for (let i = 0; i < rawLines.length; i++) {
                const line = rawLines[i].trim();
                const nextLine = (rawLines[i + 1] || '').trim();
                const type = detectLineType(line, nextLine);

                if (type === 'blank') {
                    if (currentPara.length > 0) {
                        blocks.push({ type: 'paragraph', text: currentPara.join(' ') });
                        currentPara = [];
                    }
                } else if (type === 'heading' || type === 'subheading') {
                    if (currentPara.length > 0) {
                        blocks.push({ type: 'paragraph', text: currentPara.join(' ') });
                        currentPara = [];
                    }
                    blocks.push({ type, text: line });
                } else if (type === 'list-item') {
                    if (currentPara.length > 0) {
                        blocks.push({ type: 'paragraph', text: currentPara.join(' ') });
                        currentPara = [];
                    }
                    blocks.push({ type: 'list-item', text: line });
                } else {
                    currentPara.push(line);
                }
            }
            if (currentPara.length > 0) {
                blocks.push({ type: 'paragraph', text: currentPara.join(' ') });
            }

            // ─── Render Blocks ─────────────────────────────────────────────────
            for (const block of blocks) {
                if (!block.text.trim()) continue;

                switch (block.type) {
                    case 'heading':
                        doc.moveDown(0.6);
                        doc.font('Helvetica-Bold')
                            .fontSize(15)
                            .fillColor('#2d2d6e')
                            .text(block.text, { width: pageWidth, align: 'left' });
                        // Underline
                        doc.moveTo(doc.page.margins.left, doc.y + 3)
                            .lineTo(doc.page.margins.left + pageWidth * 0.5, doc.y + 3)
                            .strokeColor('#8b5cf6').lineWidth(1).stroke();
                        doc.moveDown(0.5);
                        break;

                    case 'subheading':
                        doc.moveDown(0.5);
                        doc.font('Helvetica-Bold')
                            .fontSize(13)
                            .fillColor('#444480')
                            .text(block.text, { width: pageWidth, align: 'left' });
                        doc.moveDown(0.3);
                        break;

                    case 'list-item':
                        doc.font('Helvetica')
                            .fontSize(12)
                            .fillColor('#1a1a1a')
                            .text(block.text, {
                                width: pageWidth - 20,
                                indent: 20,
                                align: 'left',
                                lineGap: 3,
                            });
                        doc.moveDown(0.2);
                        break;

                    case 'paragraph':
                    default:
                        doc.font('Helvetica')
                            .fontSize(12)
                            .fillColor('#1a1a1a')
                            .text(block.text, {
                                width: pageWidth,
                                align: 'justify',
                                lineGap: 4,
                            });
                        doc.moveDown(0.7);
                        break;
                }
            }

            // ─── Page Numbers ──────────────────────────────────────────────────
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(range.start + i);
                doc.font('Helvetica')
                    .fontSize(9)
                    .fillColor('#999')
                    .text(
                        `Page ${i + 1} of ${range.count}`,
                        doc.page.margins.left,
                        doc.page.height - 45,
                        { align: 'center', width: pageWidth }
                    );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
