# RVU Tracker API Documentation

This directory contains the OpenAPI 3.0 (Swagger) specification for the RVU Tracker API.

## Files

- **openapi.yaml** - Complete OpenAPI 3.0 specification
- **api-docs.html** - Interactive Swagger UI viewer

## Viewing the Documentation

### Option 1: Production Site (Recommended)

Visit the live API documentation:

**🌐 https://trackmyrvu.com/api-docs**

This provides an interactive Swagger UI interface where you can:
- Browse all API endpoints
- View request/response schemas
- Try out API calls (with authentication)
- Download the OpenAPI spec

### Option 2: Local Development

When running the dev server (`npm run dev`), access at:

**http://localhost:3001/api-docs**

### Option 3: Standalone HTML Viewer

Open the standalone HTML file in your browser:

```bash
# From the project root
open docs/api-docs.html
```

Or serve it with a simple HTTP server:

```bash
cd docs
python3 -m http.server 8080
# Then open: http://localhost:8080/api-docs.html
```

### Option 4: Online Swagger Editor

1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Upload or paste the contents of `openapi.yaml`

### Option 5: VS Code

Install the "OpenAPI (Swagger) Editor" extension and open `openapi.yaml`.

## API Overview

### Base URLs

- **Development:** `http://localhost:3001`
- **Production:** `https://trackmyrvu.com`

### Authentication

All endpoints (except `/api/auth/mobile/google`) require authentication:

- **Web:** Next-Auth session cookie (`next-auth.session-token`)
- **Mobile:** Bearer token in Authorization header

**Example mobile request:**
```bash
curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  https://trackmyrvu.com/api/visits
```

### Endpoints

#### Visits (`/api/visits`)
- `GET /api/visits` - List all visits
- `POST /api/visits` - Create a new visit
- `PUT /api/visits/{id}` - Update a visit
- `DELETE /api/visits/{id}` - Delete a visit

#### Favorites (`/api/favorites`)
- `GET /api/favorites` - List favorites
- `POST /api/favorites` - Add favorite
- `PATCH /api/favorites` - Reorder favorites (drag-and-drop)
- `DELETE /api/favorites/{hcpcs}` - Remove favorite

#### RVU Search (`/api/rvu/search`)
- `GET /api/rvu/search?q={query}` - Search HCPCS codes

#### Analytics (`/api/analytics`)
- `GET /api/analytics?start={date}&end={date}&period={period}&groupBy={groupBy}` - Get analytics data

#### Mobile Auth (`/api/auth/mobile/google`)
- `POST /api/auth/mobile/google` - Authenticate mobile app with Google ID token

## Key Features

### Multi-Procedure Visits

Visits can contain multiple procedures with quantities:

```json
{
  "date": "2025-12-15",
  "time": "14:30:00",
  "notes": "Annual physical",
  "procedures": [
    {
      "hcpcs": "99213",
      "description": "Office visit",
      "status_code": "A",
      "work_rvu": 1.3,
      "quantity": 1
    },
    {
      "hcpcs": "80053",
      "description": "Comprehensive metabolic panel",
      "status_code": "A",
      "work_rvu": 0.17,
      "quantity": 1
    }
  ]
}
```

### No-Show Tracking

Create no-show encounters without procedures:

```json
{
  "date": "2025-12-15",
  "time": "09:00:00",
  "notes": "Patient did not arrive",
  "is_no_show": true,
  "procedures": []
}
```

### Drag-and-Drop Favorites

Reorder favorites by sending complete list in desired order:

```json
{
  "favorites": [
    { "hcpcs": "99214" },
    { "hcpcs": "99213" },
    { "hcpcs": "80053" }
  ]
}
```

### Analytics Grouping

Get analytics with different time periods and optional HCPCS breakdown:

```
# Summary by month
GET /api/analytics?start=2025-01-01&end=2025-12-31&period=monthly

# HCPCS breakdown by week
GET /api/analytics?start=2025-01-01&end=2025-12-31&period=weekly&groupBy=hcpcs
```

## Testing the API

### Using curl

```bash
# Search for RVU codes (no auth required)
curl "http://localhost:3001/api/rvu/search?q=99213"

# Get visits (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/visits"

# Create a visit
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "procedures": [{
      "hcpcs": "99213",
      "description": "Office visit",
      "status_code": "A",
      "work_rvu": 1.3,
      "quantity": 1
    }]
  }' \
  "http://localhost:3001/api/visits"
```

### Using the Swagger UI

1. Open `api-docs.html` in your browser
2. Click "Authorize" and enter your session token
3. Expand any endpoint and click "Try it out"
4. Fill in parameters and click "Execute"

## Mobile Authentication Flow

For iOS/Android apps:

1. **Get Google ID Token** - Use Google Sign-In SDK in your mobile app
2. **Send to Auth Endpoint:**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}' \
     https://trackmyrvu.com/api/auth/mobile/google
   ```
3. **Receive Session Token:**
   ```json
   {
     "success": true,
     "user": {
       "id": "114857394850183928465",
       "email": "user@example.com",
       "name": "John Doe"
     },
     "sessionToken": "eyJhbGciOiJIUzI1NiJ9...",
     "expiresIn": 2592000
   }
   ```
4. **Use Session Token** - Include in Authorization header for all API requests:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   ```

## Response Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `404 Not Found` - Resource not found or unauthorized
- `500 Internal Server Error` - Server error

## Cache Headers

The RVU search endpoint returns cache statistics in response headers:

- `X-Cache-Total` - Total number of RVU codes in cache
- `X-Cache-Age` - Cache age in milliseconds

## Support

For questions or issues with the API, please refer to the main project documentation in `CLAUDE.md`.
