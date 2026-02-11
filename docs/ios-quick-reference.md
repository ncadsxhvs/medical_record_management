# iOS API Quick Reference

**Base URL:** `https://www.trackmyrvu.com/api`

---

## Authentication

### Get Session Token
```
POST /api/auth/mobile/google
```
**Body:**
```json
{
  "idToken": "<google-id-token>"
}
```
**Response:**
```json
{
  "sessionToken": "eyJhbGciOiJIUzI1...",
  "expiresIn": 2592000,
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

---

## Favorites API

### Get All Favorites
```
GET /api/favorites
Authorization: Bearer <token>
```
**Response:**
```json
[
  {
    "id": 1,
    "user_id": "...",
    "hcpcs": "99213",
    "sort_order": 0,
    "created_at": "2026-02-01T10:00:00.000Z"
  }
]
```

### Add Favorite
```
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "hcpcs": "99213"
}
```
**Response:** `201 Created` with favorite object

### Remove Favorite
```
DELETE /api/favorites/{hcpcs}
Authorization: Bearer <token>
```
**Response:** `200 OK` with `{ "message": "..." }`

### Reorder Favorites
```
PATCH /api/favorites
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "favorites": [
    { "hcpcs": "99214" },
    { "hcpcs": "99213" },
    { "hcpcs": "99215" }
  ]
}
```
**Response:** `200 OK` with `{ "success": true }`

**Note:** Array order determines `sort_order` (0, 1, 2, ...)

---

## Analytics API

### Get Summary Data
```
GET /api/analytics?start=2026-02-01&end=2026-02-08&period=daily
Authorization: Bearer <token>
```
**Query Params:**
- `start` (required): Start date (YYYY-MM-DD)
- `end` (required): End date (YYYY-MM-DD)
- `period` (optional): `daily`, `weekly`, `monthly`, `yearly` (default: `daily`)

**Response:**
```json
[
  {
    "period_start": "2026-02-08",
    "total_work_rvu": 4.52,
    "total_encounters": 2,
    "total_no_shows": 0
  }
]
```

### Get HCPCS Breakdown
```
GET /api/analytics?start=2026-02-01&end=2026-02-08&groupBy=hcpcs
Authorization: Bearer <token>
```
**Query Params:**
- `start` (required): Start date (YYYY-MM-DD)
- `end` (required): End date (YYYY-MM-DD)
- `period` (optional): `daily`, `weekly`, `monthly`, `yearly`
- `groupBy` (required): `hcpcs`

**Response:**
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
  }
]
```

---

## Visits API (Already Implemented)

### Get Visits
```
GET /api/visits
Authorization: Bearer <token>
```

### Create Visit
```
POST /api/visits
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "date": "2026-02-08",
  "time": "14:30:00",
  "notes": "...",
  "is_no_show": false,
  "procedures": [
    {
      "hcpcs": "99213",
      "description": "Office visit",
      "status_code": "A",
      "work_rvu": 1.3,
      "quantity": 1
    }
  ]
}
```

### Update Visit
```
PUT /api/visits/{id}
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:** Same as create visit

### Delete Visit
```
DELETE /api/visits/{id}
Authorization: Bearer <token>
```

---

## Error Responses

All errors return:
```json
{
  "error": "Human-readable error message"
}
```

**Status Codes:**
- `200/201` - Success
- `400` - Bad request (missing fields, validation error)
- `401` - Unauthorized (invalid/expired token)
- `404` - Not found
- `500` - Server error

---

## iOS Swift Example

```swift
actor APIService {
    private let baseURL = URL(string: "https://www.trackmyrvu.com/api")!

    // Get favorites
    func fetchFavorites() async throws -> [Favorite] {
        let url = baseURL.appending(path: "favorites")
        let request = try await makeAuthenticatedRequest(url: url)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode([Favorite].self, from: data)
    }

    // Add favorite
    func addFavorite(hcpcs: String) async throws -> Favorite {
        let url = baseURL.appending(path: "favorites")
        let body = try JSONEncoder().encode(["hcpcs": hcpcs])
        let request = try await makeAuthenticatedRequest(url: url, method: "POST", body: body)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(Favorite.self, from: data)
    }

    // Reorder favorites
    func reorderFavorites(_ hcpcsCodes: [String]) async throws {
        let url = baseURL.appending(path: "favorites")
        let favorites = hcpcsCodes.map { ["hcpcs": $0] }
        let body = try JSONEncoder().encode(["favorites": favorites])
        let request = try await makeAuthenticatedRequest(url: url, method: "PATCH", body: body)
        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
    }

    // Fetch analytics
    func fetchAnalytics(start: String, end: String, period: String = "daily") async throws -> [AnalyticsSummary] {
        var components = URLComponents(url: baseURL.appending(path: "analytics"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "start", value: start),
            URLQueryItem(name: "end", value: end),
            URLQueryItem(name: "period", value: period)
        ]

        let request = try await makeAuthenticatedRequest(url: components.url!)
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode([AnalyticsSummary].self, from: data)
    }
}
```

---

## Data Models

```swift
struct Favorite: Codable {
    let id: Int
    let userId: String
    let hcpcs: String
    let sortOrder: Int
    let createdAt: Date
}

struct AnalyticsSummary: Codable {
    let periodStart: String
    let totalWorkRvu: Double
    let totalEncounters: Int
    let totalNoShows: Int
}

struct AnalyticsHCPCS: Codable {
    let periodStart: String
    let hcpcs: String
    let description: String
    let statusCode: String
    let totalWorkRvu: Double
    let totalQuantity: Int
    let encounterCount: Int
}
```

---

## Testing with curl

```bash
# Set your token
TOKEN="your-session-token-here"

# Test favorites
curl -H "Authorization: Bearer $TOKEN" \
  https://www.trackmyrvu.com/api/favorites

# Test analytics
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.trackmyrvu.com/api/analytics?start=2026-02-01&end=2026-02-08&period=daily"
```

---

## Documentation

**Full Specification:** `/docs/ios-api-specification.md`
**API Status:** `/docs/ios-api-status.md`
**OpenAPI Spec:** `https://www.trackmyrvu.com/api-docs`
