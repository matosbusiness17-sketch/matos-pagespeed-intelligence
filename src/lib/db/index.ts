import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { CREATE_TABLES_SQL } from './schema';

let dbInstance: DatabaseType | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    if (process.env.DATABASE_PATH === ':memory:') {
      return ':memory:';
    }
    return path.isAbsolute(process.env.DATABASE_PATH)
      ? process.env.DATABASE_PATH
      : path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DATABASE_PATH);
  }
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'data', 'pagespeed.db');
}

export function initializeDatabase(db: DatabaseType, isMemory = false): DatabaseType {
  if (!isMemory) {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  db.exec(CREATE_TABLES_SQL);
  return db;
}

export function getDb(): DatabaseType {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new Database(dbPath);
  initializeDatabase(dbInstance, dbPath === ':memory:');

  return dbInstance;
}

export function createInMemoryDb(): DatabaseType {
  const db = new Database(':memory:');
  return initializeDatabase(db, true);
}

export function closeDb(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore if already closed
    }
    dbInstance = null;
  }
}
