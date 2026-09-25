import request from 'supertest';
import app from '../src/app.js';
import { JSDOM } from 'jsdom';
import { jest } from '@jest/globals';
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeUrl,
  isSafeUrl,
  sanitizeAST,
} from '../src/services/sanitizer.js';
import validateAST from '../src/utils/astValidator.js';
import transformAST from '../src/services/astTransformer.js';
import generatePDF from '../src/services/pdfGenerator.js';
import { PDFParse } from 'pdf-parse';
import maliciousASTFixture from './fixtures/malicious-ast.json';
import sampleASTFixture from './fixtures/sample-ast.json';

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a',
]);

const ALLOWED_ATTR = new Set(['href', 'rel']);

describe('SyncDoc Week 4 Security Hardening Suite', () => {
  // Group A: HTML Sanitizer Unit Tests
  describe('Group A: HTML Sanitizer Unit Tests', () => {
    test('A1. <script>alert(1)</script> removed including content', () => {
      const output = sanitizeHTML('<script>alert(1)</script>');
      expect(output).not.toContain('<script');
      expect(output).not.toContain('alert(1)');
      expect(output).toBe('');
    });

    test('A2. <img src=x onerror=alert(1)> removed entirely', () => {
      const output = sanitizeHTML('<img src=x onerror=alert(1)>');
      expect(output).not.toContain('<img');
      expect(output).not.toContain('onerror');
      expect(output).toBe('');
    });

    test('A3. <a href="javascript:alert(1)">Click</a> strips javascript: URL while keeping text', () => {
      const output = sanitizeHTML('<a href="javascript:alert(1)">Click</a>');
      expect(output).not.toContain('javascript:');
      expect(output).toContain('Click');
    });

    test('A4. <div onclick="alert(1)">Hello</div> removes onclick, keeps content unwrapped', () => {
      const output = sanitizeHTML('<div onclick="alert(1)">Hello</div>');
      expect(output).not.toContain('onclick');
      expect(output).toContain('Hello');
      expect(output).not.toContain('<div');
    });

    test('A5. <iframe src="https://evil.example"></iframe> removed', () => {
      const output = sanitizeHTML('<iframe src="https://evil.example"></iframe>');
      expect(output).not.toContain('<iframe');
      expect(output).toBe('');
    });

    test('A6. <svg onload="alert(1)"></svg> removed', () => {
      const output = sanitizeHTML('<svg onload="alert(1)"></svg>');
      expect(output).not.toContain('<svg');
      expect(output).not.toContain('onload');
      expect(output).toBe('');
    });

    test('A7. <p>Hello <strong>world</strong></p> unchanged', () => {
      const output = sanitizeHTML('<p>Hello <strong>world</strong></p>');
      expect(output).toBe('<p>Hello <strong>world</strong></p>');
    });

    test('A8. <a href="https://example.com">Example</a> kept with rel="noopener noreferrer"', () => {
      const output = sanitizeHTML('<a href="https://example.com">Example</a>');
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('rel="noopener noreferrer"');
    });

    test('A9. Spec example: <p>Hello <script>alert(1)</script></p> -> <p>Hello </p>', () => {
      const output = sanitizeHTML('<p>Hello <script>alert(1)</script></p>');
      expect(output).toBe('<p>Hello </p>');
    });
  });

  // Group B: XSS Corpus (25+ payloads)
  describe('Group B: XSS Corpus (25+ payloads)', () => {
    const xssPayloads = [
      'JaVaScRiPt:alert(1)',
      'java&#x09;script:alert(1)',
      '  javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      '<svg><script>alert(1)</script></svg>',
      '<math><mtext><option><form><select><textarea><script>alert(1)</script></textarea></select></form></option></mtext></math>',
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
      '<style>@import "http://evil.example/xss.css";</style>',
      '<img src=x onerror=alert(1)//',
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '<form action="http://evil.example"><input type="submit"></form>',
      '<base href="http://evil.example/">',
      '<meta http-equiv="refresh" content="0;url=http://evil.example/">',
      '<object data="http://evil.example/xss.swf"></object>',
      '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      '<a href="//evil.example">Relative Link</a>',
      '<embed src="http://evil.example/xss.swf">',
      '<a href="blob:http://example.com/1234">Blob Link</a>',
      '<a href="about:blank">About Link</a>',
      '<img src="x" onload="alert(1)" onerror="alert(2)">',
      '<table background="javascript:alert(1)">',
      '<b onmouseover="alert(1)">hover me</b>',
      '<a href="https://example.com/path?a=1&b=2">Valid Link</a>',
    ];

    xssPayloads.forEach((payload, index) => {
      test(`XSS Corpus Payload #${index + 1}: ${payload.slice(0, 30)}...`, () => {
        const sanitized = sanitizeHTML(payload);

        // Idempotence check
        const secondPass = sanitizeHTML(sanitized);
        expect(secondPass).toBe(sanitized);

        // Parse resulting HTML with JSDOM and check all elements and attributes
        const dom = new JSDOM(`<!DOCTYPE html><body>${sanitized}</body>`);
        const body = dom.window.document.body;
        const allElements = body.querySelectorAll('*');

        allElements.forEach((el) => {
          const tagName = el.tagName.toLowerCase();
          expect(ALLOWED_TAGS.has(tagName)).toBe(true);

          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            expect(ALLOWED_ATTR.has(attr.name.toLowerCase())).toBe(true);
            expect(attr.name.toLowerCase().startsWith('on')).toBe(false);

            if (attr.name.toLowerCase() === 'href') {
              expect(isSafeUrl(attr.value)).toBe(true);
            }
          }
        });
      });
    });
  });

  // Group C: sanitizeAST Unit Tests
  describe('Group C: sanitizeAST Unit Tests', () => {
    test('C1. Nested malicious AST is cleaned recursively', () => {
      const inputAST = {
        type: 'document',
        children: [
          {
            type: 'blockquote',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Text with <script>alert("nested")</script> payload',
                  },
                ],
              },
            ],
          },
        ],
      };

      const clean = sanitizeAST(inputAST);
      expect(clean.children[0].children[0].children[0].text).toBe('Text with  payload');
      expect(validateAST(clean).valid).toBe(true);
    });

    test('C2. Unsafe link is unwrapped (href dropped, visible text retained)', () => {
      const inputAST = {
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

      const clean = sanitizeAST(inputAST);
      expect(clean.children[0].children).toHaveLength(1);
      expect(clean.children[0].children[0]).toEqual({
        type: 'text',
        text: 'click me',
      });
    });

    test('C3. Safe link is normalized and retained', () => {
      const inputAST = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                href: 'HTTPS://EXAMPLE.COM/PATH',
                children: [{ type: 'text', text: 'Safe Link' }],
              },
            ],
          },
        ],
      };

      const clean = sanitizeAST(inputAST);
      expect(clean.children[0].children[0].type).toBe('link');
      expect(clean.children[0].children[0].href).toBe('https://example.com/PATH');
    });

    test('C4. codeBlock keeps <div> content literally', () => {
      const codeStr = 'const html = "<div>Hello</div>";';
      const inputAST = {
        type: 'document',
        children: [
          {
            type: 'codeBlock',
            language: 'typescript',
            children: [{ type: 'text', text: codeStr }],
          },
        ],
      };

      const clean = sanitizeAST(inputAST);
      expect(clean.children[0].children[0].text).toBe(codeStr);
    });

    test('C5. Prose text strips markup while AT&T and &amp; typed literally remain unaltered', () => {
      const inputAST = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'AT&T and &amp; remain' },
              { type: 'text', text: 'Stripped <b>bold</b> text' },
            ],
          },
        ],
      };

      const clean = sanitizeAST(inputAST);
      expect(clean.children[0].children[0].text).toBe('AT&T and &amp; remain');
      expect(clean.children[0].children[1].text).toBe('Stripped bold text');
    });

    test('C6. Invalid codeBlock language is omitted', () => {
      const inputAST = {
        type: 'document',
        children: [
          {
            type: 'codeBlock',
            language: 'invalid;script<bad>',
            children: [{ type: 'text', text: 'const a = 1;' }],
          },
        ],
      };

      const clean = sanitizeAST(inputAST);
      expect(clean.children[0].language).toBeUndefined();
    });

    test('C7. Input AST object is deep-frozen / never mutated', () => {
      const inputAST = Object.freeze({
        type: 'document',
        children: Object.freeze([
          Object.freeze({
            type: 'paragraph',
            children: Object.freeze([
              Object.freeze({ type: 'text', text: 'Text <script>x</script>' }),
            ]),
          }),
        ]),
      });

      expect(() => sanitizeAST(inputAST)).not.toThrow();
      expect(inputAST.children[0].children[0].text).toBe('Text <script>x</script>');
    });

    test('C8. Prototype-pollution payloads do not pollute Object prototype', () => {
      const pollutedAST = JSON.parse('{"type":"document","__proto__":{"polluted":true},"children":[]}');
      const clean = sanitizeAST(pollutedAST);
      expect(({}).polluted).toBeUndefined();
      expect(clean).toBeNull();
    });
  });

  // Group D: Security Limits Tests
  describe('Group D: Security Limits Tests', () => {
    test('D1. Excessive depth throws LimitError / 400', () => {
      let curr = { type: 'text', text: 'deep' };
      for (let i = 0; i < 110; i++) {
        curr = { type: 'bold', children: [curr] };
      }
      const deepAST = {
        type: 'document',
        children: [{ type: 'paragraph', children: [curr] }],
      };

      expect(() => sanitizeAST(deepAST)).toThrow();
    });

    test('D2. Text node length > MAX_TEXT_LENGTH throws LimitError', () => {
      const hugeText = 'A'.repeat(100005);
      const inputAST = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: hugeText }],
          },
        ],
      };

      expect(() => sanitizeAST(inputAST)).toThrow();
    });

    test('D3. Non-JSON request on POST /api/export/pdf returns 415 Unsupported Media Type', async () => {
      const res = await request(app)
        .post('/api/export/pdf')
        .set('Content-Type', 'text/plain')
        .send('some raw text');

      expect(res.status).toBe(415);
      expect(res.body.error).toBe('Unsupported Media Type');
    });
  });

  // Group E: /api/security/sanitize Endpoint Tests
  describe('Group E: POST /api/security/sanitize Endpoint Tests', () => {
    test('E1. Spec example: returns 200 { success: true, sanitized: "<p>Hello </p>" }', async () => {
      const res = await request(app)
        .post('/api/security/sanitize')
        .send({ html: '<p>Hello <script>alert(1)</script></p>' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        sanitized: '<p>Hello </p>',
      });
    });

    test('E2. Missing or non-string html returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/security/sanitize')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid request');
    });

    test('E3. Oversize html > MAX_HTML_LENGTH returns 400 Bad Request', async () => {
      const hugeHTML = '<p>' + 'A'.repeat(200005) + '</p>';
      const res = await request(app)
        .post('/api/security/sanitize')
        .send({ html: hugeHTML });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Group F: PDF Security Integration Tests
  describe('Group F: PDF Security Integration Tests', () => {
    test('F1. Malicious AST through POST /api/export/pdf returns 200 and valid PDF with XSS neutralized', async () => {
      const res = await request(app)
        .post('/api/export/pdf')
        .send(maliciousASTFixture);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');

      const buffer = res.body;
      const pdfText = buffer.toString('ascii');

      // Verify raw PDF bytes have NO malicious executable PDF action keywords
      expect(pdfText).not.toContain('/JavaScript');
      expect(pdfText).not.toContain('/JS');
      expect(pdfText).not.toContain('/Launch');
      expect(pdfText).not.toContain('/OpenAction');
      expect(pdfText).not.toContain('/EmbeddedFile');

      // Extract PDF text content via pdf-parse
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();

      const text = parsed.text;
      expect(text).not.toContain('alert(');
      expect(text).not.toContain('<script');
      expect(text).not.toContain('<iframe');
      expect(text).not.toContain('<svg');
      expect(text).toContain('Document with');
      expect(text).toContain('Unsafe Link');
      expect(text).toContain('const t = \'<div>code snippet</div>\';');
    });

    test('F2. Pipeline execution order: validate -> sanitize -> transform -> generate', async () => {
      const astWithUnsafeLink = {
        type: 'document',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                href: 'javascript:alert(1)',
                children: [{ type: 'text', text: 'Unwrapped Link Text' }],
              },
            ],
          },
        ],
      };

      const res = await request(app)
        .post('/api/export/pdf')
        .send({ ast: astWithUnsafeLink });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');

      // Verify PDF output contains the text but NO /JavaScript or /URI annotation
      const pdfText = res.body.toString('ascii');
      expect(pdfText).not.toContain('/JavaScript');
      expect(pdfText).not.toContain('/URI');

      const parser = new PDFParse({ data: res.body });
      const parsed = await parser.getText();
      await parser.destroy();
      expect(parsed.text).toContain('Unwrapped Link Text');
    });
  });

  // Group H: Middleware & Security Headers
  describe('Group H: Middleware & Security Headers', () => {
    test('H1. Response includes X-Request-Id, X-Content-Type-Options: nosniff, and omits X-Powered-By', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });
});
