# Matos PageSpeed Intelligence

> **Website performance auditing and monitoring toolkit powered by Google PageSpeed Insights, with actionable diagnostics and automation-ready APIs.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg)](https://www.sqlite.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20%26%20Integration-729B1B.svg)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tested-2EAD33.svg)](https://playwright.dev/)

---

## 1. Project Purpose

**Matos PageSpeed Intelligence** is a local-first, production-minded performance auditing and monitoring toolkit built for **Matos Systems**. It automates website speed analysis using Google's real **PageSpeed Insights API v5** and **Lighthouse**, persists audit records locally via **SQLite**, provides prioritized diagnostic recommendations with verifiable estimated savings, and exposes authenticated APIs for future integrations with **n8n workflows**, **Matos Sales Intelligence**, and **Matos CopyCheck**.

---

## 2. Key Features

- **Real Google PageSpeed Insights v5 Integration**: Evaluates public URLs against Google's performance category with automatic mobile and desktop strategy separation.
- **Strict SSRF & URL Validation**: Sanitizes and normalizes all URLs while rejecting private IP ranges (RFC 1918), loopback, cloud metadata endpoints (169.254.169.254), internal TLDs, and credentials.
- **Core Web Vitals & Laboratory Metrics**: Distinctly categorizes Core Web Vitals lab proxies (LCP, CLS) and diagnostic laboratory metrics (FCP, TBT, Speed Index). All measurements represent standardized synthetic laboratory simulations, clearly distinguished from Chrome UX Report (CrUX) field data.
- **Actionable Diagnostic Engine**: Automatically prioritizes performance opportunities (Critical, High, Medium, Low) based on millisecond and byte savings, providing plain-English explanations and concrete remedies.
- **Like-for-Like Historical Comparison**: Automatically compares subsequent scans against prior runs on the exact same normalized URL and device profile.
- **Local SQLite Persistence**: High-performance, zero-config relational storage with WAL mode, foreign key cascades, and zero cloud lock-in.
- **Agency Executive Dashboard**: Clean, professional interface with summary cards, website management, and report explorer without generic AI styling.
- **Automation-Ready Bearer API (`/api/v1/*`)**: Timing-safe Bearer authentication for headless triggers via n8n HTTP Request nodes.

---

## 3. Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, Tailwind CSS v4, Lucide React
- **Language**: TypeScript 5 (Strict Mode)
- **Database**: SQLite with `better-sqlite3` (WAL mode enabled)
- **Testing**: Vitest v5 (Unit & Integration) + Playwright (E2E Browser Automation)
- **Code Quality**: ESLint 9 + TypeScript validation

---

## 4. Getting Started

### Prerequisites
- **Node.js**: v20+ or v24+ (verified on Node v24.14.0)
- **npm**: v10+ or v11+ (verified on npm 11.9.0)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/matosbusiness17-sketch/matos-pagespeed-intelligence.git
cd matos-pagespeed-intelligence
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```ini
# Google PageSpeed Insights API Key (Required for live Google audits)
PAGESPEED_API_KEY=your_google_pagespeed_api_key_here

# Internal Bearer Token for automation endpoints (/api/v1/*)
MATOS_INTERNAL_API_TOKEN=your_secure_internal_token_here

# Local SQLite Database file path
DATABASE_PATH=./data/pagespeed.db
```

> [!NOTE]
> If `PAGESPEED_API_KEY` is not yet configured, the application operates in **Mock Mode** using realistic Lighthouse fixtures so you can test all features offline.

---

## 5. Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000` |
| `npm run build` | Compiles optimized production bundle with Turbopack |
| `npm run start` | Starts the Next.js production server |
| `npm run lint` | Runs ESLint 9 checks |
| `npm run type-check` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `npm test` | Runs the Vitest unit and integration test suite (30 tests) |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:e2e` | Runs Playwright browser tests across Desktop Chromium and Mobile Pixel 7 (16 tests) |
| `npm run verify:live` | Runs live Google PageSpeed API verification script against public target URLs |

---

## 6. Project Architecture & Directories

```
.
├── data/                      # Local SQLite database files (gitignored)
├── docs/
│   ├── architecture.md        # System architecture, data flow, schema, security
│   ├── api-integration.md     # REST API reference, curl examples, n8n guide
│   ├── qa-report.md           # Verification evidence, test counts, security audit
│   └── future-roadmap.md      # Scheduled monitoring, CrUX, Matos ecosystem integrations
├── scripts/
│   └── verify-live-api.ts     # Standalone live Google PageSpeed verification script
├── src/
│   ├── app/                   # App Router pages and API routes
│   │   ├── api/
│   │   │   ├── config-status/ # Environment status checker
│   │   │   ├── scans/         # Internal UI scan routes
│   │   │   ├── summary/       # Dashboard metrics aggregation
│   │   │   ├── v1/            # Automation-ready external REST API
│   │   │   └── websites/      # Website CRUD routes
│   │   ├── globals.css        # Tailwind CSS and theme design tokens
│   │   ├── layout.tsx         # Root application layout
│   │   └── page.tsx           # Agency Dashboard main page
│   ├── components/            # UI Components (Header, Table, Report, Modals)
│   ├── lib/
│   │   ├── auth/              # Timing-safe Bearer token guard
│   │   ├── db/                # SQLite connection, schema, and repository
│   │   ├── pagespeed/         # Google PageSpeed API client, fixtures, normalizer
│   │   ├── services/          # Scan orchestrator and historical comparison
│   │   └── validation/        # URL normalization and SSRF validation
│   └── types/                 # Shared TypeScript interfaces
└── tests/
    ├── e2e/                   # Playwright end-to-end browser specs
    ├── integration/           # Database and API integration tests
    └── unit/                  # URL, normalizer, comparison, and auth tests
```

---

## 7. Automation API Quick Reference

### Trigger Audit (`POST /api/v1/scans`)
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Authorization: Bearer your_secure_internal_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "strategy": "mobile"
  }'
```

For full request/response schemas and n8n HTTP Request node instructions, see [docs/api-integration.md](file:///c:/Users/Admin/OneDrive/Documents/Coding/Matos%20PageSpeed%20Intelligence/docs/api-integration.md).

---

## 8. Known Limitations

1. **Lighthouse Run Variance**: Simulated laboratory performance scores naturally exhibit slight run-to-run variance (±3–5 points) due to network routing, third-party server latency, and CDN caching states.
2. **CrUX Deprecation**: Google is phasing out CrUX data from PageSpeed API v5 responses. All measurements are strictly identified as laboratory simulated tests.
3. **Local-First Architecture**: Designed for single-instance local and server environments using SQLite in WAL mode.

---

## 9. License

Proprietary © 2026 Matos Systems. All rights reserved.
