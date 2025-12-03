# Testing Documentation

## Overview

This project uses a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests.

## Test Stack

- **Jest** - Unit and integration testing framework
- **React Testing Library** - Component testing
- **Playwright** - E2E testing (configured but not yet implemented)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests (when implemented)
npm run test:e2e
npm run test:e2e:ui  # With UI
```

## Test Structure

```
src/
├── lib/__tests__/
│   └── dateUtils.test.ts          # Date utility unit tests
└── app/api/__tests__/
    ├── visits.test.ts              # Visits API integration tests
    └── analytics.test.ts           # Analytics API integration tests
```

## Test Coverage

### Unit Tests (dateUtils.test.ts)

**Date Parsing:**
- ✅ Parse YYYY-MM-DD format correctly
- ✅ Parse ISO datetime format correctly
- ✅ Handle dates at year boundaries (Jan 1, Dec 31)
- ✅ Handle leap year dates (Feb 29)
- ✅ No timezone shifts when parsing dates

**Date Formatting:**
- ✅ Format with default options
- ✅ Format with custom options
- ✅ Handle ISO datetime strings
- ✅ Maintain date consistency across formats

**Today's Date:**
- ✅ Return date in YYYY-MM-DD format
- ✅ Return current date
- ✅ Pad single digit months and days with zero

**RVU Calculations:**
- ✅ Calculate total RVU for single procedure
- ✅ Calculate total RVU with quantity multiplier
- ✅ Calculate total RVU for multiple procedures
- ✅ Default to quantity of 1 if not provided
- ✅ Handle zero RVU values
- ✅ Handle empty procedures array
- ✅ Maintain decimal precision

**Date Validation:**
- ✅ Reject invalid date formats
- ✅ Accept valid YYYY-MM-DD format

### Integration Tests (visits.test.ts)

**Date Handling:**
- ✅ Return visits ordered by date DESC
- ✅ Parse visit dates without timezone shifts
- ✅ Maintain date integrity through CRUD operations
- ✅ Handle dates at month boundaries

**RVU Calculations:**
- ✅ Calculate total RVU for visit with multiple procedures
- ✅ Calculate total RVU with quantity multiplier
- ✅ Handle single procedure visits
- ✅ Handle visits with no procedures
- ✅ Maintain decimal precision

**Data Filtering:**
- ✅ Filter visits by date range
- ✅ Filter visits by user ID
- ✅ Handle empty results

**Visit Structure:**
- ✅ Include procedures with visit data
- ✅ Maintain procedure quantity information
- ✅ Include all required visit fields

### Integration Tests (analytics.test.ts)

**Date Grouping:**
- ✅ Group by exact date for daily period
- ✅ No timezone shifts when grouping
- ✅ Maintain date consistency in HCPCS breakdown
- ✅ Sort periods in descending order

**RVU Calculations:**
- ✅ Calculate total RVU correctly per period
- ✅ Sum RVU across all periods
- ✅ Calculate average RVU per entry
- ✅ Calculate HCPCS-specific totals
- ✅ Maintain decimal precision

**Entry Counts:**
- ✅ Count total entries correctly per period
- ✅ Sum entries across all periods
- ✅ Count HCPCS-specific entries

**Period Filtering:**
- ✅ Filter by date range
- ✅ Filter HCPCS breakdown by period
- ✅ Handle empty results for future dates

**Data Structure:**
- ✅ Include all required fields in summary data
- ✅ Include all required fields in breakdown data
- ✅ Maintain data type consistency

**Metric Summaries:**
- ✅ Calculate correct summary statistics
- ✅ Handle single period correctly
- ✅ Handle zero values

## Current Test Results

```
Test Suites: 3 passed, 3 total
Tests:       57 passed, 57 total
Snapshots:   0 total
Time:        ~0.25s
```

## Date Testing Strategy

All date tests ensure **timezone-independent behavior**:

1. **Parsing**: Dates are parsed as local dates, not UTC
2. **Storage**: Dates stored as YYYY-MM-DD (DATE type in DB)
3. **Display**: Dates displayed without timezone conversion
4. **Calculations**: Date grouping uses exact dates (no DATE_TRUNC shifts)

### Critical Date Test Cases

**Database dates:**
- 2025-12-02 → Displays as December 2, 2025 ✅
- 2025-12-01 → Displays as December 1, 2025 ✅
- 2025-11-01 → Displays as November 1, 2025 ✅

**Analytics grouping:**
- Daily: Groups by exact date (2025-12-02 stays 2025-12-02) ✅
- Visits on 12/02 appear under 12/02 (not 12/01 or 12/03) ✅

## Mock Data

Tests use realistic mock data:
- Multiple visits across different dates
- Multiple procedures per visit
- Various RVU values and quantities
- Known calculations for easy verification

## Coverage Goals

- **Unit Tests**: 70% coverage minimum
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user flows (to be implemented)

## Adding New Tests

### Unit Test Template

```typescript
describe('MyFunction', () => {
  it('should handle basic case', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });

  it('should handle edge case', () => {
    const result = myFunction(edgeCase);
    expect(result).toBeDefined();
  });
});
```

### Integration Test Template

```typescript
describe('API Integration', () => {
  const mockData = [/* ... */];

  it('should return correct data structure', () => {
    expect(mockData[0]).toHaveProperty('field1');
    expect(mockData[0]).toHaveProperty('field2');
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Every commit (unit + integration tests)
- Pull requests (full test suite)
- Pre-deployment (including E2E when implemented)

## Next Steps

1. ✅ Unit tests for date utilities
2. ✅ Integration tests for APIs
3. ⏳ Component tests (VisitCard, Analytics)
4. ⏳ E2E tests with Playwright
5. ⏳ Visual regression tests
6. ⏳ Performance tests

## Troubleshooting

**Tests failing with timezone issues?**
- Check that dates are parsed with `parseLocalDate()`
- Verify date strings are in YYYY-MM-DD format
- Ensure no `new Date(str)` calls (use `parseLocalDate()` instead)

**RVU calculations incorrect?**
- Verify quantity multiplier is applied
- Check decimal precision (use `toBeCloseTo()` for floats)
- Ensure procedures array is not empty

**Snapshot tests failing?**
- Run `npm test -- -u` to update snapshots
- Review changes before committing
