const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const puppeteer = require('puppeteer');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nodeToHtml(node) {
  if (!node || typeof node !== 'object') return '';

  const text = escapeHtml(node.text || '');

  switch (node.type) {
    case 'heading': {
      const level = Math.min(Math.max(Number(node.level) || 1, 1), 6);
      return `<h${level}>${text}</h${level}>`;
    }
    case 'codeBlock': {
      const lang = escapeHtml(node.language || 'text');
      return `<pre><code class="language-${lang}">${text}</code></pre>`;
    }
    case 'list': {
      let childHtml = '';
      if (Array.isArray(node.children) && node.children.length > 0) {
        childHtml = `<ul>${node.children.map(nodeToHtml).join('')}</ul>`;
      }
      return `<ul><li>${text}${childHtml}</li></ul>`;
    }
    case 'paragraph':
    default: {
      return `<p>${text}</p>`;
    }
  }
}

function astToHtml(root, docTitle = 'Untitled Document') {
  let bodyContent = '';
  if (root && Array.isArray(root.children)) {
    bodyContent = root.children.map(nodeToHtml).join('\n');
  }

  const titleEscaped = escapeHtml(docTitle);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${titleEscaped}</title>
  <style>
    body {
      background-color: #0B0C14;
      color: #F4F5F7;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      padding: 3rem;
      margin: 0;
    }
    header.export-header {
      border-bottom: 2px solid #2A2C3D;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    h1.doc-main-title {
      color: #C6F135;
      font-size: 2rem;
      margin: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #C6F135;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    p {
      color: #F4F5F7;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    pre {
      background-color: #13141F;
      border: 1px solid #2A2C3D;
      border-radius: 8px;
      padding: 1.25rem;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    code {
      font-family: 'Fira Code', Consolas, monospace;
      color: #C6F135;
      font-size: 0.9rem;
    }
    ul {
      color: #F4F5F7;
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }
    li {
      margin-bottom: 0.35rem;
    }
  </style>
</head>
<body>
  <header class="export-header">
    <h1 class="doc-main-title">${titleEscaped}</h1>
  </header>
  <main class="document-content">
    ${bodyContent}
  </main>
</body>
</html>`;
}

function sanitizeHtml(htmlString) {
  return DOMPurify.sanitize(htmlString, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style', 'head', 'meta', 'title', 'link', 'main', 'header', 'article', 'html', 'body', 'pre', 'code'],
    ADD_ATTR: ['class', 'charset', 'name', 'content'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

async function generatePdfBuffer(sanitizedHtml) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(sanitizedHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  astToHtml,
  sanitizeHtml,
  generatePdfBuffer,
  escapeHtml,
};
