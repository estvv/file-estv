import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(__dirname, '../../data/transfer.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      original_name TEXT NOT NULL,
      filepath TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      downloads INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_slug ON files(slug);
    CREATE INDEX IF NOT EXISTS idx_expires_at ON files(expires_at);
  `);
  
  console.log('Database initialized');
}

export interface FileRecord {
  id: number;
  slug: string;
  original_name: string;
  filepath: string;
  size: number;
  mime_type: string;
  downloads: number;
  created_at: string;
  expires_at: string;
}

export function createFile(
  slug: string,
  originalName: string,
  filepath: string,
  size: number,
  mimeType: string,
  expiresAt: Date
): FileRecord {
  const stmt = db.prepare(`
    INSERT INTO files (slug, original_name, filepath, size, mime_type, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(slug, originalName, filepath, size, mimeType, expiresAt.toISOString());
  
  return getFileById(result.lastInsertRowid as number)!;
}

export function getFileById(id: number): FileRecord | undefined {
  return db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileRecord | undefined;
}

export function getFileBySlug(slug: string): FileRecord | undefined {
  return db.prepare('SELECT * FROM files WHERE slug = ?').get(slug) as FileRecord | undefined;
}

export function incrementDownloads(slug: string): void {
  db.prepare('UPDATE files SET downloads = downloads + 1 WHERE slug = ?').run(slug);
}

export function deleteFile(slug: string): void {
  const file = getFileBySlug(slug);
  if (file) {
    try {
      fs.unlinkSync(file.filepath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    db.prepare('DELETE FROM files WHERE slug = ?').run(slug);
  }
}

export function cleanupExpiredFiles(): void {
  const now = new Date().toISOString();
  const expiredFiles = db.prepare('SELECT * FROM files WHERE expires_at < ?').all(now) as FileRecord[];
  
  expiredFiles.forEach(file => {
    try {
      fs.unlinkSync(file.filepath);
    } catch (error) {
      console.error('Failed to delete expired file:', error);
    }
  });
  
  db.prepare('DELETE FROM files WHERE expires_at < ?').run(now);
  console.log(`Cleaned up ${expiredFiles.length} expired files`);
}