import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
    // Open database in data directory
    const dbPath = path.join(__dirname, '..', '..', 'data', 'tradelab.db');
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');

    // Create users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Create accounts table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS accounts (
            account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    `);

    // Create tracked_accounts table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tracked_accounts (
            tracked_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            tracked_account_name TEXT NOT NULL,
            broker TEXT,
            account_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tracked_accounts_account_id ON tracked_accounts(account_id);
    `);

    // Create trades table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS trades (
            trade_id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracked_account_id INTEGER NOT NULL,
            trade_date DATE NOT NULL,
            ticker_symbol TEXT NOT NULL,
            direction TEXT NOT NULL CHECK (direction IN ('Long', 'Short')),
            entry_price DECIMAL(10, 4) NOT NULL,
            exit_price DECIMAL(10, 4),
            amount DECIMAL(10, 2) NOT NULL,
            investment_amount DECIMAL(10, 2) NOT NULL,
            profit_loss DECIMAL(10, 2),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tracked_account_id) REFERENCES tracked_accounts(tracked_account_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_trades_tracked_account_id ON trades(tracked_account_id);
        CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date);
    `);

    // Create settings table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            setting_name TEXT NOT NULL,
            setting_value TEXT,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
    `);

    // Create some triggers for automatic calculations
    await db.exec(`
        -- Trigger to calculate profit/loss when exit_price is set or updated
        CREATE TRIGGER IF NOT EXISTS calculate_profit_loss_insert
        AFTER INSERT ON trades
        WHEN NEW.exit_price IS NOT NULL
        BEGIN
            UPDATE trades 
            SET profit_loss = CASE 
                WHEN direction = 'Long' THEN (NEW.exit_price - NEW.entry_price) * NEW.amount
                ELSE (NEW.entry_price - NEW.exit_price) * NEW.amount
            END
            WHERE trade_id = NEW.trade_id;
        END;

        CREATE TRIGGER IF NOT EXISTS calculate_profit_loss_update
        AFTER UPDATE OF exit_price ON trades
        WHEN NEW.exit_price IS NOT NULL
        BEGIN
            UPDATE trades 
            SET profit_loss = CASE 
                WHEN direction = 'Long' THEN (NEW.exit_price - NEW.entry_price) * NEW.amount
                ELSE (NEW.entry_price - NEW.exit_price) * NEW.amount
            END
            WHERE trade_id = NEW.trade_id;
        END;
    `);

    console.log('Database initialized successfully!');
    await db.close();
}

// Create test data function
async function createTestData() {
    const db = await open({
        filename: path.join(__dirname, '..', '..', 'data', 'tradelab.db'),
        driver: sqlite3.Database
    });

    // Create a test user
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: '$2a$10$TestHashedPasswordForTesting',
        first_name: 'Test',
        last_name: 'User'
    };

    try {
        // Insert test user
        const userResult = await db.run(
            'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [testUser.username, testUser.email, testUser.password_hash, testUser.first_name, testUser.last_name]
        );
        const userId = userResult.lastID;

        // Create test account
        const accountResult = await db.run(
            'INSERT INTO accounts (user_id, account_name) VALUES (?, ?)',
            [userId, 'Test Trading Account']
        );
        const accountId = accountResult.lastID;

        // Create test tracked account
        const trackedAccountResult = await db.run(
            'INSERT INTO tracked_accounts (account_id, tracked_account_name, broker, account_type) VALUES (?, ?, ?, ?)',
            [accountId, 'Robinhood Options', 'Robinhood', 'Options']
        );
        const trackedAccountId = trackedAccountResult.lastID;

        // Create some test trades
        const testTrades = [
            {
                tracked_account_id: trackedAccountId,
                trade_date: '2025-02-24',
                ticker_symbol: 'AAPL',
                direction: 'Long',
                entry_price: 150.00,
                exit_price: 155.00,
                amount: 100,
                investment_amount: 15000.00
            },
            {
                tracked_account_id: trackedAccountId,
                trade_date: '2025-02-24',
                ticker_symbol: 'TSLA',
                direction: 'Short',
                entry_price: 200.00,
                exit_price: 195.00,
                amount: 50,
                investment_amount: 10000.00
            }
        ];

        for (const trade of testTrades) {
            await db.run(
                `INSERT INTO trades 
                (tracked_account_id, trade_date, ticker_symbol, direction, entry_price, exit_price, amount, investment_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [trade.tracked_account_id, trade.trade_date, trade.ticker_symbol, trade.direction, 
                 trade.entry_price, trade.exit_price, trade.amount, trade.investment_amount]
            );
        }

        // Create some test settings
        const testSettings = [
            {
                user_id: userId,
                setting_name: 'theme',
                setting_value: 'dark'
            },
            {
                user_id: userId,
                setting_name: 'chart_default_timeframe',
                setting_value: '1M'
            }
        ];

        for (const setting of testSettings) {
            await db.run(
                'INSERT INTO settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
                [setting.user_id, setting.setting_name, setting.setting_value]
            );
        }

        console.log('Test data created successfully!');
    } catch (error) {
        console.error('Error creating test data:', error);
    }

    await db.close();
}

// Run the initialization
try {
    await initializeDatabase();
    await createTestData();
} catch (error) {
    console.error('Error initializing database:', error);
}
