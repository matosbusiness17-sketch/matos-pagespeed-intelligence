# System Architecture — Matos PageSpeed Intelligence

## 1. Executive Overview

**Matos PageSpeed Intelligence** is a local-first, production-minded performance auditing, monitoring, and diagnostic application. It bridges Google's real PageSpeed Insights API v5 with a persistent SQLite database, structured diagnostic categorization, and an authenticated API designed for future automation workflows (such as n8n orchestration, sales intelligence prospect qualification, and QA auditing).

---

## 2. Layered Architecture

The system enforces strict separation of concerns across three primary architectural tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  - Agency Executive Dashboard (Overview & Summary Cards)               │
│  - Website Management Interface (Add, Edit, Domain, Client Notes)       │
│  - Quick Audit Control Bar (Mobile, Desktop, Sequential Both)          │
│  - Detailed Performance Report & Core Web Vitals Lab Gauge             │
│  - Prioritized Diagnostics & Actionable Recommendations Explorer       │
│  - Historical Scan Timeline & Like-for-Like Comparison Visualizer      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         REST APIs / Server Actions
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       APPLICATION SERVICES LAYER                       │
│  - Scan Orchestrator (`ScanOrchestrator` with in-flight lock map)      │
│  - Result Normalizer (`normalizePageSpeedResponse`, metric scoring)    │
│  - Priority Classification Engine (Critical, High, Medium, Low rules)  │
│  - Like-for-Like Historical Comparison Engine (`computeComparison`)    │
│  - SSRF & URL Validation Engine (`validateAndNormalizeUrl`)           │
│  - Timing-Safe Bearer Token Guard (`validateInternalBearerToken`)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                      Data Access & External HTTP
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                          │
│  - Google PageSpeed Insights API v5 Client (`runPagespeed` endpoint)   │
│  - SQLite Local Database (`better-sqlite3`, WAL mode, foreign keys)    │
│  - Data Repository (`Repository`: websites, scans, aggregations)       │
│  - Offline Fixtures & Test Mode Fallback System                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / n8n Workflow
    participant UI as Dashboard / API Endpoint
    participant Guard as Bearer Guard / URL Validator
    participant Orch as Scan Orchestrator
    participant Client as PageSpeed API Client
    participant Google as Google PageSpeed v5 API
    participant Norm as Normalization & Diagnostic Engine
    participant Repo as SQLite Repository (data/pagespeed.db)

    User->>UI: Request Audit (URL, Strategy)
    UI->>Guard: Validate URL & check SSRF / Bearer Auth
    Guard-->>UI: Normalized URL & Approved

    UI->>Orch: Execute Scan (URL, Strategy)
    Note over Orch: Concurrency lock prevents duplicate in-flight requests

    Orch->>Client: fetchPageSpeedAudit(URL, Strategy)
    Client->>Google: HTTPS GET /runPagespeed?category=performance
    Google-->>Client: Raw Lighthouse & Performance JSON

    Orch->>Norm: normalizePageSpeedResponse(Raw JSON)
    Note over Norm: Extract Score, FCP, LCP, TBT, CLS, SI & Prioritize Opportunities
    Norm-->>Orch: Standardized ScanResult

    Orch->>Repo: Fetch Prior Scan (same normalized URL + strategy)
    Repo-->>Orch: Previous Scan (or null)
    Note over Orch: Compute like-for-like score & metric deltas

    Orch->>Repo: saveScan(ScanResult)
    Repo-->>Orch: Persisted in SQLite

    Orch-->>UI: Return ScanResult + HistoricalComparison
    UI-->>User: Render Dashboard Report / JSON response
```

---

## 4. Storage & SQLite Schema Design

The application utilizes a local, high-performance SQLite database stored by default in `./data/pagespeed.db` (configured via `DATABASE_PATH`).

### Key SQLite Pragmas
- `PRAGMA journal_mode = WAL;` — Write-Ahead Logging allows concurrent readers alongside writers, ensuring zero contention.
- `PRAGMA foreign_keys = ON;` — Enforces relational integrity across websites and scan results.

### Tables & Relationships

#### `websites` Table
Stores tracked client domains and organizational metadata:
- `id` (TEXT PRIMARY KEY): Unique UUID identifier.
- `display_name` (TEXT NOT NULL): Human-friendly name (e.g. "Matos Systems Main Portal").
- `url` (TEXT NOT NULL UNIQUE): Fully normalized target URL.
- `domain` (TEXT NOT NULL): Extracted hostname for grouping and fast lookup.
- `business_name` (TEXT NULL): Client or prospect company name.
- `notes` (TEXT NULL): Internal agency audit notes or campaign tracking.
- `created_at` (TEXT NOT NULL): ISO 8601 timestamp.
- `updated_at` (TEXT NOT NULL): ISO 8601 timestamp.

#### `scans` Table
Stores immutable historical records of every audit run:
- `id` (TEXT PRIMARY KEY): Unique UUID identifier.
- `website_id` (TEXT NULL, FOREIGN KEY REFERENCES websites(id) ON DELETE SET NULL): Associated website ID.
- `requested_url` (TEXT NOT NULL): The exact normalized URL provided for audit.
- `resolved_url` (TEXT NOT NULL): The final landing URL reported by Lighthouse after redirects.
- `strategy` (TEXT NOT NULL CHECK(strategy IN ('mobile', 'desktop'))): Device profile.
- `status` (TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed'))): Audit execution state.
- `performance_score` (REAL NULL): Calculated Lighthouse performance score (0–100).
- `metrics_json` (TEXT NULL): Serialized JSON storing FCP, LCP, TBT, CLS, and Speed Index with unit, score, and lab badges.
- `diagnostics_json` (TEXT NULL): Serialized JSON array of prioritized recommendations with estimated savings.
- `lighthouse_version` (TEXT NULL): Google Lighthouse engine version (e.g. "12.2.1").
- `user_agent` (TEXT NULL): Headless device User-Agent string used during audit.
- `error_message` (TEXT NULL): Redacted error explanation if scan failed.
- `scanned_at` (TEXT NOT NULL): ISO 8601 execution timestamp.

#### Indexes
- `idx_scans_website_id` on `scans(website_id)`
- `idx_scans_url_strategy` on `scans(requested_url, strategy)`
- `idx_scans_scanned_at` on `scans(scanned_at DESC)`
- `idx_websites_url` on `websites(url)`
- `idx_websites_domain` on `websites(domain)`

---

## 5. Security & Privacy Boundaries

### 1. SSRF & Destination Validation
Every input URL is strictly filtered before network transmission:
- Non-HTTP(S) protocols (`file:`, `ftp:`, `javascript:`, `data:`, `gopher:`) are blocked.
- Loopback (`127.0.0.1`, `localhost`, `::1`, `0.0.0.0`) is blocked.
- Private RFC 1918 networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are blocked.
- Cloud metadata endpoints (`169.254.169.254`, `169.254.0.0/16`) are blocked.
- Carrier-Grade NAT (`100.64.0.0/10`) is blocked.
- Internal test TLDs (`.local`, `.internal`, `.lan`, `.test`, `.invalid`) are blocked.
- Embedded URL credentials (`http://user:pass@host`) are strictly rejected.

### 2. Secret Protection & API Key Isolation
- `PAGESPEED_API_KEY` is loaded exclusively server-side via `process.env`.
- No `NEXT_PUBLIC_` prefixes are permitted on sensitive variables.
- All HTTP error logs, error messages, and network exception handlers execute `scrubApiKey()`, ensuring keys never leak into UI toasts, logs, API responses, or JSON error payloads.
- Local configuration is managed through `.env.local` which is permanently excluded by `.gitignore`.

### 3. Timing-Safe Bearer Token Guard
External automation endpoints (`/api/v1/*`) mandate HTTP Bearer Authentication. Tokens are validated using `crypto.timingSafeEqual` over fixed-length UTF-8 buffers to prevent timing side-channel attacks.

### 4. Concurrency & Rate Bounds
An in-memory lock set (`activeScanLocks`) guarantees that duplicate concurrent requests for the exact same URL and strategy cannot trigger simultaneous duplicate Google audits, protecting billing quota and database integrity.

---

## 6. Major Technical Decisions

| Decision | Rationale | Alternatives Considered |
| :--- | :--- | :--- |
| **App Router with Next.js 16** | Native React 19 server/client boundaries, route handlers, and unified TypeScript types without extraneous express servers. | Pages Router, Vite + Express |
| **Native SQLite (`better-sqlite3`)** | Ultra-fast synchronous execution, zero cloud dependencies, standalone single-file database, zero ongoing hosting costs. | PostgreSQL, Supabase (explicitly out of scope for local-first MVP) |
| **Laboratory Simulation vs CrUX Distinction** | Google is deprecating CrUX field metrics within PageSpeed API responses. Lighthouse lab runs are simulated audits under artificial throttling; treating TBT as INP or claiming lab results represent real visitor conversions is scientifically inaccurate. | Aggregating CrUX (violates brief constraints) |
| **Separate Mobile & Desktop Audits** | Google evaluates mobile and desktop independently with different CPU throttling, viewports, and network profiles. Averaging them into one composite number distorts technical findings. | Blended single score (rejected per brief) |
| **Deterministic Rule-Based Diagnostics** | Eliminates LLM latency, token billing, hallucinated performance fixes, and non-reproducible suggestions. Lighthouse audit details provide concrete byte and millisecond measurements. | Generative AI explanations |
