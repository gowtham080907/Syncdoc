# Syncdoc Backend (Week 2 Build)

Modular Express.js backend API service for the **Syncdoc** collaborative document platform.

---

## ⚠️ Important Architectural Notices

> [!WARNING]
> **In-Memory User Storage Only**: All user registrations and profiles are stored purely in-memory in `src/services/userStore.js`. All user data resets when the server restarts. The storage service is designed as an isolated module so a database can be plugged in later without altering controllers or routes.

> [!IMPORTANT]
> **No Database / ORM Used**: There is zero database or ORM (no MongoDB, Postgres, SQLite, Prisma, etc.) installed in this repository.

> [!NOTE]
> **Token Logout Limitation**: `POST /api/auth/logout` returns a success message, but does **not** perform server-side token revocation or blacklisting (no session store exists in Week 2). Clients are responsible for discarding their JWT token upon logout.

---

## Installation & Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   `.env` contents:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=syncdoc-dev-jwt-secret-key-super-secure-2026
   JWT_EXPIRES_IN=1d
   ```

---

## Running the Server & Tests

### Development Server
```bash
npm run dev
```

### Production Server
```bash
npm start
```

### Automated Unit & Integration Tests (Jest + Supertest)
```bash
npm test
```

---

## API Documentation & Examples

### 1. Health Check (`GET /api/health`)
- **Headers**: None
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Syncdoc backend is running"
  }
  ```

---

### 2. User Registration (`POST /api/auth/register`)
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123"
  }
  ```
- **curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Jane Doe","email":"jane@example.com","password":"password123"}'
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": "usr-1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-09-17T22:38:00.000Z"
    }
  }
  ```

---

### 3. User Login (`POST /api/auth/login`)
- **Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```
- **curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"jane@example.com","password":"password123"}'
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-09-17T22:38:00.000Z"
    }
  }
  ```

---

### 4. Protected Current User Profile (`GET /api/auth/me` or `GET /api/users/me`)
- **Headers**:
  ```text
  Authorization: Bearer <your_jwt_token_here>
  ```
- **curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/auth/me \
    -H "Authorization: Bearer <your_jwt_token_here>"
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-09-17T22:38:00.000Z"
    }
  }
  ```

---

### 6. PDF Export (`POST /api/export/pdf`)
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "ast": {
      "type": "document",
      "children": [
        {
          "type": "heading",
          "level": 1,
          "children": [{ "type": "text", "text": "SyncDoc AST to PDF Engine" }]
        },
        {
          "type": "paragraph",
          "children": [
            { "type": "text", "text": "Hello " },
            {
              "type": "bold",
              "children": [{ "type": "text", "text": "World" }]
            }
          ]
        }
      ]
    }
  }
  ```
- **curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/export/pdf \
    -H "Content-Type: application/json" \
    -d @tests/fixtures/sample-ast.json \
    --output document.pdf
  ```
- **Response** (200 OK):
  - `Content-Type`: `application/pdf`
  - `Content-Disposition`: `attachment; filename="document.pdf"`
  - Body: Binary PDF Buffer.
- **Response** (400 Bad Request):
  ```json
  {
    "success": false,
    "error": "Invalid AST",
    "details": [
      {
        "path": "ast.children[0].level",
        "message": "heading level must be an integer between 1 and 6"
      }
    ]
  }
  ```

---

## 📄 PDF Export Transformation Engine (Week 3)

### Pipeline Architecture
```text
┌────────────────────────┐
│  POST /api/export/pdf  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   astValidator.js      │  --> Validates schema, depth (max 100), node count (max 50,000)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   astTransformer.js    │  --> Transforms AST to canonical IR, pushes styles down to text runs
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│    pdfGenerator.js     │  --> Generates in-memory A4 PDF using PDFKit
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ 200 application/pdf    │  --> Streamed binary Buffer
└────────────────────────┘
```

### Supported AST Node Types
- `document`: Root node only (`children`: block nodes).
- `heading`: Heading level 1–6 (`children`: inline nodes).
- `paragraph`: Paragraph text container (`children`: inline nodes).
- `text`: Text run (`text` string attribute).
- `bold` / `italic` / `underline`: Formatted inline wrappers (`children`: inline nodes).
- `link`: Hyperlink container (`href` starting with `http:`, `https:`, or `mailto:`).
- `lineBreak`: Explicit line break inline node.
- `bulletList` / `orderedList`: List containers (`orderedList` supports optional `start` integer attribute).
- `listItem`: List item container.
- `blockquote`: Quoted text container (supports left border accent bar).
- `codeBlock`: Code container with optional `language` attribute (preserves exact whitespace and newlines).

### Canonical Intermediate Representation (IR) Shape
```json
{
  "type": "document",
  "blocks": [
    {
      "type": "heading",
      "level": 1,
      "content": [{ "type": "text", "text": "SyncDoc AST to PDF Engine" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello " },
        { "type": "text", "text": "World", "bold": true }
      ]
    }
  ]
}
```

### Environment Variables & Configurable Limits
- `AST_MAX_DEPTH`: Maximum nested depth allowed during AST validation (default: `100`).
- `AST_MAX_NODES`: Maximum total nodes allowed in document AST (default: `50000`).
- `MAX_EXPORT_BODY_SIZE`: Maximum JSON request payload size for export route (default: `2mb`).

### Built-in Font & Unicode Limitations
Standard built-in PDFKit fonts (Helvetica, Courier) use WinAnsi / Latin-1 encoding. Any Unicode characters with code points above `255` are sanitized gracefully (replaced with `?`) to prevent PDF generation crashes.

---

## 🛡️ Week 4 Security Layer

### Why Backend Sanitization is Required
Stored block data may be rendered in browser HTML, exported to PDFs, or consumed by external microservices. Relying solely on client-side escaping is insufficient against stored XSS attacks. The backend sanitizer guarantees that all stored and processed AST documents are neutralized against XSS, mXSS, script injection, and unsafe protocol URLs regardless of downstream consumer behavior.

### Pipeline Architecture
```text
┌────────────────────────┐
│  POST /api/export/pdf  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   astValidator.js      │  --> Validates structural schema rules & limits
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│     sanitizer.js       │  --> Pure AST sanitizer (DOMPurify + jsdom + URL policy)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   astTransformer.js    │  --> Transforms sanitized AST to canonical IR
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│    pdfGenerator.js     │  --> Generates A4 PDF (with isSafeUrl sink guard)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ 200 application/pdf    │  --> Streamed binary Buffer
└───────────┘
```

### DOMPurify + jsdom Configuration
- **Allowed Tags**: `p`, `br`, `strong`, `b`, `em`, `i`, `u`, `h1`–`h6`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `a`
- **Allowed Attributes**: `href` (only on `a` elements)
- **Forbidden Tags**: `script`, `iframe`, `frame`, `frameset`, `object`, `embed`, `applet`, `style`, `link`, `meta`, `base`, `form`, `input`, `textarea`, `select`, `button`, `svg`, `math`, `template`, `noscript`, `audio`, `video`, `source`, `img`
- **Forbidden Attributes**: `style`, `class`, `id`, `name`, `target`, `src`, `srcset`, `srcdoc`, `action`, `formaction`, `xlink:href`
- **Automatic Link Attributes**: Every sanitized `<a>` link receives `rel="noopener noreferrer"`. Attribute `target` is removed.

### URL Policy (`sanitizeUrl` / `isSafeUrl`)
- **Allowlisted Protocols**: `http:`, `https:`, `mailto:` (case-insensitive).
- **Control Character Stripping**: ASCII control characters (`\x00`–`\x1F`, `\x7F`) and whitespace are stripped prior to WHATWG `URL` parsing to defeat obfuscation bypasses (e.g., `java\tscript:`).
- **Relative & Fragment URLs**: Removed (must be absolute URLs with allowlisted protocol).
- **Unsafe Link Handling**: When an AST `link` node contains an unsafe `href` (`javascript:`, `data:`, `file:`, etc.), the link node is **UNWRAPPED** (its children are retained in the text flow, while the unsafe link element and `href` are dropped).

### Text Sanitization Policy & Tradeoff
- **Prose Text Nodes**: Evaluated in plain text mode. NUL and C0/C1 control characters (except `\t`, `\n`, `\r`) are stripped. If text contains a tag-like sequence (`/<[a-z!\/?]/i`), HTML tags are stripped via DOMPurify without double-encoding literals. Literal text such as `"AT&T"` or `"&amp;"` remains unchanged.
- **Tradeoff Notice**: Prose text containing angle brackets (e.g. `"a<b and c>d"`) may be partially stripped if matched as a tag.
- **Code Block Text Nodes**: Sanitized in **LITERAL** mode (control characters stripped, but HTML code snippets preserved verbatim for display as code).

### Centralized Security Limits
| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MAX_AST_DEPTH` (alias `AST_MAX_DEPTH`) | `100` | Max nested node depth |
| `MAX_AST_NODES` (alias `AST_MAX_NODES`) | `50000` | Max total AST nodes per document |
| `MAX_TEXT_LENGTH` | `100000` | Max characters per text node |
| `MAX_HTML_LENGTH` | `200000` | Max characters per HTML string |
| `MAX_URL_LENGTH` | `2048` | Max characters per URL |
| `MAX_SANITIZE_CALLS` | `1000` | Max DOMPurify invocations per request (DoS budget) |
| `MAX_REQUEST_BODY` (alias `MAX_EXPORT_BODY_SIZE`) | `2mb` | Max request body limit for Express |

### Dev/Testing Sanitization Endpoint (`POST /api/security/sanitize`)
- **Request**:
  ```json
  { "html": "<p>Hello <script>alert(1)</script></p>" }
  ```
- **Response** (200 OK):
  ```json
  { "success": true, "sanitized": "<p>Hello </p>" }
  ```
- **Production Gating**: Disabled in production (`NODE_ENV=production`) with a 404 response unless `ENABLE_SANITIZE_ENDPOINT=true`.

### Security Events & Logging
JSON logs outputted via `securityLogger`:
- `security.validation_failed`: AST schema validation failure.
- `security.limit_exceeded`: Depth, node count, text length, or DoS budget limit exceeded.
- `security.sanitized`: Logged when elements, attributes, or links were removed/unwrapped.
- `security.sanitizer_error`: Internal sanitization error.
- **Privacy Notice**: Log entries never log document text, HTML content, URLs, or secrets.

---

## Route Summary

| Endpoint | Method | Auth Required | Status / Behavior |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | No | 200 OK (Backend Health) |
| `/api/auth/register` | POST | No | 201 Created (Validates, Bcrypt hashes, In-memory store) |
| `/api/auth/login` | POST | No | 200 OK (Generates JWT) / 401 Generic Error |
| `/api/auth/logout` | POST | No | 200 OK (Client-side token discard instruction) |
| `/api/auth/me` | GET | Bearer JWT | 200 OK (Current User Profile) |
| `/api/users/me` | GET | Bearer JWT | 200 OK (Current User Profile) |
| `/api/export/pdf` | POST | No | 200 OK (Sanitizes & Exports AST to PDF) / 400 Invalid AST / 413 Body Limit / 415 Non-JSON |
| `/api/security/sanitize` | POST | No | 200 OK (Dev HTML Sanitizer) / 400 Invalid / 404 Disabled in Prod |
| `/api/users` | GET | No | 501 Not Implemented (Future Week) |
| `/api/documents` | ALL | No | 501 Not Implemented (Future Week) |


