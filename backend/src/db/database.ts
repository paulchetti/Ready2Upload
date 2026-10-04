import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { SCHEMA_SQL } from './schema';

export class AppDatabase {
  private db: Database | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor(dbPath: string = path.resolve(process.cwd(), 'production.db')) {
    this.dbPath = dbPath;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;

    const SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    // Execute schema migrations
    this.db.run(SCHEMA_SQL);

    // Apply incremental column migrations for existing scenes table
    const newColumns = [
      'visual_directive_json TEXT',
      'structured_prompt_json TEXT',
      'animation_type TEXT',
      'sound_effects_json TEXT',
      'music_intensity TEXT',
      'character_id TEXT',
      'location_id TEXT',
      'object_id TEXT',
      'style_id TEXT'
    ];
    for (const colDef of newColumns) {
      try {
        this.db.run(`ALTER TABLE scenes ADD COLUMN ${colDef}`);
      } catch (_e) {
        // Column may already exist
      }
    }

    this.save();
    this.isInitialized = true;
  }

  public getRawDb(): Database {
    if (!this.db) {
      throw new Error('Database is not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public save(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  public run(sql: string, params: SqlValue[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
    this.save();
  }

  public get<T>(sql: string, params: SqlValue[] = []): T | undefined {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject() as unknown as T;
        return row;
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  public all<T>(sql: string, params: SqlValue[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    const results: T[] = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      return results;
    } finally {
      stmt.free();
    }
  }
}

export const appDatabase = new AppDatabase();
