import initSqlJs from 'sql.js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tasksphere.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isPg = false;
let pgPool = null;
let sqliteDb = null;

export async function initDb() {
  if (process.env.DATABASE_URL) {
    try {
      console.log('Attempting PostgreSQL connection...');
      pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
      });
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      isPg = true;
      console.log('Connected to PostgreSQL database successfully.');
    } catch (err) {
      console.warn('PostgreSQL connection failed. Falling back to high-performance local SQLite database:', err.message);
      isPg = false;
    }
  }

  if (!isPg) {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log(`Loaded existing local database from ${DB_FILE}`);
    } else {
      sqliteDb = new SQL.Database();
      console.log('Created fresh local database.');
    }
  }

  await createTables();
}

function saveSqlite() {
  if (!isPg && sqliteDb) {
    try {
      const data = sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (e) {
      console.error('Failed to persist SQLite database:', e);
    }
  }
}

async function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      logo_url TEXT,
      industry TEXT DEFAULT 'Technology',
      country TEXT DEFAULT 'Indonesia',
      timezone TEXT DEFAULT 'Asia/Jakarta',
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'PLATFORM_OWNER' | 'COMPANY_ADMIN' | 'EMPLOYEE'
      job_title TEXT,
      avatar_url TEXT,
      phone TEXT,
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'Asia/Jakarta',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
      status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'in_review', 'completed', 'blocked'
      due_date TEXT,
      target_scope TEXT DEFAULT 'single', -- 'single', 'multiple', 'all'
      category TEXT DEFAULT 'General',
      estimated_hours REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'in_review', 'completed', 'blocked'
      progress_percent INTEGER DEFAULT 0,
      notes TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      task_id TEXT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      work_done TEXT,
      blockers TEXT,
      hours_spent REAL DEFAULT 0,
      status TEXT DEFAULT 'submitted', -- 'submitted', 'reviewed', 'approved', 'revision_requested'
      admin_feedback TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      user_id TEXT, -- null means all employees in this company
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      due_date TEXT,
      priority TEXT DEFAULT 'info', -- 'info', 'warning', 'urgent'
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL, -- 'task', 'report', 'company', 'user', 'reminder', 'auth'
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `;

  if (isPg) {
    await pgPool.query(schema);
  } else {
    sqliteDb.run(schema);
    saveSqlite();
  }
}

/**
 * Universal query helper
 * Accepts SQL queries and parameter array.
 * Converts parameter placeholders ($1, $2) to ? if using SQLite, or keeps $1, $2 for Postgres.
 */
export async function query(sqlText, params = []) {
  if (isPg) {
    // If query has '?' syntax, convert to $1, $2, ...
    let paramIndex = 1;
    const pgSql = sqlText.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await pgPool.query(pgSql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } else {
    // SQLite mode
    // If query has '$1, $2' syntax, convert to '?'
    const sqliteSql = sqlText.replace(/\$\d+/g, '?');
    
    const trimmed = sqliteSql.trim();
    const isSelect = /^SELECT|^PRAGMA|^EXPLAIN/i.test(trimmed);

    if (isSelect) {
      const stmt = sqliteDb.prepare(sqliteSql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows, rowCount: rows.length };
    } else {
      // INSERT, UPDATE, DELETE, CREATE
      sqliteDb.run(sqliteSql, params);
      saveSqlite();
      return { rows: [], rowCount: 1 };
    }
  }
}

export async function logActivity(companyId, userId, action, entityType, entityId = null, details = '') {
  try {
    const id = 'act_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const now = new Date().toISOString();
    await query(
      `INSERT INTO activity_logs (id, company_id, user_id, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, userId, action, entityType, entityId, details, now]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export function isPostgres() {
  return isPg;
}
