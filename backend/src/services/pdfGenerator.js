/**
 * PDF Generator for SyncDoc PDF Export Engine.
 * Converts a canonical IR Document into a PDF Buffer using PDFKit.
 */

import PDFDocument from 'pdfkit';
import { isSafeUrl } from './sanitizer.js';

/**
 * Replaces non-WinAnsi / non-Latin1 characters (> 255) with safe equivalents or '?'
 * to prevent PDFKit standard font crashes.
 *
 * @param {string} str
 * @returns {string}
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^\x00-\xFF]/g, '?');
}

/**
 * Returns the PDFKit standard font name based on bold and italic flags.
 *
 * @param {boolean} bold
 * @param {boolean} italic
 * @returns {string}
 */
function getFontName(bold, italic) {
  if (bold && italic) return 'Helvetica-BoldOblique';
  if (bold) return 'Helvetica-Bold';
  if (italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

const HEADING_CONFIGS = {
  1: { fontSize: 24, lineGap: 4, spaceBefore: 16, spaceAfter: 8 },
  2: { fontSize: 20, lineGap: 4, spaceBefore: 14, spaceAfter: 6 },
  3: { fontSize: 17, lineGap: 3, spaceBefore: 12, spaceAfter: 6 },
  4: { fontSize: 14, lineGap: 3, spaceBefore: 10, spaceAfter: 4 },
  5: { fontSize: 12, lineGap: 2, spaceBefore: 8, spaceAfter: 4 },
  6: { fontSize: 11, lineGap: 2, spaceBefore: 8, spaceAfter: 4 },
};

const BULLET_MARKERS = ['•', '◦', '▪'];

/**
 * Generates an A4 PDF Buffer from an IR Document.
 *
 * @param {object} irDoc - Canonical IR Document.
 * @returns {Promise<Buffer>}
 */
export function generatePDF(irDoc) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 54, // ~0.75 in
        bufferPages: true,
        info: {
          Title: 'SyncDoc Document',
          Producer: 'SyncDoc',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageHeight = 841.89; // A4 height
      const margin = 54;
      const bottomLimit = pageHeight - margin - 30; // 30pt safety margin above footer
      const printableWidth = 595.28 - margin * 2;

      function checkPageBreak(neededHeight = 30) {
        if (doc.y + neededHeight > bottomLimit) {
          doc.addPage();
        }
      }

      function renderInlines(content = [], options = {}) {
        const { defaultFontSize = 11, defaultFont = 'Helvetica', isBlockquote = false } = options;

        if (!content || content.length === 0) {
          return;
        }

        for (let i = 0; i < content.length; i++) {
          const run = content[i];
          const isLast = i === content.length - 1;

          if (run.type === 'lineBreak') {
            doc.text('\n', { continued: !isLast });
            continue;
          }

          if (run.type === 'text') {
            const fontName = getFontName(run.bold, run.italic || isBlockquote);
            const fontSize = defaultFontSize;
            const safeLink = run.link && isSafeUrl(run.link) ? run.link : null;
            let color = safeLink ? '#2563EB' : isBlockquote ? '#4B5563' : '#1F2937';

            const runOptions = {
              continued: !isLast,
              underline: Boolean(run.underline || safeLink),
            };

            if (safeLink) {
              runOptions.link = safeLink;
            }

            const cleanText = sanitizeText(run.text);
            doc
              .font(fontName)
              .fontSize(fontSize)
              .fillColor(color)
              .text(cleanText, runOptions);
          }
        }
      }

      function renderBlock(block, context = {}) {
        const { listDepth = 0, inBlockquote = false, leftIndent = 0 } = context;

        switch (block.type) {
          case 'heading': {
            const config = HEADING_CONFIGS[block.level] || HEADING_CONFIGS[1];
            checkPageBreak(config.fontSize + config.spaceBefore + config.spaceAfter + 20);

            doc.moveDown(config.spaceBefore / 12);
            const content = block.content || [];

            if (content.length === 0) {
              doc
                .font('Helvetica-Bold')
                .fontSize(config.fontSize)
                .fillColor('#111827')
                .text('', { lineGap: config.lineGap });
            } else {
              for (let i = 0; i < content.length; i++) {
                const run = content[i];
                const isLast = i === content.length - 1;
                const fontName = run.italic ? 'Helvetica-BoldOblique' : 'Helvetica-Bold';
                const cleanText = sanitizeText(run.text);
                const safeLink = run.link && isSafeUrl(run.link) ? run.link : null;

                doc
                  .font(fontName)
                  .fontSize(config.fontSize)
                  .fillColor('#111827')
                  .text(cleanText, {
                    continued: !isLast,
                    lineGap: config.lineGap,
                    underline: Boolean(run.underline || safeLink),
                    link: safeLink,
                  });
              }
            }
            doc.moveDown(config.spaceAfter / 12);
            break;
          }

          case 'paragraph': {
            checkPageBreak(20);
            const indentX = margin + leftIndent;

            if (leftIndent > 0) {
              doc.x = indentX;
            }

            renderInlines(block.content, { defaultFontSize: 11, isBlockquote: inBlockquote });
            doc.moveDown(0.5);

            if (leftIndent > 0) {
              doc.x = margin;
            }
            break;
          }

          case 'list': {
            const items = block.items || [];
            const isOrdered = block.ordered;
            const startNum = block.start || 1;
            const markerIndent = leftIndent + listDepth * 18;
            const contentIndent = markerIndent + 18;

            items.forEach((item, index) => {
              checkPageBreak(25);
              const marker = isOrdered
                ? `${startNum + index}.`
                : BULLET_MARKERS[Math.min(listDepth, BULLET_MARKERS.length - 1)];

              // Draw list item marker
              const savedY = doc.y;
              doc
                .font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#374151')
                .text(marker, margin + markerIndent, savedY, { width: 16, align: 'right' });

              // Draw list item blocks
              doc.y = savedY;
              doc.x = margin + contentIndent;

              const itemBlocks = item.blocks || [];
              itemBlocks.forEach((subBlock) => {
                renderBlock(subBlock, {
                  listDepth: listDepth + 1,
                  inBlockquote,
                  leftIndent: contentIndent,
                });
              });

              doc.x = margin;
            });
            break;
          }

          case 'blockquote': {
            checkPageBreak(30);
            const bqIndent = leftIndent + 16;
            const startY = doc.y;

            // Render sub-blocks inside blockquote
            const bqBlocks = block.blocks || [];
            bqBlocks.forEach((subBlock) => {
              renderBlock(subBlock, {
                listDepth,
                inBlockquote: true,
                leftIndent: bqIndent,
              });
            });

            const endY = doc.y;
            const bqHeight = Math.max(endY - startY, 15);

            // Draw vertical accent bar on the left
            doc
              .rect(margin + leftIndent + 4, startY, 3, bqHeight)
              .fill('#3B82F6');

            doc.x = margin;
            break;
          }

          case 'codeBlock': {
            const codeText = sanitizeText(block.text || '');
            const padding = 8;
            const boxWidth = printableWidth - leftIndent;

            doc.font('Courier').fontSize(9.5);
            const textHeight = doc.heightOfString(codeText || ' ', { width: boxWidth - padding * 2 });
            const boxHeight = textHeight + padding * 2;

            checkPageBreak(Math.min(boxHeight, 100));

            const startX = margin + leftIndent;
            const startY = doc.y;

            // Draw background rectangle
            doc
              .rect(startX, startY, boxWidth, boxHeight)
              .fill('#F3F4F6');

            // Render code text inside box
            doc
              .font('Courier')
              .fontSize(9.5)
              .fillColor('#1F2937')
              .text(codeText, startX + padding, startY + padding, {
                width: boxWidth - padding * 2,
                lineBreak: true,
              });

            doc.y = startY + boxHeight + 8;
            doc.x = margin;
            break;
          }

          default:
            break;
        }
      }

      // Render document blocks
      const blocks = irDoc.blocks || [];
      if (blocks.length === 0) {
        // Blank document - output valid single page
        doc.font('Helvetica').fontSize(11).text('', margin, margin);
      } else {
        blocks.forEach((block) => renderBlock(block));
      }

      // Add Footer & Page Numbers across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#9CA3AF')
          .text(
            `Page ${i + 1} of ${range.count}`,
            margin,
            pageHeight - 40,
            { align: 'center', width: printableWidth, lineBreak: false }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default generatePDF;
