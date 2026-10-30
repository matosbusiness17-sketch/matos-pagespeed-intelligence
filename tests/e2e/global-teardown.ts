import fs from 'node:fs';
import path from 'node:path';

export default async function globalTeardown() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const testDbFiles = [
    'pagespeed-test.db',
    'pagespeed-test.db-wal',
    'pagespeed-test.db-shm',
    'pagespeed-test.db-journal',
  ];

  for (const file of testDbFiles) {
    const fullPath = path.join(dataDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // ignore if process is shutting down
      }
    }
  }
}
