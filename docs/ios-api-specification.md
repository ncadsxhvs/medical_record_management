# RVU Tracker - iOS API Specification

**Version:** 1.0.0
**Last Updated:** February 8, 2026
**Base URL:** `https://www.trackmyrvu.com/api`

This document provides a complete API specification for the RVU Tracker iOS application. All endpoints follow consistent patterns established in the existing backend codebase.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Existing Endpoints](#existing-endpoints)
3. [Favorites API](#favorites-api)
4. [Analytics API](#analytics-api)
5. [Error Handling](#error-handling)
6. [Data Models](#data-models)
7. [Example Requests](#example-requests)

---

## Authentication

### Overview

The iOS app uses **JWT Bearer token authentication**. All protected endpoints require an `Authorization` header.

### Authentication Header

```
Authorization: Bearer <jwt_token>
```

### Obtaining a Token

**Endpoint:** `POST /api/auth/mobile/google`

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "117234567890123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/..."
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000
}
```

**Token Expiration:** 30 days (2,592,000 seconds)

**Error Responses:**
- `400` - Missing idToken
- `401` - Invalid ID token
- `500` - Failed to create user session

### Token Storage

Store the `sessionToken` in iOS Keychain for secure persistence. Include it in all subsequent API requests.

---

## Existing Endpoints

### Visits

#### Get All Visits

**Endpoint:** `GET /api/visits`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "123",
    "user_id": "117234567890123456789",
    "date": "2026-02-08",
    "time": "14:30:00",
    "notes": "Patient complained of back pain",
    "is_no_show": false,
    "created_at": "2026-02-08T19:45:23.123Z",
    "updated_at": "2026-02-08T19:45:23.123Z",
    "procedures": [
      {
        "id": "456",
        "visit_id": "123",
        "hcpcs": "99213",
        "description": "Office or other outpatient visit",
        "status_code": "A",
        "work_rvu": 1.3,
        "quantity": 1
      }
    ]
  }
]
```

**Notes:**
- Returns empty array `[]` if user has no visits
- Visits ordered by `created_at DESC`
- `time` field is optional (can be `null`)
- `procedures` array is empty for no-show visits

#### Create Visit

**Endpoint:** `POST /api/visits`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2026-02-08",
  "time": "14:30:00",
  "notes": "Patient complained of back pain",
  "is_no_show": false,
  "procedures": [
    {
      "hcpcs": "99213",
      "description": "Office or other outpatient visit",
      "status_code": "A",
      "work_rvu": 1.3,
      "quantity": 1
    }
  ]
}
```

**Field Requirements:**
- `date` - **Required** (YYYY-MM-DD format)
- `time` - Optional (HH:MM:SS format, 24-hour)
- `notes` - Optional
- `is_no_show` - Optional (defaults to `false`)
- `procedures` - **Required** unless `is_no_show` is `true`

**Response (201 Created):**
```json
{
  "id": "124",
  "user_id": "117234567890123456789",
  "date": "2026-02-08",
  "time": "14:30:00",
  "notes": "Patient complained of back pain",
  "is_no_show": false,
  "created_at": "2026-02-08T20:15:42.567Z",
  "updated_at": "2026-02-08T20:15:42.567Z",
  "procedures": [
    {
      "id": "789",
      "visit_id": "124",
      "hcpcs": "99213",
      "description": "Office or other outpatient visit",
      "status_code": "A",
      "work_rvu": 1.3,
      "quantity": 1
    }
  ]
}
```

**Error Responses:**
- `400` - Missing required fields or validation error
- `401` - Unauthorized (invalid/expired token)
- `500` - Server error

#### Update Visit

**Endpoint:** `PUT /api/visits/{id}`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2026-02-09",
  "time": "15:00:00",
  "notes": "Updated notes",
  "procedures": [
    {
      "hcpcs": "99214",
      "description": "Office visit, extended",
      "status_code": "A",
      "work_rvu": 1.92,
      "quantity": 1
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "124",
  "user_id": "117234567890123456789",
  "date": "2026-02-09",
  "time": "15:00:00",
  "notes": "Updated notes",
  "is_no_show": false,
  "created_at": "2026-02-08T20:15:42.567Z",
  "updated_at": "2026-02-09T10:23:15.890Z",
  "procedures": [
    {
      "id": "790",
      "visit_id": "124",
      "hcpcs": "99214",
      "description": "Office visit, extended",
      "status_code": "A",
      "work_rvu": 1.92,
      "quantity": 1
    }
  ]
}
```

**Notes:**
- Replaces all procedures (delete + insert pattern)
- Must include all fields (date, procedures, etc.)

**Error Responses:**
- `400` - Missing required fields
- `401` - Unauthorized
- `404` - Visit not found or not owned by user
- `500` - Server error

#### Delete Visit

**Endpoint:** `DELETE /api/visits/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Visit deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Visit not found or not owned by user
- `500` - Server error

---

## Favorites API

### Overview

The Favorites API allows users to save frequently used HCPCS codes for quick access. Favorites support custom ordering via `sort_order`.

### Database Schema

```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  hcpcs VARCHAR(20) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, hcpcs)
);
```

### Get Favorites

**Endpoint:** `GET /api/favorites`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_id": "117234567890123456789",
    "hcpcs": "99213",
    "sort_order": 0,
    "created_at": "2026-02-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": "117234567890123456789",
    "hcpcs": "99214",
    "sort_order": 1,
    "created_at": "2026-02-01T10:05:00.000Z"
  }
]
```

**Notes:**
- Results ordered by `sort_order ASC, created_at ASC`
- Returns empty array `[]` if no favorites
- `sort_order` determines display position (0 = first)

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

### Add Favorite

**Endpoint:** `POST /api/favorites`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "hcpcs": "99215"
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "user_id": "117234567890123456789",
  "hcpcs": "99215",
  "sort_order": 2,
  "created_at": "2026-02-08T20:30:00.000Z"
}
```

**Notes:**
- `sort_order` is auto-assigned (max + 1)
- Duplicate `hcpcs` for same user is silently ignored (ON CONFLICT DO NOTHING)
- If duplicate, response will be `null` or empty

**Error Responses:**
- `400` - Missing required field: hcpcs
- `401` - Unauthorized
- `500` - Server error

### Remove Favorite

**Endpoint:** `DELETE /api/favorites/{hcpcs}`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `DELETE /api/favorites/99213`

**Response (200 OK):**
```json
{
  "message": "Favorite removed successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Favorite not found or user not authorized
- `500` - Server error

### Reorder Favorites

**Endpoint:** `PATCH /api/favorites`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "favorites": [
    { "hcpcs": "99214" },
    { "hcpcs": "99213" },
    { "hcpcs": "99215" }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Notes:**
- Array order determines new `sort_order` (index = sort_order)
- First item gets `sort_order = 0`, second gets `1`, etc.
- Only updates favorites owned by authenticated user
- Invalid HCPCS codes are silently skipped

**Error Responses:**
- `400` - Invalid request: favorites must be an array
- `401` - Unauthorized
- `500` - Server error

---

## Analytics API

### Overview

The Analytics API provides aggregated RVU data with flexible date range filtering and period grouping.

### Get Analytics Summary

**Endpoint:** `GET /api/analytics`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| `start` | string | **Yes** | Start date (inclusive) | YYYY-MM-DD |
| `end` | string | **Yes** | End date (inclusive) | YYYY-MM-DD |
| `period` | string | No | Grouping period (default: `day`) | `daily`, `weekly`, `monthly`, `yearly` |
| `groupBy` | string | No | Group by HCPCS code | `hcpcs` (optional) |

**Example:** `GET /api/analytics?start=2026-02-01&end=2026-02-08&period=daily`

**Response (200 OK):**
```json
[
  {
    "period_start": "2026-02-08",
    "total_work_rvu": 4.52,
    "total_encounters": 2,
    "total_no_shows": 0
  },
  {
    "period_start": "2026-02-07",
    "total_work_rvu": 1.3,
    "total_encounters": 1,
    "total_no_shows": 0
  }
]
```

**Field Descriptions:**
- `period_start` - Start of period (date or timestamp)
- `total_work_rvu` - Sum of (work_rvu × quantity) for all procedures
- `total_encounters` - Count of distinct visits with procedures
- `total_no_shows` - Count of visits marked as no-show

**Period Grouping Behavior:**

| Period | SQL Function | `period_start` Format | Example |
|--------|--------------|----------------------|---------|
| `daily` | Raw date | YYYY-MM-DD | `2026-02-08` |
| `weekly` | `DATE_TRUNC('week', ...)` | YYYY-MM-DD (Monday) | `2026-02-03` |
| `monthly` | `DATE_TRUNC('month', ...)` | YYYY-MM-DD (1st) | `2026-02-01` |
| `yearly` | `DATE_TRUNC('year', ...)` | YYYY-MM-DD (Jan 1) | `2026-01-01` |

**Notes:**
- Results ordered by `period_start ASC`
- Empty periods are not included
- Visits without procedures (no-shows) count toward `total_no_shows` but not `total_encounters`

**Error Responses:**
- `400` - Missing required query parameters: start and end
- `401` - Unauthorized
- `500` - Server error

### Get HCPCS Breakdown

**Endpoint:** `GET /api/analytics?groupBy=hcpcs`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | string | **Yes** | Start date (YYYY-MM-DD) |
| `end` | string | **Yes** | End date (YYYY-MM-DD) |
| `period` | string | No | Grouping period (default: `day`) |
| `groupBy` | string | **Yes** | Must be `hcpcs` |

**Example:** `GET /api/analytics?start=2026-02-01&end=2026-02-08&period=daily&groupBy=hcpcs`

**Response (200 OK):**
```json
[
  {
    "period_start": "2026-02-08",
    "hcpcs": "99213",
    "description": "Office or other outpatient visit",
    "status_code": "A",
    "total_work_rvu": 2.6,
    "total_quantity": 2,
    "encounter_count": 2
  },
  {
    "period_start": "2026-02-08",
    "hcpcs": "99214",
    "description": "Office visit, extended",
    "status_code": "A",
    "total_work_rvu": 1.92,
    "total_quantity": 1,
    "encounter_count": 1
  },
  {
    "period_start": "2026-02-07",
    "hcpcs": "99213",
    "description": "Office or other outpatient visit",
    "status_code": "A",
    "total_work_rvu": 1.3,
    "total_quantity": 1,
    "encounter_count": 1
  }
]
```

**Field Descriptions:**
- `period_start` - Start of period (date or timestamp)
- `hcpcs` - HCPCS code
- `description` - Procedure description
- `status_code` - RVU status code (A, R, etc.)
- `total_work_rvu` - Sum of (work_rvu × quantity)
- `total_quantity` - Sum of quantities
- `encounter_count` - Number of times this code was used

**Notes:**
- Results ordered by `period_start DESC, total_work_rvu DESC`
- Each row represents one HCPCS code in one period
- Multiple rows per period if multiple codes used

**Error Responses:**
- `400` - Missing required query parameters: start and end
- `401` - Unauthorized
- `500` - Server error

---

## Error Handling

### Standard Error Response

All endpoints return errors in consistent JSON format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Missing required fields, validation error |
| `401` | Unauthorized | Missing/invalid/expired token |
| `404` | Not Found | Resource doesn't exist or user doesn't own it |
| `500` | Internal Server Error | Database error, unexpected error |

### Common Error Scenarios

#### 401 Unauthorized

**Causes:**
- Missing `Authorization` header
- Invalid JWT token
- Expired JWT token (30 days)
- Token signature verification failed

**Client Action:**
- Clear stored token
- Redirect to sign-in screen
- User must re-authenticate

#### 400 Bad Request

**Causes:**
- Missing required fields (e.g., `date`, `hcpcs`)
- Invalid date format (not YYYY-MM-DD)
- Empty procedures array when `is_no_show` is false
- Invalid query parameters

**Client Action:**
- Validate user input before sending request
- Show user-friendly error message
- Don't retry without fixing input

#### 500 Internal Server Error

**Causes:**
- Database connection error
- SQL query error
- Unexpected server-side exception

**Client Action:**
- Show generic error message
- Allow retry with exponential backoff
- Log error for debugging

---

## Data Models

### Visit

```typescript
interface Visit {
  id: string;                    // Visit ID (can be number or string)
  user_id: string;               // Google user ID
  date: string;                  // YYYY-MM-DD
  time: string | null;           // HH:MM:SS (24-hour) or null
  notes: string | null;          // Optional notes
  is_no_show: boolean;           // No-show flag
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  procedures: VisitProcedure[];  // Array of procedures
}
```

### VisitProcedure

```typescript
interface VisitProcedure {
  id: string;                    // Procedure ID (can be number or string)
  visit_id: string;              // Parent visit ID
  hcpcs: string;                 // HCPCS code
  description: string;           // Procedure description
  status_code: string;           // RVU status code
  work_rvu: number;              // Work RVU value (decimal)
  quantity: number;              // Quantity performed (integer)
}
```

### CreateVisitRequest

```typescript
interface CreateVisitRequest {
  date: string;                  // YYYY-MM-DD (required)
  time?: string | null;          // HH:MM:SS (optional)
  notes?: string | null;         // Optional notes
  is_no_show?: boolean;          // Default: false
  procedures: CreateProcedureRequest[];  // Required unless is_no_show
}
```

### CreateProcedureRequest

```typescript
interface CreateProcedureRequest {
  hcpcs: string;                 // HCPCS code (required)
  description: string;           // Procedure description (required)
  status_code: string;           // RVU status code (required)
  work_rvu: number;              // Work RVU value (required)
  quantity: number;              // Quantity (default: 1)
}
```

### Favorite

```typescript
interface Favorite {
  id: number;                    // Favorite ID
  user_id: string;               // Google user ID
  hcpcs: string;                 // HCPCS code
  sort_order: number;            // Display order (0 = first)
  created_at: string;            // ISO 8601 timestamp
}
```

### AnalyticsSummary

```typescript
interface AnalyticsSummary {
  period_start: string;          // Date or timestamp (depends on grouping)
  total_work_rvu: number;        // Sum of work RVU
  total_encounters: number;      // Count of visits with procedures
  total_no_shows: number;        // Count of no-show visits
}
```

### AnalyticsHCPCS

```typescript
interface AnalyticsHCPCS {
  period_start: string;          // Date or timestamp
  hcpcs: string;                 // HCPCS code
  description: string;           // Procedure description
  status_code: string;           // RVU status code
  total_work_rvu: number;        // Sum of (work_rvu × quantity)
  total_quantity: number;        // Sum of quantities
  encounter_count: number;       // Number of uses
}
```

### User

```typescript
interface User {
  id: string;                    // Google user ID
  email: string;                 // User email
  name: string | null;           // User name
  image: string | null;          // Profile image URL
}
```

### AuthResponse

```typescript
interface AuthResponse {
  success: boolean;              // Always true on success
  user: User;                    // User object
  sessionToken: string;          // JWT token (30-day expiration)
  expiresIn: number;             // Expiration in seconds (2592000)
}
```

---

## Example Requests

### Complete Authentication Flow

```typescript
// 1. User signs in with Google
const googleIdToken = await GoogleSignIn.signIn();

// 2. Exchange for session token
const response = await fetch('https://www.trackmyrvu.com/api/auth/mobile/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: googleIdToken })
});

const auth = await response.json();
// auth.sessionToken -> Save to Keychain
```

### Fetch and Display Visits

```typescript
const token = loadFromKeychain('sessionToken');

const response = await fetch('https://www.trackmyrvu.com/api/visits', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const visits = await response.json();
// Display visits in UI
```

### Create Visit with Multiple Procedures

```typescript
const visitData = {
  date: '2026-02-08',
  time: '14:30:00',
  notes: 'Patient follow-up',
  is_no_show: false,
  procedures: [
    {
      hcpcs: '99213',
      description: 'Office visit',
      status_code: 'A',
      work_rvu: 1.3,
      quantity: 1
    },
    {
      hcpcs: '85025',
      description: 'Blood count',
      status_code: 'A',
      work_rvu: 0.17,
      quantity: 1
    }
  ]
};

const response = await fetch('https://www.trackmyrvu.com/api/visits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(visitData)
});

const newVisit = await response.json();
```

### Manage Favorites

```typescript
// Add favorite
await fetch('https://www.trackmyrvu.com/api/favorites', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ hcpcs: '99213' })
});

// Reorder favorites (after drag-and-drop)
await fetch('https://www.trackmyrvu.com/api/favorites', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    favorites: [
      { hcpcs: '99214' },  // Now first (sort_order = 0)
      { hcpcs: '99213' },  // Now second (sort_order = 1)
      { hcpcs: '99215' }   // Now third (sort_order = 2)
    ]
  })
});

// Remove favorite
await fetch('https://www.trackmyrvu.com/api/favorites/99213', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Fetch Analytics

```typescript
// Get daily summary for last 30 days
const start = '2026-01-09';
const end = '2026-02-08';

const response = await fetch(
  `https://www.trackmyrvu.com/api/analytics?start=${start}&end=${end}&period=daily`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const summary = await response.json();

// Calculate total metrics
const totalRVU = summary.reduce((sum, day) => sum + day.total_work_rvu, 0);
const totalEncounters = summary.reduce((sum, day) => sum + day.total_encounters, 0);
const avgRVU = totalRVU / totalEncounters;

// Get HCPCS breakdown
const hcpcsResponse = await fetch(
  `https://www.trackmyrvu.com/api/analytics?start=${start}&end=${end}&groupBy=hcpcs`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const breakdown = await hcpcsResponse.json();
```

---

## Implementation Notes

### Date Handling

**CRITICAL:** All dates use timezone-independent handling.

- **Storage:** Dates stored as `DATE` type (YYYY-MM-DD) in database
- **API Format:** Always send/receive dates as `YYYY-MM-DD` strings
- **iOS Display:** Convert to local timezone only for display purposes
- **Time Field:** Optional, stored as `TIME` type (HH:MM:SS), 24-hour format

**iOS Date Utilities:**

```swift
// Parse date string without timezone shifts
extension Date {
    static func from(dateString: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        formatter.timeZone = TimeZone.current
        return formatter.date(from: dateString)
    }

    var dateString: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        formatter.timeZone = TimeZone.current
        return formatter.string(from: self)
    }
}
```

### Performance Considerations

**Visits Endpoint:**
- Uses `ANY()` array for efficient multi-visit procedure fetching
- Single query to fetch all procedures for all visits
- Average response time: ~50-100ms for 100 visits

**Analytics Endpoint:**
- Uses PostgreSQL `DATE_TRUNC` for period grouping
- Aggregations performed in database (fast)
- Average response time: ~100-200ms for 1 year of data

**Favorites Endpoint:**
- Simple queries, very fast
- No pagination needed (users typically have <20 favorites)

### Error Retry Strategy

**Recommended iOS Retry Logic:**

```swift
func fetchWithRetry<T>(_ request: () async throws -> T) async throws -> T {
    var lastError: Error?

    for attempt in 1...3 {
        do {
            return try await request()
        } catch APIError.tokenExpired {
            // Don't retry auth errors
            throw APIError.tokenExpired
        } catch APIError.server(let status, _) where status >= 500 {
            // Retry server errors with backoff
            lastError = error
            try await Task.sleep(nanoseconds: UInt64(pow(2.0, Double(attempt))) * 1_000_000_000)
        } catch {
            // Don't retry client errors (4xx)
            throw error
        }
    }

    throw lastError ?? APIError.unknown
}
```

### Pagination

**Current Status:** No pagination implemented

**Rationale:**
- Most users have <500 visits
- Modern devices handle this data size easily
- Analytics queries are pre-filtered by date range

**Future Enhancement:** If needed, add pagination to `/api/visits`:
```
GET /api/visits?limit=50&offset=0
```

---

## Testing Recommendations

### Unit Tests

Test these scenarios in iOS unit tests:

1. **Authentication:**
   - Token storage/retrieval from Keychain
   - Token expiration detection
   - Re-authentication flow

2. **API Service:**
   - Request construction (headers, body)
   - Response parsing (JSON decoding)
   - Error handling (401, 500, network errors)
   - Snake_case ↔ CamelCase conversion

3. **Date Utilities:**
   - YYYY-MM-DD string parsing
   - Timezone-independent handling
   - Display formatting

### Integration Tests

Test these scenarios with real backend:

1. **Visits Flow:**
   - Create visit → Verify in GET
   - Update visit → Verify changes
   - Delete visit → Verify removed

2. **Favorites Flow:**
   - Add favorite → Verify in list
   - Reorder → Verify new order
   - Delete → Verify removed

3. **Analytics:**
   - Fetch data → Verify calculations
   - Different periods → Verify grouping

### Manual Testing

Always test these edge cases:

1. **Offline Mode:**
   - Network errors
   - Timeout handling
   - Retry logic

2. **Token Expiration:**
   - 30-day token expiry
   - Re-authentication prompt
   - Token refresh flow

3. **Empty States:**
   - No visits
   - No favorites
   - No analytics data

---

## Support

For API questions or issues:

1. Check this specification
2. Review existing web app implementation in `/src/app/api/`
3. Check database schema in `/scripts/init-db.sql`
4. Review backend CLAUDE.md for conventions

**Backend Repository:** `/Users/ddctu/git/hh/`
**iOS Repository:** `/Users/ddctu/git/track_my_rvu_ios/`
