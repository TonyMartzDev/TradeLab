const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'tradelab.db');
const db = new sqlite3.Database(dbPath);

// Promisify database operations
// DEBUG LOGGING FUNCTIONS - DELETE IN PRODUCTION
function logQuery(sql, params) {
  console.log('\n=== DEBUG: SQL QUERY ===');
  console.log('SQL:', sql);
  console.log('Parameters:', params);
  console.log('=====================\n');
}

function logResult(operation, result) {
  console.log('\n=== DEBUG: DATABASE RESULT ===');
  console.log('Operation:', operation);
  console.log('Result:', result);
  console.log('============================\n');
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    // DEBUG - Log the query
    logQuery(sql, params);

    db.run(sql, params, function (err) {
      if (err) {
        console.error('\n=== DEBUG: DATABASE ERROR ===');
        console.error('SQL:', sql);
        console.error('Parameters:', params);
        console.error('Error:', err);
        console.error('==========================\n');
        reject(err);
      } else {
        const result = { id: this.lastID };
        // DEBUG - Log the result
        logResult('INSERT/UPDATE/DELETE', result);
        resolve(result);
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        console.error('\n=== DEBUG: DATABASE ERROR ===');
        console.error('SQL:', sql);
        console.error('Parameters:', params);
        console.error('Error:', err);
        console.error('==========================\n');
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('\n=== DEBUG: DATABASE ERROR ===');
        console.error('SQL:', sql);
        console.error('Parameters:', params);
        console.error('Error:', err);
        console.error('==========================\n');
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Initialize database with tables
async function initializeDatabase() {
  const tradeSql = `
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      market TEXT NOT NULL,
      entryPrice REAL NOT NULL,
      exitPrice REAL,
      quantity INTEGER NOT NULL,
      investment REAL NOT NULL,
      pnl REAL,
      roi REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await run(tradeSql);
    console.log('Database initialized successfully');
    console.log('Database location:', dbPath);
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

module.exports = {
  db,
  run,
  get,
  all,
  initializeDatabase
};
