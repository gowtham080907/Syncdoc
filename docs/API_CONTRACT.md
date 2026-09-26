# SyncDoc API Contract Specification

**Document Version**: 1.0.0  
**Author**: SyncDoc Frontend Team (Member 1)  
**Target Backend Teams**: Member 2 (Backend & Real-Time), Member 3 (AST & Conflict), Member 4 (Database & Auth)

---

## Overview

This contract formalizes the communication protocol between the SyncDoc Frontend web application and the Backend services (Node.js/Express, MongoDB, Socket.IO/Yjs, AST Engine).

---

## Base Configuration

- **REST Base URL**: `http://localhost:5000/api` (configurable via `VITE_API_URL`)
- **WebSocket URL**: `ws://localhost:5000` (configurable via `VITE_WS_URL`)
- **Mock Mode Flag**: `VITE_USE_MOCK_DATA=true|false`

---

## 1. REST API Endpoints

### Authentication & User Management

#### `GET /api/users/me`
Retrieves the currently authenticated user's profile.

**Headers**:
- `Authorization: Bearer <JWT_TOKEN>`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "usr-1",
    "name": "Sujitha Reddy",
    "username": "sujitha",
    "email": "sujitha@example.com",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "color": "#3b82f6",
    "role": "Computer Science Engineering",
    "about": "Lead developer & frontend architect for SyncDoc engine.",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

#### `PUT /api/users/me`
Updates user profile settings.

**Request Body**:
```json
{
  "name": "Sujitha Reddy",
  "username": "sujithareddy",
  "about": "Lead Frontend Architect working on CRDTs & AST conflict UI.",
  "role": "Computer Science Engineering",
  "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "usr-1",
    "name": "Sujitha Reddy",
    "username": "sujithareddy",
    "email": "sujitha@example.com",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "color": "#3b82f6",
    "role": "Computer Science Engineering",
    "about": "Lead Frontend Architect working on CRDTs & AST conflict UI.",
    "updatedAt": "2026-09-18T14:00:00.000Z"
  }
}
```

---

### Document Management

#### `GET /api/documents`
Lists documents accessible by the user.

**Query Parameters**:
- `filter`: `all` | `recent` | `shared` | `starred`
- `search`: string

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-1",
      "title": "SyncDoc AST Architecture Specification",
      "owner": {
        "id": "usr-1",
        "name": "Sujitha Reddy",
        "email": "sujitha@example.com"
      },
      "collaborators": [
        { "id": "usr-2", "name": "Sree", "color": "#10b981" },
        { "id": "usr-3", "name": "Rahul", "color": "#f59e0b" }
      ],
      "lastEditor": "Sree",
      "isStarred": true,
      "isShared": true,
      "updatedAt": "2026-09-18T12:30:00.000Z",
      "createdAt": "2026-09-10T08:00:00.000Z"
    }
  ]
}
```

#### `GET /api/documents/:id`
Fetch document details and block structure.

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "doc-1",
    "title": "SyncDoc AST Architecture Specification",
    "ownerId": "usr-1",
    "blocks": [
      {
        "id": "blk-1",
        "type": "heading",
        "content": "SyncDoc Technical Overview",
        "order": 0,
        "metadata": { "level": 1 }
      },
      {
        "id": "blk-2",
        "type": "paragraph",
        "content": "Real-time collaborative document engine with AST-based conflict resolution.",
        "order": 1
      }
    ],
    "version": 42,
    "updatedAt": "2026-09-18T12:30:00.000Z"
  }
}
```

#### `POST /api/documents`
Create a new document.

**Request Body**:
```json
{
  "title": "Untitled Document",
  "initialBlocks": [
    {
      "id": "blk-init-1",
      "type": "paragraph",
      "content": "",
      "order": 0
    }
  ]
}
```

#### `PUT /api/documents/:id`
Persist document updates (fallback / periodic persistence).

**Request Body**:
```json
{
  "title": "Updated Title",
  "blocks": [ ... ]
}
```

#### `DELETE /api/documents/:id`
Delete a document.

---

## 2. Real-Time Collaboration Events (WebSocket / Socket.IO)

### Client → Server Events

| Event Name | Payload Description |
|---|---|
| `join-document` | `{ documentId: string, user: PresenceUser }` |
| `leave-document` | `{ documentId: string, userId: string }` |
| `document-update` | `{ documentId: string, delta: YjsUpdateArray, blockId?: string }` |
| `cursor-update` | `{ documentId: string, cursor: { blockId: string, position: number } }` |
| `selection-update` | `{ documentId: string, selection: { blockId: string, start: number, end: number } }` |
| `presence-update` | `{ documentId: string, status: "active" \| "idle" \| "offline" }` |
| `resolve-conflict` | `{ documentId: string, conflictId: string, resolution: "keep-mine" \| "keep-other" \| "custom", mergedContent?: string }` |

### Server → Client Events

| Event Name | Payload Description |
|---|---|
| `document-state` | `{ documentId: string, blocks: DocumentBlock[], yjsState: Uint8Array }` |
| `remote-update` | `{ documentId: string, delta: YjsUpdateArray, affectedBlockId: string }` |
| `remote-cursor` | `{ userId: string, userName: string, userColor: string, blockId: string, position: number }` |
| `remote-selection` | `{ userId: string, userColor: string, blockId: string, start: number, end: number }` |
| `presence-sync` | `{ activeUsers: PresenceUser[] }` |
| `conflict-detected` | `{ conflictId: string, blockId: string, localContent: string, remoteContent: string, astDiff: ASTDiff }` |
| `conflict-resolved` | `{ conflictId: string, resolvedBlock: DocumentBlock }` |

---

## 3. TypeScript Interfaces Reference

```typescript
export type BlockType = 
  | "heading" 
  | "paragraph" 
  | "code" 
  | "bullet-list" 
  | "numbered-list" 
  | "quote";

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  order: number;
  metadata?: Record<string, unknown>;
}

export interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  currentBlockId?: string;
  lastActive: string;
}
```
