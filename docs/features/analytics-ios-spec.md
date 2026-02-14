# Analytics Feature - iOS Replication Spec

## API Endpoints

### Summary Data
```
GET /api/analytics?period={period}&start={YYYY-MM-DD}&end={YYYY-MM-DD}
Authorization: Bearer <jwt_token>
```

**Periods:** `daily`, `weekly`, `monthly`, `yearly`

**Response:**
```json
[
  {
    "period_start": "2026-02-01",
    "total_work_rvu": 12.50,
    "total_encounters": 5,
    "total_no_shows": 1
  }
]
```

### HCPCS Breakdown Data
```
GET /api/analytics?period={period}&start={YYYY-MM-DD}&end={YYYY-MM-DD}&groupBy=hcpcs
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "period_start": "2026-02-01",
    "hcpcs": "99213",
    "description": "Office visit",
    "status_code": "A",
    "total_work_rvu": 3.90,
    "total_quantity": 3,
    "encounter_count": 2
  }
]
```

---

## iOS Screens to Build

### 1. Analytics Main Screen

**Controls (top):**
- Period picker: segmented control with Daily / Weekly / Monthly / Yearly
- Date range: two date pickers (start, end)
- Default: last 30 days, daily period
- When Yearly selected: auto-set Jan 1 - Dec 31 of current year

**View toggle:** Summary | HCPCS Breakdown (segmented control or tab bar)

### 2. Summary View

**Bar Chart:**
- X-axis: period labels (formatted dates)
- Y-axis: RVU values with 5 gridlines (0%, 25%, 50%, 75%, 100% of max)
- Bars: blue gradient, tappable to drill into breakdown for that period
- Line overlay: green trend line connecting bar tops with dot markers
- Horizontal scroll when >5 data points

**Stat Cards (4-column grid on iPad, 2x2 on iPhone):**

| Card | Color | Value | Subtitle |
|------|-------|-------|----------|
| Total RVUs | Blue | `sum(total_work_rvu)` | "Across all periods" |
| Total Encounters | Green | `sum(total_encounters)` | "Procedure records" |
| Total No Shows | Orange | `sum(total_no_shows)` | "Missed appointments" |
| Avg RVU/Encounter | Purple | `total_rvu / total_encounters` | "Efficiency metric" |

### 3. HCPCS Breakdown View

**Table grouped by period:**
- Section header per period: date label + procedure count
- Rows sorted by `total_work_rvu` DESC within each period
- Periods sorted DESC (newest first)

| Column | Alignment | Source |
|--------|-----------|--------|
| HCPCS | Left | `hcpcs` |
| Description | Left, truncated | `description` |
| Count | Right | `total_quantity` |
| Total RVU | Right, bold | `total_work_rvu` |
| Avg RVU | Right | `total_work_rvu / total_quantity` |

**Filtering:** Tapping a bar chart period shows only that period's breakdown. "Show All" clears the filter.

---

## Swift Models

```swift
struct AnalyticsSummary: Codable {
    let periodStart: String
    let totalWorkRvu: Double
    let totalEncounters: Int
    let totalNoShows: Int
}

struct AnalyticsBreakdown: Codable {
    let periodStart: String
    let hcpcs: String
    let description: String
    let statusCode: String
    let totalWorkRvu: Double
    let totalQuantity: Int
    let encounterCount: Int
}
```

Note: API returns `snake_case`. Use `JSONDecoder` with `.convertFromSnakeCase` key decoding strategy.

---

## Date Formatting (iOS)

```swift
func formatPeriod(_ dateStr: String, period: String) -> String {
    let dateOnly = String(dateStr.prefix(10)) // "YYYY-MM-DD"
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    guard let date = formatter.date(from: dateOnly) else { return dateStr }

    switch period {
    case "yearly":
        return String(dateStr.prefix(4))
    case "monthly":
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: date)
    case "weekly":
        formatter.dateStyle = .short
        return "Week of \(formatter.string(from: date))"
    default: // daily
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
}
```

---

## Computed Metrics (Client-Side)

```swift
let totalRVU = summaryData.reduce(0) { $0 + $1.totalWorkRvu }
let totalEncounters = summaryData.reduce(0) { $0 + $1.totalEncounters }
let totalNoShows = summaryData.reduce(0) { $0 + $1.totalNoShows }
let avgRVU = totalEncounters > 0 ? totalRVU / Double(totalEncounters) : 0.0
```

---

## States to Handle

- **Loading:** Spinner while fetching
- **Empty:** "No data available for the selected period"
- **Unauthenticated:** Redirect to sign-in
- **Error:** Show error message, allow retry
- **Cancellation:** Ignore `NSURLErrorDomain -999`; use `.task {}` modifier for auto-cancellation on view dismiss

---

## Network Tips

- Both summary and breakdown are separate API calls; fetch in parallel
- Deduplicate requests if period/dates haven't changed
- Don't refetch on every `onAppear`; cache results locally
- Parse numeric fields explicitly (`total_work_rvu` may come as string from Postgres)
