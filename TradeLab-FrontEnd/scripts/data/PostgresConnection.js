import pg from 'pg';
import config from './config.js';

class PostgresConnection {
    constructor() {
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = new pg.Pool(config.postgres);
            
            // Test the connection
            try {
                const client = await this.pool.connect();
                await client.release();
            } catch (error) {
                console.error('Failed to connect to PostgreSQL:', error);
                throw error;
            }
        }
        return this.pool;
    }

    async query(text, params) {
        const pool = await this.connect();
        try {
            const result = await pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

// Singleton instance
const postgresConnection = new PostgresConnection();
export default postgresConnection;
