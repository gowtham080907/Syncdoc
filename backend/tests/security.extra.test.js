import request from 'supertest';
import app from '../src/app.js';
import { jest } from '@jest/globals';
import { sanitizeHTML, sanitizeAST, __setSanitizeASTOverride } from '../src/services/sanitizer.js';
import validateAST from '../src/utils/astValidator.js';
import { MAX_HTML_LENGTH } from '../src/config/securityLimits.js';
import { LimitError } from '../src/utils/errors.js';
import { PDFParse } from 'pdf-parse';
import sampleASTFixture from './fixtures/sample-ast.json';
import config from '../src/config/env.js';

async function extractPDFText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return typeof result === 'string' ? result : (result && result.text) || '';
}

describe('SyncDoc Extra Security Hardening Tests (Task 2)', () => {
  let initialNodeEnv;
  let initialEnableSanitize;

  beforeEach(() => {
    initialNodeEnv = process.env.NODE_ENV;
    initialEnableSanitize = process.env.ENABLE_SANITIZE_ENDPOINT;
  });

  afterEach(() => {
    if (initialNodeEnv !== undefined) {
      process.env.NODE_ENV = initialNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    if (initialEnableSanitize !== undefined) {
      process.env.ENABLE_SANITIZE_ENDPOINT = initialEnableSanitize;
    } else {
      delete process.env.ENABLE_SANITIZE_ENDPOINT;
    }
    delete process.env.MAX_AST_NODES;
    delete process.env.MAX_SANITIZE_CALLS;
    __setSanitizeASTOverride(null);
    jest.restoreAllMocks();
  });

  // 1. HTTP deep AST
  test('1. HTTP deep AST: 1000-level nested bold AST returns 400 naming depth limit, server stays healthy', async () => {
    let root = { type: 'document', children: [] };
    let curr = root;
    for (let i = 0; i < 1000; i++) {
      const next = i === 0 ? { type: 'paragraph', children: [] } : { type: 'bold', children: [] };
      curr.children.push(next);
      curr = next;
    }
    curr.children.push({ type: 'text', text: 'deep content' });

    const compactJSON = JSON.stringify({ ast: root });

    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send(compactJSON);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid AST');
    expect(res.body.details).toBeDefined();
    expect(Array.isArray(res.body.details)).toBe(true);

    const detailsStr = JSON.stringify(res.body.details);
    expect(detailsStr).toMatch(/depth/i);
    expect(detailsStr).toMatch(/100/);

    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.success).toBe(true);
  });

  // 2. Node-count limit
  test('2. Node-count limit: unit test with lowered limit + HTTP test (400 naming limit)', async () => {
    // Unit level test with lowered limit
    process.env.MAX_AST_NODES = '5';
    const smallAst = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: '1' },
            { type: 'text', text: '2' },
            { type: 'text', text: '3' },
            { type: 'text', text: '4' },
            { type: 'text', text: '5' },
          ],
        },
      ],
    };
    const unitResult = validateAST(smallAst);
    expect(unitResult.valid).toBe(false);
    expect(unitResult.errors[0].message).toContain('maximum allowed limit of 5');
    delete process.env.MAX_AST_NODES;

    // HTTP test exceeding standard 50,000 node limit (~1.35MB payload)
    const children = [];
    for (let i = 0; i < 50001; i++) {
      children.push({ type: 'text', text: 'a' });
    }
    const largeAST = { type: 'document', children: [{ type: 'paragraph', children }] };

    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send({ ast: largeAST });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid AST');
    const detailsStr = JSON.stringify(res.body.details);
    expect(detailsStr).toMatch(/50000/);
  });

  // 3. MAX_HTML_LENGTH
  test('3. MAX_HTML_LENGTH: sanitizeHTML throws LimitError unit level + HTTP 400', async () => {
    const oversizedHTML = 'a'.repeat(MAX_HTML_LENGTH + 1);

    // Unit test assertion
    expect(() => sanitizeHTML(oversizedHTML)).toThrow(LimitError);
    expect(() => sanitizeHTML(oversizedHTML)).toThrow(/maximum allowed limit/);

    // HTTP test assertion
    const res = await request(app)
      .post('/api/security/sanitize')
      .set('Content-Type', 'application/json')
      .send({ html: oversizedHTML });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const detailsStr = JSON.stringify(res.body.details);
    expect(detailsStr).toMatch(/maximum allowed limit/);
  });

  // 4. Sanitize-call budget
  test('4. Sanitize-call budget: AST with many markup text nodes exceeds MAX_SANITIZE_CALLS', async () => {
    process.env.MAX_SANITIZE_CALLS = '5';

    const markupChildren = [];
    for (let i = 0; i < 10; i++) {
      markupChildren.push({ type: 'text', text: `<b>item ${i}</b>` });
    }
    const testAst = { type: 'document', children: [{ type: 'paragraph', children: markupChildren }] };

    // Unit test assertion
    expect(() => sanitizeAST(testAst)).toThrow(LimitError);
    expect(() => sanitizeAST(testAst)).toThrow(/DOMPurify invocation limit \(5\) exceeded/);

    // HTTP test assertion
    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send({ ast: testAst });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).toMatch(/DOMPurify invocation limit \(5\) exceeded/);

    delete process.env.MAX_SANITIZE_CALLS;
  });

  // 5. 413
  test('5. 413: body larger than MAX_REQUEST_BODY returns 413 JSON error without stack trace', async () => {
    const hugePadding = 'x'.repeat(2.5 * 1024 * 1024); // 2.5MB payload
    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send(`{"ast": {"type":"document","padding":"${hugePadding}"}}`);

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Payload Too Large');
    expect(res.body.message).toBe('Request body exceeds maximum size limit');
    expect(res.body.stack).toBeUndefined();
  });

  // 6. 400 malformed JSON
  test('6. 400 malformed JSON on /api/export/pdf and /api/security/sanitize returns 400 JSON without stack', async () => {
    const resPdf = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(resPdf.status).toBe(400);
    expect(resPdf.body.success).toBe(false);
    expect(resPdf.body.error).toBe('Invalid JSON');
    expect(resPdf.body.stack).toBeUndefined();

    const resSanitize = await request(app)
      .post('/api/security/sanitize')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(resSanitize.status).toBe(400);
    expect(resSanitize.body.success).toBe(false);
    expect(resSanitize.body.error).toBe('Invalid JSON');
    expect(resSanitize.body.stack).toBeUndefined();
  });

  // 7. Production gating
  test('7. Production gating: NODE_ENV=production returns 404 when disabled, 200 when enabled', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_SANITIZE_ENDPOINT;

    const res404 = await request(app)
      .post('/api/security/sanitize')
      .set('Content-Type', 'application/json')
      .send({ html: '<p>test</p>' });

    expect(res404.status).toBe(404);
    expect(res404.body.success).toBe(false);
    expect(res404.body.message).toMatch(/disabled in production/i);

    process.env.ENABLE_SANITIZE_ENDPOINT = 'true';

    const res200 = await request(app)
      .post('/api/security/sanitize')
      .set('Content-Type', 'application/json')
      .send({ html: '<p>test</p>' });

    expect(res200.status).toBe(200);
    expect(res200.body.success).toBe(true);
    expect(res200.body.sanitized).toBe('<p>test</p>');
  });

  // 8. Raw PDF scan
  test('8. Raw PDF scan: malicious AST exported to PDF strips dangerous URIs, retains safe URI', async () => {
    const maliciousAST = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: '<script>alert("xss")</script>' },
            {
              type: 'link',
              href: 'javascript:alert(1)',
              children: [{ type: 'text', text: 'Unsafe Link 1' }],
            },
            {
              type: 'link',
              href: 'data:text/html,<script>alert(1)</script>',
              children: [{ type: 'text', text: 'Unsafe Link 2' }],
            },
            {
              type: 'link',
              href: 'https://example.com/safe',
              children: [{ type: 'text', text: 'Safe HTTPS Link' }],
            },
            {
              type: 'link',
              href: 'mailto:user@example.com',
              children: [{ type: 'text', text: 'Safe Mailto Link' }],
            },
          ],
        },
      ],
    };

    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send({ ast: maliciousAST });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');

    const pdfText = res.body.toString('latin1');
    const forbiddenTokens = [
      '/JavaScript',
      '/JS',
      '/Launch',
      '/OpenAction',
      '/EmbeddedFile',
      'javascript:',
      'data:text',
    ];
    for (const token of forbiddenTokens) {
      expect(pdfText).not.toContain(token);
    }

    const uriMatches = [...pdfText.matchAll(/\/URI\s*\(([^)]+)\)/g)].map((m) => m[1]);
    expect(uriMatches.length).toBeGreaterThan(0);
    for (const uri of uriMatches) {
      expect(
        uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('mailto:')
      ).toBe(true);
    }
    expect(pdfText).toContain('https://example.com/safe');
  });

  // 9. Week 3 regression with injected payloads
  test('9. Week 3 regression with injected payloads in sample-ast', async () => {
    const astRoot = sampleASTFixture.ast ? sampleASTFixture.ast : sampleASTFixture;
    const injectedAST = JSON.parse(JSON.stringify(astRoot));

    // Inject payloads into cloned AST
    injectedAST.children[1].children[0].text += ' <script>alert(1)</script>';
    injectedAST.children[1].children.push({
      type: 'link',
      href: 'javascript:alert(1)',
      children: [{ type: 'text', text: 'Bad Link' }],
    });
    // bulletList (index 4) -> listItem -> text
    if (injectedAST.children[4] && injectedAST.children[4].children) {
      injectedAST.children[4].children[0].children[0].text += ' <img src=x onerror=alert(1)>';
    }
    // blockquote (index 7) -> paragraph -> text
    if (injectedAST.children[7] && injectedAST.children[7].children) {
      injectedAST.children[7].children[0].children[0].text += ' <iframe>';
    }
    // codeBlock (index 8) -> text
    if (injectedAST.children[8] && injectedAST.children[8].children) {
      injectedAST.children[8].children[0].text = '<div onclick=alert(1)>const x = 1;</div>';
    }

    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send({ ast: injectedAST });

    expect(res.status).toBe(200);
    const pdfBuffer = res.body;
    const headerStr = pdfBuffer.slice(0, 8).toString('ascii');
    expect(headerStr).toMatch(/%PDF-/);
    const tailStr = pdfBuffer.slice(-100).toString('latin1');
    expect(tailStr).toMatch(/%%EOF/);

    const pdfParsedText = await extractPDFText(pdfBuffer);
    expect(pdfParsedText).toContain('SyncDoc AST to PDF Engine');
    expect(pdfParsedText).toContain('First bullet item');
    expect(pdfParsedText).toContain('const x = 1;');

    expect(pdfParsedText).not.toContain('<script');
    expect(pdfParsedText).not.toContain('onerror');
    expect(pdfParsedText).not.toContain('javascript:');
  });

  // 10. CORS unchanged
  test('10. CORS unchanged: Origin header and OPTIONS preflight return correct CORS and non-conflicting CORP', async () => {
    const allowedOrigin = config.clientUrl; // http://localhost:5173

    // Preflight OPTIONS /api/export/pdf
    const preflightExport = await request(app)
      .options('/api/export/pdf')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'POST');

    expect(preflightExport.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(preflightExport.headers['cross-origin-resource-policy']).toBe('cross-origin');

    // Preflight OPTIONS /api/health
    const preflightHealth = await request(app)
      .options('/api/health')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET');

    expect(preflightHealth.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(preflightHealth.headers['cross-origin-resource-policy']).toBe('cross-origin');

    // Actual POST /api/export/pdf with Origin
    const postRes = await request(app)
      .post('/api/export/pdf')
      .set('Origin', allowedOrigin)
      .set('Content-Type', 'application/json')
      .send({ ast: { type: 'document', children: [] } });

    expect(postRes.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(postRes.headers['access-control-allow-credentials']).toBe('true');
    expect(postRes.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  // 11. Log leak test
  test('11. Log leak test: unique markers in payload never logged, security log line has non-null method and path', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    const MARKER_PAYLOAD = 'ZZ_MARKER_PAYLOAD';
    const MARKER_HREF = 'https://evil.example/ZZ_HREF';
    const MARKER_TEXT = 'ZZ_DOC_TEXT';

    // Send export request with markers
    await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send({
        ast: {
          type: 'document',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: `<script>${MARKER_PAYLOAD}</script>` },
                { type: 'text', text: MARKER_TEXT, link: MARKER_HREF },
              ],
            },
          ],
        },
      });

    // Send sanitize request with markers
    await request(app)
      .post('/api/security/sanitize')
      .set('Content-Type', 'application/json')
      .send({ html: `<p>${MARKER_TEXT} <script>${MARKER_PAYLOAD}</script></p>` });

    const allCalls = [
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errSpy.mock.calls,
      ...infoSpy.mock.calls,
    ].map((args) => args.join(' '));

    // Assert no output contains any marker
    for (const line of allCalls) {
      expect(line).not.toContain(MARKER_PAYLOAD);
      expect(line).not.toContain(MARKER_HREF);
      expect(line).not.toContain(MARKER_TEXT);
    }

    // Parse security log lines
    const jsonLines = allCalls.filter((line) => line.trim().startsWith('{'));
    expect(jsonLines.length).toBeGreaterThan(0);

    const securityEntries = [];
    const allowedFields = new Set([
      'timestamp',
      'level',
      'event',
      'requestId',
      'method',
      'path',
      'reason',
      'counts',
    ]);

    for (const rawLine of jsonLines) {
      let parsed;
      try {
        parsed = JSON.parse(rawLine);
      } catch (_e) {
        continue;
      }
      if (parsed.event && parsed.event.startsWith('security.')) {
        securityEntries.push(parsed);
        // Verify JSON fields only contain allowed schema
        for (const key of Object.keys(parsed)) {
          expect(allowedFields.has(key)).toBe(true);
        }
      }
    }

    expect(securityEntries.length).toBeGreaterThan(0);
    const validEvent = securityEntries.find((e) => e.method !== null && e.path !== null);
    expect(validEvent).toBeDefined();
    expect(validEvent.method).toBe('POST');
    expect(typeof validEvent.path).toBe('string');
    expect(validEvent.path.startsWith('/api/')).toBe(true);
  });

  // 12. Forced sanitizer failure
  test('12. Forced sanitizer failure: 500 in production without leaking error message or stack', async () => {
    process.env.NODE_ENV = 'production';
    const SECRET_MSG = 'C:\\secret\\path DB_PASSWORD=hunter2';

    __setSanitizeASTOverride(() => {
      const err = new Error(SECRET_MSG);
      err.name = 'SanitizationError';
      throw err;
    });

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/export/pdf')
      .set('Content-Type', 'application/json')
      .send({
        ast: {
          type: 'document',
          children: [
            { type: 'paragraph', children: [{ type: 'text', text: 'Test Content' }] },
          ],
        },
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(JSON.stringify(res.body)).not.toContain('stack');

    // Server must still answer /api/health afterward
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);

    // Confirm real error logged server-side without request content
    const errorLogs = errSpy.mock.calls.map((args) => args.join(' '));
    expect(errorLogs.some((msg) => msg.includes('DB_PASSWORD=hunter2'))).toBe(true);
    expect(errorLogs.every((msg) => !msg.includes('Test Content'))).toBe(true);
  });
});
