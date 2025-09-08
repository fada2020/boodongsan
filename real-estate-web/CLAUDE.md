# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development workflow
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint checks
npm run typecheck    # TypeScript type checking
npm run check        # Run all checks (lint + typecheck + build)
npm run test         # Run Vitest tests
npm run test:run     # Run tests once (CI mode)
npm run format       # Format code with Prettier
```

## Architecture Overview

### Core Structure
- **Next.js 14 App Router**: File-based routing with `/app` directory
- **API Routes**: `/app/api/` for server-side endpoints
- **Components**: Reusable UI components in `/components/`
- **Data Layer**: JSON-based location data and API integrations
- **Styling**: Tailwind CSS with custom brand colors

### Key Data Flow Patterns

**Real Estate Transaction API (`/api/transactions`)**:
- Integrates with MOLIT (Ministry of Land, Infrastructure and Transport) API
- Strict mode validation: returns empty array if API key missing/invalid
- Non-strict fallback: uses mock data from `/data/mock-transactions.json`
- Response format: `{ regionCode, name, date, price, aptName, area, floor, buildYear, jibun, roadAddress }`
- Headers include `x-source` (molit|mock|fallback-mock|none|none-error) for data origin tracking

**Lease Transactions (`/api/leases`)**:
- Similar pattern to transactions but for rental properties
- Returns: `{ deposit, monthlyRent, aptName, area, floor, buildYear, jibun, roadAddress, date, name, regionCode }`
- Amounts are in "만원" (10,000 KRW) units

**Ranking System (`lib/ranking.ts`)**:
- `rankRegions()`: Auto-detects latest/previous months from dataset
- `rankRegionsForMonth()`: Explicit month-based ranking for UI consistency
- Scoring algorithm: 60% transaction count MoM + 40% price MoM, normalized to 0-100
- Uses granular region keys (detailed regionCode with suffix when available)

**Location Data (`data/locations.json`)**:
- Hierarchical structure: si (city) → gu (district) → dong (neighborhood)
- Format: `{ code: "11110", name: "서울특별시 종로구", level: "gu" }`
- Used for code-to-name mapping throughout the application

### Environment Variables
```bash
# Required for production
MOLIT_API_KEY=          # MOLIT API key for real estate data
NEWS_RSS_URL=           # Single RSS feed URL
# OR
NEWS_RSS_URLS=          # Multiple RSS feeds (comma/newline separated)

# Optional
NEXT_PUBLIC_MAPBOX_TOKEN=    # For map functionality
NEXT_PUBLIC_BASE_URL=        # Base URL for the application
```

### Testing Strategy
- **Vitest**: Unit testing framework
- **Test files**: `tests/*.test.ts`
- **Coverage**: Focus on core logic (ranking, lease processing, data normalization)

### Key Implementation Notes

**API Error Handling**:
- All APIs support `strict=1` parameter for production-safe behavior
- Warning system via `x-params-warn` headers for invalid parameters
- Graceful degradation with mock data when external APIs fail

**Data Normalization**:
- Resilient field extraction with multiple fallback property names
- Consistent date formatting (YYYY-MM-DD)
- Price/deposit amounts maintained in "만원" units throughout

**UI State Management**:
- Client-side state via React hooks
- Debounced search inputs (`lib/useDebounce.ts`)
- Real-time switching between transaction types (매매/전월세)

### Brand Configuration
- Primary brand color: `#2563eb` (blue-600)
- Tailwind config includes custom `brand` color palette
- Korean language support (`lang="ko"` in layout)