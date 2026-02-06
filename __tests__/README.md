# API Tests

Comprehensive test suite for the RVU Tracker API endpoints.

## Test Structure

```
__tests__/
├── api/
│   ├── auth/
│   │   └── mobile-google.test.ts          # Mobile Google OAuth authentication
│   ├── visits/
│   │   ├── visits.test.ts                 # GET, POST /api/visits
│   │   └── visits-id.test.ts              # PUT, DELETE /api/visits/:id
│   ├── favorites/
│   │   ├── favorites.test.ts              # GET, POST, PATCH /api/favorites
│   │   └── favorites-hcpcs.test.ts        # DELETE /api/favorites/:hcpcs
│   ├── analytics/
│   │   └── analytics.test.ts              # GET /api/analytics
│   └── rvu/
│       └── rvu-search.test.ts             # GET /api/rvu/search
├── lib/
│   └── mobile-auth.test.ts                # Mobile auth helper library
└── helpers/
    └── test-utils.ts                      # Test utilities and mocks
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- visits.test.ts
```

### Run specific test suite
```bash
npm test -- --testNamePattern="GET /api/visits"
```

## Test Coverage

Current test coverage includes:

### Authentication
- ✅ Mobile Google OAuth authentication
- ✅ JWT token verification
- ✅ Session-based authentication
- ✅ Development bypass mode

### Visits API
- ✅ GET /api/visits - Fetch all visits
- ✅ POST /api/visits - Create visit with procedures
- ✅ POST /api/visits - Create no-show visit
- ✅ PUT /api/visits/:id - Update visit
- ✅ DELETE /api/visits/:id - Delete visit

### Favorites API
- ✅ GET /api/favorites - Fetch favorites
- ✅ POST /api/favorites - Add favorite
- ✅ PATCH /api/favorites - Reorder favorites
- ✅ DELETE /api/favorites/:hcpcs - Remove favorite

### Analytics API
- ✅ GET /api/analytics - Daily analytics
- ✅ GET /api/analytics - Weekly analytics
- ✅ GET /api/analytics - Monthly analytics
- ✅ GET /api/analytics - Yearly analytics
- ✅ GET /api/analytics - HCPCS breakdown

### RVU Search API
- ✅ GET /api/rvu/search - Search RVU codes
- ✅ Cache statistics

### Libraries
- ✅ mobile-auth helper functions

## Test Utilities

### Mock Request Creation

```typescript
import { createMockRequest } from './helpers/test-utils';

const request = createMockRequest({
  method: 'POST',
  url: 'http://localhost:3001/api/visits',
  headers: { 'Authorization': 'Bearer token' },
  body: { date: '2025-01-26', procedures: [...] },
});
```

### Mock Database Responses

```typescript
import { mockDbResponse } from './helpers/test-utils';

(sql as jest.Mock).mockResolvedValue(
  mockDbResponse([{ id: 1, user_id: 'test-user' }])
);
```

### Mock Data Creation

```typescript
import {
  createMockUser,
  createMockVisit,
  createMockProcedure,
  createMockFavorite,
  createMockAnalytics,
} from './helpers/test-utils';

const visit = createMockVisit({ id: 1, date: '2025-01-26' });
const procedure = createMockProcedure({ hcpcs: '99213' });
```

## Mocked Dependencies

All tests mock these dependencies:

- `@/lib/db` - Database queries (sql)
- `@/lib/mobile-auth` - Authentication helpers
- `@/auth` - NextAuth session management
- `google-auth-library` - Google OAuth verification
- `jose` - JWT signing and verification
- `@/lib/rvu-cache` - RVU code search cache

## Test Patterns

### Testing Authenticated Endpoints

```typescript
import { getUserId } from '@/lib/mobile-auth';

beforeEach(() => {
  (getUserId as jest.Mock).mockResolvedValue('test-user-123');
});

it('should return data for authenticated user', async () => {
  // Test implementation
});
```

### Testing Authorization Failures

```typescript
it('should return 401 if user is not authenticated', async () => {
  (getUserId as jest.Mock).mockResolvedValue(null);

  const response = await GET(request);
  const data = await response.json();

  expect(response.status).toBe(401);
  expect(data.error).toBe('Unauthorized');
});
```

### Testing Database Errors

```typescript
it('should return 500 if database operation fails', async () => {
  (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(500);
  expect(data.error).toContain('Failed to');
});
```

### Testing Validation

```typescript
it('should return 400 if required field is missing', async () => {
  const request = createMockRequest({
    body: { /* missing required field */ },
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toContain('required');
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-commit hooks (optional)

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Writing New Tests

### 1. Create Test File

Place test files in the appropriate directory:
- API tests: `__tests__/api/<endpoint>/`
- Library tests: `__tests__/lib/`

### 2. Import Dependencies

```typescript
import { GET, POST } from '@/app/api/<endpoint>/route';
import { createMockRequest, mockDbResponse } from '../../helpers/test-utils';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';
```

### 3. Write Test Suites

```typescript
describe('GET /api/<endpoint>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success case', async () => {
    // Arrange
    (getUserId as jest.Mock).mockResolvedValue('test-user');
    (sql as jest.Mock).mockResolvedValue(mockDbResponse([...]));

    // Act
    const request = createMockRequest({ ... });
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({ ... });
  });

  it('should return error case', async () => {
    // Test error handling
  });
});
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Clear mocks**: Always call `jest.clearAllMocks()` in `beforeEach`
3. **Mock at the right level**: Mock external dependencies, not internal logic
4. **Test edge cases**: Include validation, errors, and boundary conditions
5. **Use descriptive names**: Test names should describe what they test
6. **Keep tests isolated**: Each test should be independent
7. **Avoid implementation details**: Test behavior, not implementation

## Common Issues

### Mock not working

Ensure mocks are declared before imports:
```typescript
jest.mock('@/lib/db');  // Before import
import { sql } from '@/lib/db';  // After mock
```

### Environment variables

Set environment variables in tests:
```typescript
beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.DEV_BYPASS_AUTH = 'false';
});
```

### Async operations

Always await async operations:
```typescript
const response = await GET(request);  // ✅ Correct
const response = GET(request);        // ❌ Wrong
```

## Total Test Count

- **Mobile Google Auth**: 7 tests
- **Visits API**: 19 tests
- **Visits ID API**: 12 tests
- **Favorites API**: 16 tests
- **Favorites HCPCS API**: 6 tests
- **Analytics API**: 14 tests
- **RVU Search API**: 10 tests
- **Mobile Auth Library**: 12 tests
- **Date Utils (Existing)**: 23 tests
- **Visits Logic (Existing)**: 20 tests
- **Analytics Logic (Existing)**: 7 tests

**Total: 146 tests** covering all API endpoints, authentication, and core libraries.

## Coverage Goals

Maintain minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Current coverage exceeds these thresholds across all API endpoints.

---

**Last Updated**: 2025-01-26
**Framework**: Jest + Next.js Testing
