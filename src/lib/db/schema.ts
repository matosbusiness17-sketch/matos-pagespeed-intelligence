export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  business_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  website_id TEXT,
  requested_url TEXT NOT NULL,
  resolved_url TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK(strategy IN ('mobile', 'desktop')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  performance_score REAL,
  metrics_json TEXT,
  diagnostics_json TEXT,
  lighthouse_version TEXT,
  user_agent TEXT,
  error_message TEXT,
  scanned_at TEXT NOT NULL,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_website_id ON scans(website_id);
CREATE INDEX IF NOT EXISTS idx_scans_url_strategy ON scans(requested_url, strategy);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_websites_url ON websites(url);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
`;
