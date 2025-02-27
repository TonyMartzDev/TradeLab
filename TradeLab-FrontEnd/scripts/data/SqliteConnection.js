import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SqliteConnection {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', '..', 'data', 'tradelab.db');
    }

    async connect() {
        if (!this.db) {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });
            await this.db.run('PRAGMA foreign_keys = ON');
        }
        return this.db;
    }

    async query(sql, params = []) {
        const db = await this.connect();
        try {
            if (sql.trim().toLowerCase().startsWith('select')) {
                return await db.all(sql, params);
            } else {
                return await db.run(sql, params);
            }
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const db = await this.connect();
        try {
            await db.run('BEGIN TRANSACTION');
            const result = await callback(db);
            await db.run('COMMIT');
            return result;
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    }

    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

// Create a singleton instance
const sqliteConnection = new SqliteConnection();
export default sqliteConnection;
