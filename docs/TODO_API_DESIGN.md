# Todo Management API Design Specification

**Date:** 2026-02-08
**Backend Repository:** /Users/ddctu/git/hh
**Target:** RVU Tracker (Next.js 16 + Postgres + TypeScript)

---

## Executive Summary

This document specifies a comprehensive Todo Management API for the RVU Tracker application. The API enables developers to create, manage, and track todos throughout their codebase with features including:

- **CRUD operations** with full validation
- **Advanced filtering** by status, priority, assignee, tags, and date ranges
- **Bulk operations** for efficiency
- **Assignment and collaboration** features
- **Code references** linking todos to specific files and line numbers
- **Comments/notes** for collaboration
- **Tag-based organization** with flexible categorization

The design follows existing patterns in the codebase, uses the established authentication system, and maintains consistency with current API conventions.

---

## Table of Contents

1. [Existing Backend Analysis](#1-existing-backend-analysis)
2. [Database Schema](#2-database-schema)
3. [API Endpoints](#3-api-endpoints)
4. [Request/Response Formats](#4-requestresponse-formats)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Error Handling](#6-error-handling)
7. [Performance Considerations](#7-performance-considerations)
8. [Implementation Plan](#8-implementation-plan)
9. [Testing Strategy](#9-testing-strategy)
10. [Examples](#10-examples)

---

## 1. Existing Backend Analysis

### 1.1 Current API Patterns

The RVU Tracker backend follows these established patterns:

**Framework:** Next.js 16 App Router with API Routes
**Database:** Vercel Postgres (Neon) with @vercel/postgres
**Authentication:** Dual-mode (NextAuth session cookies + mobile JWT tokens)
**Error Handling:** Consistent JSON responses with status codes
**Date Handling:** Timezone-independent DATE and TIME types

### 1.2 Authentication Pattern

```typescript
// From: src/lib/mobile-auth.ts
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthUser | null>
export async function getUserId(req: NextRequest): Promise<string | null>
```

All API routes use `getUserId(req)` to:
1. Check for mobile JWT in `Authorization: Bearer <token>` header
2. Fall back to NextAuth session cookies
3. Support dev bypass mode (`DEV_BYPASS_AUTH=true`)

### 1.3 Database Patterns

**Current Tables:**
- `users` - Authentication (id, email, name, image)
- `visits` - Visit records with CASCADE delete
- `visit_procedures` - Junction table for many-to-many
- `favorites` - User preferences with `sort_order`
- `rvu_codes` - Master reference data

**Existing Conventions:**
- Serial primary keys (`id SERIAL PRIMARY KEY`)
- `user_id TEXT NOT NULL` for all user-owned data
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP` with trigger function
- Composite indexes on `(user_id, date)` patterns
- Foreign keys with CASCADE delete

### 1.4 API Response Patterns

**Success Responses:**
```typescript
// List endpoint
return NextResponse.json(rows);

// Create endpoint
return NextResponse.json(result.rows[0], { status: 201 });

// Update endpoint
return NextResponse.json(result.rows[0]);

// Delete endpoint
return NextResponse.json({ message: 'Resource deleted successfully' });
```

**Error Responses:**
```typescript
// 400 Bad Request
return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

// 401 Unauthorized
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// 404 Not Found
return NextResponse.json({ error: 'Resource not found or unauthorized' }, { status: 404 });

// 500 Internal Server Error
return NextResponse.json({ error: 'Failed to perform operation' }, { status: 500 });
```

### 1.5 Query Parameter Patterns

From `/api/analytics`:
```typescript
const { searchParams } = new URL(req.url);
const period = searchParams.get('period') || 'day';
const start = searchParams.get('start');
const end = searchParams.get('end');
const groupBy = searchParams.get('groupBy');
```

---

## 2. Database Schema

### 2.1 Core Tables

#### `todos` Table

```sql
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Dates
  due_date DATE,
  completed_at TIMESTAMP,

  -- Assignment
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Code references
  file_path TEXT,
  line_number INTEGER,
  line_end INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_line_numbers CHECK (line_end IS NULL OR line_end >= line_number)
);

-- Indexes for performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_user_status ON todos(user_id, status);
CREATE INDEX idx_todos_user_priority ON todos(user_id, priority);
CREATE INDEX idx_todos_user_due ON todos(user_id, due_date);
CREATE INDEX idx_todos_file_path ON todos(file_path) WHERE file_path IS NOT NULL;

-- Full-text search on title and description
CREATE INDEX idx_todos_search ON todos USING gin(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Update trigger
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_todo_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = CURRENT_TIMESTAMP;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_todo_completed_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION set_todo_completed_at();
```

#### `todo_tags` Junction Table

```sql
CREATE TABLE IF NOT EXISTS todo_tags (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate tags on same todo
  UNIQUE(todo_id, tag)
);

CREATE INDEX idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX idx_todo_tags_tag ON todo_tags(tag);
```

#### `todo_comments` Table

```sql
CREATE TABLE IF NOT EXISTS todo_comments (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todo_comments_todo_id ON todo_comments(todo_id);
CREATE INDEX idx_todo_comments_user_id ON todo_comments(user_id);
CREATE INDEX idx_todo_comments_todo_created ON todo_comments(todo_id, created_at);

CREATE TRIGGER update_todo_comments_updated_at BEFORE UPDATE ON todo_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### `todo_dependencies` Junction Table

```sql
CREATE TABLE IF NOT EXISTS todo_dependencies (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  depends_on_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent circular dependencies and duplicates
  UNIQUE(todo_id, depends_on_id),
  CHECK (todo_id != depends_on_id)
);

CREATE INDEX idx_todo_dependencies_todo_id ON todo_dependencies(todo_id);
CREATE INDEX idx_todo_dependencies_depends_on_id ON todo_dependencies(depends_on_id);
```

### 2.2 Migration Script

```sql
-- Migration: Add Todo Management System
-- Date: 2026-02-08

BEGIN;

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMP,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  file_path TEXT,
  line_number INTEGER,
  line_end INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_line_numbers CHECK (line_end IS NULL OR line_end >= line_number)
);

-- Indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_user_status ON todos(user_id, status);
CREATE INDEX idx_todos_user_priority ON todos(user_id, priority);
CREATE INDEX idx_todos_user_due ON todos(user_id, due_date);
CREATE INDEX idx_todos_file_path ON todos(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX idx_todos_search ON todos USING gin(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Triggers
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_todo_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = CURRENT_TIMESTAMP;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_todo_completed_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION set_todo_completed_at();

-- Create todo_tags table
CREATE TABLE IF NOT EXISTS todo_tags (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(todo_id, tag)
);

CREATE INDEX idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX idx_todo_tags_tag ON todo_tags(tag);

-- Create todo_comments table
CREATE TABLE IF NOT EXISTS todo_comments (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todo_comments_todo_id ON todo_comments(todo_id);
CREATE INDEX idx_todo_comments_user_id ON todo_comments(user_id);
CREATE INDEX idx_todo_comments_todo_created ON todo_comments(todo_id, created_at);

CREATE TRIGGER update_todo_comments_updated_at BEFORE UPDATE ON todo_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create todo_dependencies table
CREATE TABLE IF NOT EXISTS todo_dependencies (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  depends_on_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(todo_id, depends_on_id),
  CHECK (todo_id != depends_on_id)
);

CREATE INDEX idx_todo_dependencies_todo_id ON todo_dependencies(todo_id);
CREATE INDEX idx_todo_dependencies_depends_on_id ON todo_dependencies(depends_on_id);

COMMIT;
```

---

## 3. API Endpoints

### 3.1 Todo CRUD Operations

#### `GET /api/todos`

**Description:** Retrieve todos with advanced filtering

**Query Parameters:**
- `status` (optional): Filter by status (pending, in_progress, completed, blocked, cancelled)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `assigned_to` (optional): Filter by assignee user ID
- `tags` (optional): Comma-separated list of tags (OR logic)
- `due_before` (optional): Filter todos due before date (YYYY-MM-DD)
- `due_after` (optional): Filter todos due after date (YYYY-MM-DD)
- `file_path` (optional): Filter by file path (exact match)
- `search` (optional): Full-text search on title and description
- `include_assigned` (optional): Include todos assigned to user (boolean, default: false)
- `sort` (optional): Sort field (created_at, due_date, priority, status, title) (default: created_at)
- `order` (optional): Sort order (asc, desc) (default: desc)
- `limit` (optional): Max results (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "todos": [
    {
      "id": 123,
      "user_id": "google-oauth2|123456",
      "title": "Fix authentication bug in mobile app",
      "description": "Users are unable to sign in with Google on iOS",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-02-15",
      "completed_at": null,
      "assigned_to": "google-oauth2|789012",
      "file_path": "src/app/api/auth/mobile/google/route.ts",
      "line_number": 45,
      "line_end": 50,
      "created_at": "2026-02-08T10:00:00Z",
      "updated_at": "2026-02-08T14:30:00Z",
      "tags": ["bug", "mobile", "authentication"],
      "comments_count": 3,
      "dependencies": [456],
      "blocked_by": []
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### `POST /api/todos`

**Description:** Create a new todo

**Request Body:**
```json
{
  "title": "Fix authentication bug in mobile app",
  "description": "Users are unable to sign in with Google on iOS",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-02-15",
  "assigned_to": "google-oauth2|789012",
  "file_path": "src/app/api/auth/mobile/google/route.ts",
  "line_number": 45,
  "line_end": 50,
  "tags": ["bug", "mobile", "authentication"],
  "dependencies": [456]
}
```

**Required Fields:** `title`

**Response:** `201 Created`
```json
{
  "id": 123,
  "user_id": "google-oauth2|123456",
  "title": "Fix authentication bug in mobile app",
  "description": "Users are unable to sign in with Google on iOS",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-02-15",
  "completed_at": null,
  "assigned_to": "google-oauth2|789012",
  "file_path": "src/app/api/auth/mobile/google/route.ts",
  "line_number": 45,
  "line_end": 50,
  "created_at": "2026-02-08T10:00:00Z",
  "updated_at": "2026-02-08T10:00:00Z",
  "tags": ["bug", "mobile", "authentication"],
  "comments_count": 0,
  "dependencies": [456],
  "blocked_by": []
}
```

#### `GET /api/todos/[id]`

**Description:** Get a single todo by ID

**Response:** `200 OK`
```json
{
  "id": 123,
  "user_id": "google-oauth2|123456",
  "title": "Fix authentication bug in mobile app",
  "description": "Users are unable to sign in with Google on iOS",
  "status": "in_progress",
  "priority": "high",
  "due_date": "2026-02-15",
  "completed_at": null,
  "assigned_to": "google-oauth2|789012",
  "file_path": "src/app/api/auth/mobile/google/route.ts",
  "line_number": 45,
  "line_end": 50,
  "created_at": "2026-02-08T10:00:00Z",
  "updated_at": "2026-02-08T14:30:00Z",
  "tags": ["bug", "mobile", "authentication"],
  "comments": [
    {
      "id": 1,
      "user_id": "google-oauth2|789012",
      "user_name": "Jane Developer",
      "content": "I'm working on this now",
      "created_at": "2026-02-08T14:30:00Z",
      "updated_at": "2026-02-08T14:30:00Z"
    }
  ],
  "dependencies": [
    {
      "id": 456,
      "title": "Upgrade Google Auth SDK",
      "status": "completed"
    }
  ],
  "blocked_by": []
}
```

#### `PUT /api/todos/[id]`

**Description:** Update an existing todo

**Request Body:**
```json
{
  "title": "Fix authentication bug in mobile app (updated)",
  "description": "Updated description",
  "status": "completed",
  "priority": "high",
  "due_date": "2026-02-16",
  "assigned_to": "google-oauth2|999999",
  "file_path": "src/app/api/auth/mobile/google/route.ts",
  "line_number": 45,
  "line_end": 55,
  "tags": ["bug", "mobile", "authentication", "resolved"],
  "dependencies": [456, 789]
}
```

**Response:** `200 OK` (same structure as GET)

#### `PATCH /api/todos/[id]`

**Description:** Partially update a todo (only specified fields)

**Request Body:**
```json
{
  "status": "completed",
  "priority": "high"
}
```

**Response:** `200 OK` (same structure as GET)

#### `DELETE /api/todos/[id]`

**Description:** Delete a todo

**Response:** `200 OK`
```json
{
  "message": "Todo deleted successfully"
}
```

### 3.2 Bulk Operations

#### `POST /api/todos/bulk/complete`

**Description:** Mark multiple todos as completed

**Request Body:**
```json
{
  "ids": [123, 456, 789]
}
```

**Response:** `200 OK`
```json
{
  "message": "3 todos marked as completed",
  "updated": 3,
  "failed": 0
}
```

#### `POST /api/todos/bulk/delete`

**Description:** Delete multiple todos

**Request Body:**
```json
{
  "ids": [123, 456, 789]
}
```

**Response:** `200 OK`
```json
{
  "message": "3 todos deleted successfully",
  "deleted": 3,
  "failed": 0
}
```

#### `PATCH /api/todos/bulk/update`

**Description:** Update multiple todos with same changes

**Request Body:**
```json
{
  "ids": [123, 456, 789],
  "updates": {
    "status": "blocked",
    "priority": "urgent"
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "3 todos updated successfully",
  "updated": 3,
  "failed": 0
}
```

### 3.3 Tags Management

#### `GET /api/todos/tags`

**Description:** Get all unique tags used by the authenticated user

**Query Parameters:**
- `search` (optional): Filter tags by partial match

**Response:** `200 OK`
```json
{
  "tags": [
    {
      "tag": "bug",
      "count": 15
    },
    {
      "tag": "feature",
      "count": 23
    },
    {
      "tag": "documentation",
      "count": 8
    }
  ]
}
```

#### `POST /api/todos/[id]/tags`

**Description:** Add tags to a todo

**Request Body:**
```json
{
  "tags": ["bug", "critical"]
}
```

**Response:** `200 OK`
```json
{
  "message": "Tags added successfully",
  "tags": ["bug", "mobile", "authentication", "critical"]
}
```

#### `DELETE /api/todos/[id]/tags`

**Description:** Remove tags from a todo

**Request Body:**
```json
{
  "tags": ["critical"]
}
```

**Response:** `200 OK`
```json
{
  "message": "Tags removed successfully",
  "tags": ["bug", "mobile", "authentication"]
}
```

### 3.4 Comments Management

#### `GET /api/todos/[id]/comments`

**Description:** Get all comments for a todo

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": 1,
      "user_id": "google-oauth2|789012",
      "user_name": "Jane Developer",
      "user_image": "https://...",
      "content": "I'm working on this now",
      "created_at": "2026-02-08T14:30:00Z",
      "updated_at": "2026-02-08T14:30:00Z"
    }
  ]
}
```

#### `POST /api/todos/[id]/comments`

**Description:** Add a comment to a todo

**Request Body:**
```json
{
  "content": "Fixed in PR #123"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "user_id": "google-oauth2|123456",
  "user_name": "John Doe",
  "user_image": "https://...",
  "content": "Fixed in PR #123",
  "created_at": "2026-02-08T15:00:00Z",
  "updated_at": "2026-02-08T15:00:00Z"
}
```

#### `PUT /api/todos/comments/[commentId]`

**Description:** Update a comment (only by comment author)

**Request Body:**
```json
{
  "content": "Fixed in PR #123 and merged"
}
```

**Response:** `200 OK`

#### `DELETE /api/todos/comments/[commentId]`

**Description:** Delete a comment (only by comment author or todo owner)

**Response:** `200 OK`
```json
{
  "message": "Comment deleted successfully"
}
```

### 3.5 Dependencies Management

#### `POST /api/todos/[id]/dependencies`

**Description:** Add dependencies to a todo

**Request Body:**
```json
{
  "dependencies": [456, 789]
}
```

**Response:** `200 OK`
```json
{
  "message": "Dependencies added successfully",
  "dependencies": [456, 789]
}
```

#### `DELETE /api/todos/[id]/dependencies`

**Description:** Remove dependencies from a todo

**Request Body:**
```json
{
  "dependencies": [789]
}
```

**Response:** `200 OK`
```json
{
  "message": "Dependencies removed successfully",
  "dependencies": [456]
}
```

#### `GET /api/todos/[id]/blocked-by`

**Description:** Get todos that are blocking this todo (reverse dependencies)

**Response:** `200 OK`
```json
{
  "blocked_by": [
    {
      "id": 999,
      "title": "Database migration must complete first",
      "status": "in_progress",
      "priority": "urgent"
    }
  ]
}
```

### 3.6 Statistics & Analytics

#### `GET /api/todos/stats`

**Description:** Get todo statistics for the authenticated user

**Query Parameters:**
- `start` (optional): Start date for date range (YYYY-MM-DD)
- `end` (optional): End date for date range (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "total": 50,
  "by_status": {
    "pending": 15,
    "in_progress": 10,
    "completed": 20,
    "blocked": 3,
    "cancelled": 2
  },
  "by_priority": {
    "low": 10,
    "medium": 25,
    "high": 12,
    "urgent": 3
  },
  "overdue": 5,
  "due_today": 3,
  "due_this_week": 8,
  "completion_rate": 0.4,
  "avg_completion_time_hours": 48.5
}
```

---

## 4. Request/Response Formats

### 4.1 TypeScript Types

```typescript
// src/types/todo.ts

export interface Todo {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date?: string; // YYYY-MM-DD
  completed_at?: string; // ISO 8601
  assigned_to?: string;
  file_path?: string;
  line_number?: number;
  line_end?: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  tags?: string[];
  comments_count?: number;
  dependencies?: number[];
  blocked_by?: number[];
}

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TodoComment {
  id: number;
  todo_id: number;
  user_id: string;
  user_name?: string;
  user_image?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TodoDependency {
  id: number;
  title: string;
  status: TodoStatus;
  priority?: TodoPriority;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  assigned_to?: string;
  file_path?: string;
  line_number?: number;
  line_end?: number;
  tags?: string[];
  dependencies?: number[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  assigned_to?: string;
  file_path?: string;
  line_number?: number;
  line_end?: number;
  tags?: string[];
  dependencies?: number[];
}

export interface TodoListResponse {
  todos: Todo[];
  total: number;
  limit: number;
  offset: number;
}

export interface BulkOperationResponse {
  message: string;
  updated?: number;
  deleted?: number;
  failed: number;
  errors?: Array<{ id: number; error: string }>;
}

export interface TodoStats {
  total: number;
  by_status: Record<TodoStatus, number>;
  by_priority: Record<TodoPriority, number>;
  overdue: number;
  due_today: number;
  due_this_week: number;
  completion_rate: number;
  avg_completion_time_hours: number;
}

export interface TagSummary {
  tag: string;
  count: number;
}
```

### 4.2 Validation Rules

**Title:**
- Required
- Max length: 500 characters
- Cannot be empty or whitespace only

**Description:**
- Optional
- Max length: 5000 characters

**Status:**
- Must be one of: pending, in_progress, completed, blocked, cancelled
- Default: pending

**Priority:**
- Must be one of: low, medium, high, urgent
- Default: medium

**Due Date:**
- Optional
- Format: YYYY-MM-DD
- Must be valid date
- Can be in the past (for overdue tracking)

**File Path:**
- Optional
- Max length: 1000 characters
- Should be valid file path format (but not validated against filesystem)

**Line Numbers:**
- Optional
- Must be positive integers
- line_end must be >= line_number if both provided

**Tags:**
- Optional array
- Each tag: max 50 characters, alphanumeric + hyphens/underscores
- Max 20 tags per todo
- Case-insensitive, stored lowercase

**Dependencies:**
- Optional array of todo IDs
- Must be valid todo IDs owned by user
- Cannot create circular dependencies
- Max 50 dependencies per todo

---

## 5. Authentication & Authorization

### 5.1 Authentication Methods

All endpoints use the existing authentication pattern:

```typescript
import { getUserId } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### 5.2 Authorization Rules

**Own Todos:**
- Users can create, read, update, delete their own todos

**Assigned Todos:**
- Users can read todos assigned to them
- Users can update status/comments on assigned todos
- Users cannot delete todos they don't own

**Comments:**
- Users can read all comments on todos they own or are assigned to
- Users can only edit/delete their own comments
- Todo owners can delete any comment on their todos

**Dependencies:**
- Users can only create dependencies to their own todos
- Users can view dependencies on todos they have access to

### 5.3 Access Control Examples

```typescript
// Check if user owns todo or is assigned to it
async function hasAccessToTodo(userId: string, todoId: number): Promise<boolean> {
  const result = await sql`
    SELECT id FROM todos
    WHERE id = ${todoId}
    AND (user_id = ${userId} OR assigned_to = ${userId})
  `;
  return result.rows.length > 0;
}

// Check if user owns todo
async function isTodoOwner(userId: string, todoId: number): Promise<boolean> {
  const result = await sql`
    SELECT id FROM todos
    WHERE id = ${todoId} AND user_id = ${userId}
  `;
  return result.rows.length > 0;
}
```

---

## 6. Error Handling

### 6.1 Standard Error Responses

Following existing patterns:

```typescript
// 400 Bad Request - Validation errors
{
  "error": "Missing required field: title"
}
{
  "error": "Invalid status value. Must be one of: pending, in_progress, completed, blocked, cancelled"
}
{
  "error": "Invalid due_date format. Expected YYYY-MM-DD"
}

// 401 Unauthorized - Authentication failed
{
  "error": "Unauthorized"
}

// 403 Forbidden - Insufficient permissions
{
  "error": "You do not have permission to modify this todo"
}

// 404 Not Found - Resource not found
{
  "error": "Todo not found or unauthorized"
}
{
  "error": "Comment not found"
}

// 409 Conflict - Business logic conflict
{
  "error": "Circular dependency detected"
}
{
  "error": "Cannot add dependency: todo does not exist"
}

// 500 Internal Server Error
{
  "error": "Failed to create todo"
}
{
  "error": "Failed to update todo"
}
```

### 6.2 Validation Error Details

For complex validation errors, provide detailed feedback:

```typescript
// Multiple validation errors
{
  "error": "Validation failed",
  "details": {
    "title": "Title is required",
    "due_date": "Invalid date format",
    "tags": "Tag 'invalid tag!' contains invalid characters"
  }
}
```

---

## 7. Performance Considerations

### 7.1 Database Optimization

**Indexes:**
- Composite indexes on frequently filtered columns (user_id + status, user_id + priority)
- Separate indexes on foreign keys
- Full-text search index on title + description
- Partial index on file_path for code reference queries

**Query Optimization:**
- Use pagination (limit/offset) for all list endpoints
- Eager load related data (tags, comments_count) in single query
- Use JOINs instead of N+1 queries
- Cache frequently accessed data (tag lists, user names)

### 7.2 Query Examples

**Efficient list query with filters:**
```typescript
const result = await sql`
  WITH todo_tags_agg AS (
    SELECT todo_id, ARRAY_AGG(tag) as tags
    FROM todo_tags
    GROUP BY todo_id
  ),
  todo_comments_count AS (
    SELECT todo_id, COUNT(*) as count
    FROM todo_comments
    GROUP BY todo_id
  )
  SELECT
    t.*,
    COALESCE(tt.tags, ARRAY[]::text[]) as tags,
    COALESCE(tc.count, 0) as comments_count
  FROM todos t
  LEFT JOIN todo_tags_agg tt ON t.id = tt.todo_id
  LEFT JOIN todo_comments_count tc ON t.id = tc.todo_id
  WHERE t.user_id = ${userId}
    AND (${status}::text IS NULL OR t.status = ${status})
    AND (${priority}::text IS NULL OR t.priority = ${priority})
  ORDER BY t.created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

### 7.3 Caching Strategy

**Consider caching:**
- Tag lists (rarely change, frequently accessed)
- User names for assignees (static reference data)
- Todo counts for stats endpoint

**Cache invalidation:**
- Clear todo cache on create/update/delete
- Clear tag cache on tag add/remove
- Use short TTL (5-10 minutes) for non-critical data

### 7.4 Rate Limiting

Implement rate limiting for expensive operations:
- Bulk operations: 10 requests/minute
- List queries with complex filters: 60 requests/minute
- Search queries: 30 requests/minute

---

## 8. Implementation Plan

### 8.1 Phase 1: Core CRUD (Week 1)

**Tasks:**
1. Create database migration script
2. Run migration on development database
3. Create `/api/todos/route.ts` (GET, POST)
4. Create `/api/todos/[id]/route.ts` (GET, PUT, PATCH, DELETE)
5. Add TypeScript types to `src/types/todo.ts`
6. Write unit tests for CRUD operations
7. Test authentication and authorization

**Files to create:**
- `scripts/add-todo-system.sql`
- `src/app/api/todos/route.ts`
- `src/app/api/todos/[id]/route.ts`
- `src/types/todo.ts`
- `src/app/api/__tests__/todos.test.ts`

### 8.2 Phase 2: Filtering & Pagination (Week 1)

**Tasks:**
1. Implement query parameter parsing
2. Add filtering logic (status, priority, tags, dates)
3. Add full-text search
4. Add sorting and pagination
5. Optimize queries with indexes
6. Write tests for filtering

**Files to modify:**
- `src/app/api/todos/route.ts`

### 8.3 Phase 3: Tags & Comments (Week 2)

**Tasks:**
1. Create `/api/todos/tags/route.ts`
2. Create `/api/todos/[id]/tags/route.ts`
3. Create `/api/todos/[id]/comments/route.ts`
4. Create `/api/todos/comments/[commentId]/route.ts`
5. Implement tag management logic
6. Implement comment CRUD
7. Write tests

**Files to create:**
- `src/app/api/todos/tags/route.ts`
- `src/app/api/todos/[id]/tags/route.ts`
- `src/app/api/todos/[id]/comments/route.ts`
- `src/app/api/todos/comments/[commentId]/route.ts`

### 8.4 Phase 4: Dependencies & Bulk Ops (Week 2)

**Tasks:**
1. Create `/api/todos/[id]/dependencies/route.ts`
2. Create `/api/todos/bulk/complete/route.ts`
3. Create `/api/todos/bulk/delete/route.ts`
4. Create `/api/todos/bulk/update/route.ts`
5. Implement circular dependency detection
6. Implement bulk operation logic
7. Write tests

**Files to create:**
- `src/app/api/todos/[id]/dependencies/route.ts`
- `src/app/api/todos/bulk/complete/route.ts`
- `src/app/api/todos/bulk/delete/route.ts`
- `src/app/api/todos/bulk/update/route.ts`

### 8.5 Phase 5: Statistics & Polish (Week 3)

**Tasks:**
1. Create `/api/todos/stats/route.ts`
2. Implement analytics queries
3. Add rate limiting
4. Performance optimization
5. Update OpenAPI documentation
6. End-to-end testing
7. Update CLAUDE.md

**Files to create:**
- `src/app/api/todos/stats/route.ts`
- `docs/TODO_API.yaml` (OpenAPI spec addition)

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Test coverage:**
- CRUD operations (create, read, update, delete)
- Validation (required fields, formats, constraints)
- Authorization (owner vs assigned vs unauthorized)
- Filtering and pagination
- Tag management
- Comment management
- Dependencies (circular detection)
- Bulk operations
- Statistics calculations

**Test file structure:**
```typescript
// src/app/api/__tests__/todos.test.ts

describe('Todos API', () => {
  describe('POST /api/todos', () => {
    it('creates a todo with valid data');
    it('rejects request without title');
    it('validates status enum');
    it('validates priority enum');
    it('validates date format');
  });

  describe('GET /api/todos', () => {
    it('returns todos for authenticated user');
    it('filters by status');
    it('filters by priority');
    it('filters by tags');
    it('paginates results');
    it('sorts by specified field');
  });

  describe('PUT /api/todos/[id]', () => {
    it('updates own todo');
    it('prevents updating other user todo');
    it('validates line number constraints');
  });

  // ... more test cases
});
```

### 9.2 Integration Tests

**Playwright E2E tests:**
- Complete todo workflow (create → update → complete → delete)
- Assignment workflow
- Collaboration (comments, dependencies)
- Bulk operations
- Mobile authentication flow

### 9.3 Test Data

**Seed test data:**
```typescript
// scripts/seed-test-todos.ts
const testTodos = [
  {
    title: 'Fix authentication bug',
    status: 'in_progress',
    priority: 'high',
    tags: ['bug', 'auth']
  },
  // ... more test data
];
```

---

## 10. Examples

### 10.1 Creating a Todo with Code Reference

**Request:**
```bash
curl -X POST https://trackmyrvu.com/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Refactor date handling in visits API",
    "description": "Use timezone-independent date utilities from @/lib/dateUtils",
    "priority": "medium",
    "due_date": "2026-02-20",
    "file_path": "src/app/api/visits/route.ts",
    "line_number": 68,
    "line_end": 72,
    "tags": ["refactor", "tech-debt"]
  }'
```

**Response:**
```json
{
  "id": 789,
  "user_id": "google-oauth2|123456",
  "title": "Refactor date handling in visits API",
  "description": "Use timezone-independent date utilities from @/lib/dateUtils",
  "status": "pending",
  "priority": "medium",
  "due_date": "2026-02-20",
  "completed_at": null,
  "assigned_to": null,
  "file_path": "src/app/api/visits/route.ts",
  "line_number": 68,
  "line_end": 72,
  "created_at": "2026-02-08T16:00:00Z",
  "updated_at": "2026-02-08T16:00:00Z",
  "tags": ["refactor", "tech-debt"],
  "comments_count": 0,
  "dependencies": [],
  "blocked_by": []
}
```

### 10.2 Filtering Todos

**Request:**
```bash
curl -X GET "https://trackmyrvu.com/api/todos?status=in_progress&priority=high&tags=bug,critical&sort=due_date&order=asc" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "todos": [
    {
      "id": 123,
      "title": "Fix critical authentication bug",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-02-10",
      "tags": ["bug", "critical", "auth"]
    },
    {
      "id": 456,
      "title": "Database migration failure on production",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-02-12",
      "tags": ["bug", "critical", "database"]
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

### 10.3 Adding a Comment

**Request:**
```bash
curl -X POST https://trackmyrvu.com/api/todos/123/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Fixed in commit abc123. Testing on staging now."
  }'
```

**Response:**
```json
{
  "id": 5,
  "user_id": "google-oauth2|123456",
  "user_name": "John Developer",
  "user_image": "https://lh3.googleusercontent.com/...",
  "content": "Fixed in commit abc123. Testing on staging now.",
  "created_at": "2026-02-08T17:00:00Z",
  "updated_at": "2026-02-08T17:00:00Z"
}
```

### 10.4 Bulk Complete Todos

**Request:**
```bash
curl -X POST https://trackmyrvu.com/api/todos/bulk/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [123, 456, 789]
  }'
```

**Response:**
```json
{
  "message": "3 todos marked as completed",
  "updated": 3,
  "failed": 0
}
```

### 10.5 Getting Statistics

**Request:**
```bash
curl -X GET "https://trackmyrvu.com/api/todos/stats?start=2026-02-01&end=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "total": 50,
  "by_status": {
    "pending": 15,
    "in_progress": 10,
    "completed": 20,
    "blocked": 3,
    "cancelled": 2
  },
  "by_priority": {
    "low": 10,
    "medium": 25,
    "high": 12,
    "urgent": 3
  },
  "overdue": 5,
  "due_today": 3,
  "due_this_week": 8,
  "completion_rate": 0.4,
  "avg_completion_time_hours": 48.5
}
```

---

## Summary

This comprehensive Todo API design provides:

- **Complete CRUD operations** following existing Next.js API patterns
- **Advanced filtering** with multiple query parameters
- **Pagination and sorting** for scalability
- **Tag-based organization** for flexible categorization
- **Comments system** for collaboration
- **Dependencies tracking** with circular dependency prevention
- **Bulk operations** for efficiency
- **Statistics and analytics** for insights
- **Code references** linking todos to specific files/lines
- **Assignment features** for team collaboration
- **Consistent authentication** using existing mobile-auth system
- **Comprehensive error handling** with clear messages
- **Performance optimization** with proper indexing
- **Type safety** with TypeScript definitions

The design is production-ready and follows all established conventions in the RVU Tracker codebase.

---

**Next Steps:**
1. Review this design with iOS team and team lead
2. Approve database schema changes
3. Begin Phase 1 implementation (Core CRUD)
4. Iterate based on feedback
5. Deploy to staging environment for testing
6. Roll out to production

**Questions or Feedback:**
Please review and provide feedback on:
- API endpoint structure
- Database schema design
- Feature completeness
- Performance concerns
- Integration with iOS app
