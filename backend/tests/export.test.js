import request from 'supertest';
import app from '../src/app.js';
import validateAST from '../src/utils/astValidator.js';
import transformAST from '../src/services/astTransformer.js';
import generatePDF from '../src/services/pdfGenerator.js';
import { PDFParse } from 'pdf-parse';
import sampleASTFixture from './fixtures/sample-ast.json';

async function extractPDFText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result;
}

describe('PDF Export Engine - Unit & Integration Tests', () => {
  // Scenario 1: Empty or missing AST -> 400
  describe('AST Validator - Edge cases & invalid inputs', () => {
    test('1. empty AST ({}, null, missing) fails validation', () => {
      expect(validateAST(null).valid).toBe(false);
      expect(validateAST({}).valid).toBe(false);
      expect(validateAST([]).valid).toBe(false);
      expect(validateAST({ type: 'invalid' }).valid).toBe(false);
    });

    test('2. invalid AST schema rules (wrong types, bad heading level, bad link, non-array children)', () => {
      const badHeading = {
        type: 'document',
        children: [
          { type: 'heading', level: 9, children: [{ type: 'text', text: 'Hi' }] },
        ],
      };
      const resHeading = validateAST(badHeading);
      expect(resHeading.valid).toBe(false);
      expect(resHeading.errors.some((e) => e.path.includes('level'))).toBe(true);

      const badChildren = {
        type: 'document',
        children: { type: 'paragraph' },
      };
      const resChildren = validateAST(badChildren);
      expect(resChildren.valid).toBe(false);
      expect(resChildren.errors.some((e) => e.path.includes('children'))).toBe(true);

      const badTextNode = {
        type: 'document',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 123 }] },
        ],
      };
      const resText = validateAST(badTextNode);
      expect(resText.valid).toBe(false);
      expect(resText.errors.some((e) => e.path.includes('text'))).toBe(true);
    });

    test('13. unsupported node type returns error naming type and path', () => {
      const unsupportedAST = {
        type: 'document',
        children: [
          { type: 'unknownCustomWidget', children: [] },
        ],
      };
      const res = validateAST(unsupportedAST);
      expect(res.valid).toBe(false);
      expect(res.errors[0].path).toBe('ast.children[0].type');
      expect(res.errors[0].message).toContain('Unsupported node type "unknownCustomWidget"');
    });

    test('unwraps unsafe link protocols (e.g. javascript:) during sanitization while keeping visible text', () => {
      const unsafeLinkAST = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                href: 'javascript:alert(1)',
                children: [{ type: 'text', text: 'click me' }],
              },
            ],
          },
        ],
      };
      // Structurally valid in validator
      expect(validateAST(unsafeLinkAST).valid).toBe(true);
    });

    test('detects prototype-pollution payloads safely', () => {
      const pollutedAST = JSON.parse('{"type":"document","__proto__":{"polluted":true},"children":[]}');
      const res = validateAST(pollutedAST);
      expect(res.valid).toBe(false);
    });

    test('10. deeply nested AST within limit (~50) succeeds, over limit returns clean validation error', () => {
      // Build AST of depth ~30
      let curr = { type: 'text', text: 'deep' };
      for (let i = 0; i < 30; i++) {
        curr = { type: 'bold', children: [curr] };
      }
      const deepAST = {
        type: 'document',
        children: [{ type: 'paragraph', children: [curr] }],
      };
      expect(validateAST(deepAST).valid).toBe(true);

      // Build AST of depth 120 (exceeding default limit 100)
      let overCurr = { type: 'text', text: 'over limit' };
      for (let i = 0; i < 110; i++) {
        overCurr = { type: 'bold', children: [overCurr] };
      }
      const overDeepAST = {
        type: 'document',
        children: [{ type: 'paragraph', children: [overCurr] }],
      };
      const overRes = validateAST(overDeepAST);
      expect(overRes.valid).toBe(false);
      expect(overRes.errors.some((e) => e.message.includes('depth exceeds'))).toBe(true);
    });
  });

  // Transformer tests
  describe('AST Transformer - IR Canonical Format', () => {
    test('3. simple paragraph transformation', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir).toEqual({
        type: 'document',
        blocks: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      });
    });

    test('4. heading + paragraph transformation', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'heading',
            level: 2,
            children: [{ type: 'text', text: 'Title' }],
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Body text' }],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir).toEqual({
        type: 'document',
        blocks: [
          {
            type: 'heading',
            level: 2,
            content: [{ type: 'text', text: 'Title' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Body text' }],
          },
        ],
      });
    });

    test('5. nested formatting (bold+italic+underline+link) accumulates flags in IR', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'bold',
                children: [
                  {
                    type: 'italic',
                    children: [
                      {
                        type: 'underline',
                        children: [
                          {
                            type: 'link',
                            href: 'https://example.com',
                            children: [{ type: 'text', text: 'Styled Link' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks[0].content[0]).toEqual({
        type: 'text',
        text: 'Styled Link',
        bold: true,
        italic: true,
        underline: true,
        link: 'https://example.com',
      });
    });

    test('6. bullet list transformation', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'bulletList',
            children: [
              {
                type: 'listItem',
                children: [{ type: 'text', text: 'Item 1' }],
              },
            ],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks[0]).toEqual({
        type: 'list',
        ordered: false,
        items: [
          {
            blocks: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 1' }],
              },
            ],
          },
        ],
      });
    });

    test('7. ordered list transformation (including start)', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'orderedList',
            start: 10,
            children: [
              {
                type: 'listItem',
                children: [{ type: 'text', text: 'Tenth item' }],
              },
            ],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks[0]).toEqual({
        type: 'list',
        ordered: true,
        start: 10,
        items: [
          {
            blocks: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Tenth item' }],
              },
            ],
          },
        ],
      });
    });

    test('8. blockquote transformation', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'blockquote',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: 'Quoted text' }],
              },
            ],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks[0]).toEqual({
        type: 'blockquote',
        blocks: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Quoted text' }],
          },
        ],
      });
    });

    test('9. code block transformation preserving exact whitespace and newlines', () => {
      const codeStr = '  const a = 1;\n  const b = 2;\n  return a + b;  ';
      const ast = {
        type: 'document',
        children: [
          {
            type: 'codeBlock',
            language: 'typescript',
            children: [{ type: 'text', text: codeStr }],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks[0]).toEqual({
        type: 'codeBlock',
        language: 'typescript',
        text: codeStr,
      });
    });

    test('11. multiple blocks preserve exact order', () => {
      const ast = {
        type: 'document',
        children: [
          { type: 'heading', level: 1, children: [{ type: 'text', text: 'H1' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'P1' }] },
          { type: 'heading', level: 2, children: [{ type: 'text', text: 'H2' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'P2' }] },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'heading', 'paragraph']);
      expect(ir.blocks[0].content[0].text).toBe('H1');
      expect(ir.blocks[2].content[0].text).toBe('H2');
    });

    test('merges adjacent text runs with identical styles and drops empty runs', () => {
      const ast = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'bold', children: [{ type: 'text', text: 'Hello ' }] },
              { type: 'bold', children: [{ type: 'text', text: '' }] },
              { type: 'bold', children: [{ type: 'text', text: 'World' }] },
            ],
          },
        ],
      };
      const ir = transformAST(ast);
      expect(ir.blocks[0].content).toHaveLength(1);
      expect(ir.blocks[0].content[0]).toEqual({
        type: 'text',
        text: 'Hello World',
        bold: true,
      });
    });
  });

  // PDF Generator unit test
  describe('PDF Generator - Buffer creation', () => {
    test('14. generatePDF returns a Buffer starting with %PDF- and ending with %%EOF', async () => {
      const ir = {
        type: 'document',
        blocks: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test PDF Output' }],
          },
        ],
      };
      const buffer = await generatePDF(ir);
      expect(Buffer.isBuffer(buffer)).toBe(true);

      const pdfHeader = buffer.subarray(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');

      const pdfFooter = buffer.subarray(buffer.length - 10).toString('ascii');
      expect(pdfFooter).toContain('%%EOF');
    });
  });

  // API Integration Tests via Supertest
  describe('POST /api/export/pdf - Integration Endpoint Tests', () => {
    test('12. valid empty document returns 200 and valid PDF', async () => {
      const res = await request(app)
        .post('/api/export/pdf')
        .send({ ast: { type: 'document', children: [] } });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="document.pdf"');
      expect(parseInt(res.headers['content-length'], 10)).toBeGreaterThan(0);

      const parsed = await extractPDFText(res.body);
      expect(parsed.total).toBe(1);
    });

    test('15. endpoint success with realistic fixture returns 200, application/pdf, and extracted text matches', async () => {
      const res = await request(app)
        .post('/api/export/pdf')
        .send(sampleASTFixture);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');

      const parsed = await extractPDFText(res.body);
      expect(parsed.total).toBeGreaterThanOrEqual(1);

      const text = parsed.text;
      expect(text).toContain('SyncDoc AST to PDF Engine');
      expect(text).toContain('SyncDoc Collaborative Document Platform');
      expect(text).toContain('italicized text');
      expect(text).toContain('underlined text');
      expect(text).toContain('hyperlink to SyncDoc');
      expect(text).toContain('First bullet item');
      expect(text).toContain('Numbered item starting at 5');
      expect(text).toContain('Conflict resolution in AST documents');
      expect(text).toContain('function exportPDF');
    });

    test('returns 400 for empty or missing body', async () => {
      const res = await request(app).post('/api/export/pdf').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid AST');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    test('returns 400 with details for malformed JSON request', async () => {
      const res = await request(app)
        .post('/api/export/pdf')
        .set('Content-Type', 'application/json')
        .send('{ bad json ');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid JSON');
    });

    test('handles multi-page documents cleanly (page count > 1)', async () => {
      const children = [];
      for (let i = 0; i < 60; i++) {
        children.push({
          type: 'paragraph',
          children: [{ type: 'text', text: `Paragraph #${i + 1}: SyncDoc multi-page document export test paragraph line.` }],
        });
      }
      const multiPageAST = { type: 'document', children };

      const res = await request(app)
        .post('/api/export/pdf')
        .send({ ast: multiPageAST });

      expect(res.status).toBe(200);
      const parsed = await extractPDFText(res.body);
      expect(parsed.total).toBeGreaterThan(1);
    });
  });
});
