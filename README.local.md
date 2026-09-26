# Syncdoc

Syncdoc is a collaborative document editor featuring real-time synchronization, AST conflict resolution, and connected Express.js backend authentication.

---

## 🚀 Quick Start Guide

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm run dev
```
The backend API runs at `http://localhost:5000/api`.

### 2. Start the Frontend Application
In a separate terminal window at root:
```bash
npm install
npm run dev
```
The Vite frontend runs at `http://localhost:5173`.

### 3. Run Backend & Security Tests
```bash
cd backend
npm test
npm run test:security
```

### 4. Dev Sanitization Endpoint (`POST /api/security/sanitize`)
```bash
curl -X POST http://localhost:5000/api/security/sanitize \
  -H "Content-Type: application/json" \
  -d '{"html": "<p>Hello <script>alert(1)</script></p>"}'
```

### 5. Export AST Document to PDF (`POST /api/export/pdf`)
```bash
curl -X POST http://localhost:5000/api/export/pdf \
  -H "Content-Type: application/json" \
  -d @backend/tests/fixtures/sample-ast.json \
  --output document.pdf
```

---

## ⚙️ Environment Configuration

### Frontend Environment (`.env`)
Create or edit `.env` in the root folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:1234
VITE_USE_MOCK_DATA=false
```

### Backend Environment (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=syncdoc-dev-jwt-secret-key-super-secure-2026
JWT_EXPIRES_IN=1d
MAX_AST_DEPTH=100
MAX_AST_NODES=50000
MAX_TEXT_LENGTH=100000
MAX_HTML_LENGTH=200000
MAX_URL_LENGTH=2048
MAX_SANITIZE_CALLS=1000
MAX_REQUEST_BODY=2mb
ENABLE_SANITIZE_ENDPOINT=false
```

---

## 🛡️ Security Engine Architecture (Week 4)

The Security Layer protects SyncDoc AST documents and exports against stored XSS, mXSS, script injection, and DoS attacks:
- **Sanitizer**: DOMPurify + jsdom service (`sanitizer.js`) enforcing strict allowlist tag/attribute policies and URL rules (`http:`, `https:`, `mailto:` only).
- **Link Unwrapping**: Unsafe link protocols (`javascript:`, `data:`, `file:`) unwrap into plain text, preserving visible text while dropping the unsafe `href`.
- **Pipeline**: Request JSON -> `requireJson` -> `astValidator.js` -> `sanitizer.js` -> `astTransformer.js` -> `pdfGenerator.js` -> 200 PDF Buffer.
- **Middleware**: Helmet security headers, `X-Request-Id` UUID tracing, `Content-Type: application/json` enforcement.
- **Security Logging**: Structured JSON logging (`securityLogger.js`) without leaking raw document text or secrets.

---

## 🔐 Authentication Architecture & Flow

1. **User Registration (`POST /api/auth/register`)**:
   - The user registers with name, email, and password.
   - The password is hashed using `bcrypt` and stored in memory.
   - User receives a `201 Created` response.

2. **User Login (`POST /api/auth/login`)**:
   - User logs in with email and password.
   - Backend verifies credentials and signs a JWT token.
   - Frontend stores the JWT token in `localStorage` as `syncdoc_jwt_token`.

3. **Session Restoration (`GET /api/auth/me`)**:
   - On page refresh, `AuthContext` inspects `localStorage` for `syncdoc_jwt_token`.
   - If present, it sends an authenticated request (`Authorization: Bearer <token>`) to `/api/auth/me`.
   - While restoring the session, `isLoading` is held `true`, showing a clean loading state to prevent flash-of-logged-out state.

4. **Protected Endpoints & Authorization Header**:
   - All authenticated requests attach the `Authorization: Bearer <token>` header automatically via the shared `apiFetch` helper module ([`src/services/authApi.ts`](src/services/authApi.ts)).

5. **Logout (`POST /api/auth/logout`)**:
   - Clears `syncdoc_jwt_token` from `localStorage`, resets context state, and redirects user to `/login`.

---

## ⚠️ Known Limitations (Week 3 Scope)

- **In-Memory User Storage Only**: User accounts reset when the backend server restarts.
- **Client-Side Token Revocation**: Logout clears local storage token. Server-side token blacklisting / revocation is deferred until session persistence is introduced.
- **WinAnsi PDF Fonts**: Standard built-in PDF fonts (Helvetica, Courier) support Latin-1 characters. Characters outside Latin-1 are sanitized to safe equivalents or `?`.

