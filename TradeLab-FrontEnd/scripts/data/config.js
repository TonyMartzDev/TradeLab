/**
 * Database configuration and settings
 */
const config = {
    indexedDB: {
        name: 'TradeLabDB',
        version: 1,
        stores: {
            trades: {
                keyPath: 'trade_id',
                indexes: [
                    { name: 'tracked_account_id', keyPath: 'tracked_account_id', unique: false },
                    { name: 'trade_date', keyPath: 'trade_date', unique: false },
                    { name: 'ticker_symbol', keyPath: 'ticker_symbol', unique: false }
                ]
            },
            users: {
                keyPath: 'user_id',
                indexes: [
                    { name: 'username', keyPath: 'username', unique: true },
                    { name: 'email', keyPath: 'email', unique: true }
                ]
            },
            accounts: {
                keyPath: 'account_id',
                indexes: [
                    { name: 'user_id', keyPath: 'user_id', unique: false }
                ]
            },
            tracked_accounts: {
                keyPath: 'tracked_account_id',
                indexes: [
                    { name: 'account_id', keyPath: 'account_id', unique: false }
                ]
            },
            settings: {
                keyPath: 'setting_id',
                indexes: [
                    { name: 'user_id', keyPath: 'user_id', unique: false }
                ]
            }
        }
    },
    postgres: {
        // These should be loaded from environment variables in production
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'tradelab',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true'
    }
};

export default config;
