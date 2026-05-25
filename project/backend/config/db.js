const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = path.resolve(process.env.DB_PATH || './database.sqlite');

class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  async init() {
    this.SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }

    // Enable WAL-like behavior via pragma
    this.db.run('PRAGMA journal_mode = MEMORY');
    this.db.run('PRAGMA foreign_keys = ON');

    await this.createTables();
    this.save();
    console.log(`✅ SQLite database initialized at ${DB_PATH}`);
    return this;
  }

  save() {
    const data = this.db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  run(sql, params = []) {
    try {
      this.db.run(sql, params);
      // Get last inserted rowid BEFORE saving
      const res = this.db.exec('SELECT last_insert_rowid() as id');
      const lastId = res[0] ? res[0].values[0][0] : null;
      this.save();
      return lastId;
    } catch (err) {
      throw new Error(`DB run error: ${err.message}\nSQL: ${sql}`);
    }
  }

  // Internal run used inside transactions - skips auto-save
  _run(sql, params = []) {
    this.db.run(sql, params);
    const res = this.db.exec('SELECT last_insert_rowid() as id');
    return res[0] ? res[0].values[0][0] : null;
  }

  all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (err) {
      throw new Error(`DB all error: ${err.message}\nSQL: ${sql}`);
    }
  }

  get(sql, params = []) {
    const rows = this.all(sql, params);
    return rows[0] || null;
  }

  exec(sql) {
    try {
      this.db.exec(sql);
      this.save();
    } catch (err) {
      throw new Error(`DB exec error: ${err.message}`);
    }
  }

  // Transaction helper - passes a proxy that uses _run (no auto-save per statement)
  transaction(fn) {
    this.db.run('BEGIN TRANSACTION');
    const proxy = {
      run: (sql, params) => this._run(sql, params),
      get: (sql, params) => this.get(sql, params),
      all: (sql, params) => this.all(sql, params),
    };
    try {
      const result = fn(proxy);
      this.db.run('COMMIT');
      this.save();
      return result;
    } catch (err) {
      try { this.db.run('ROLLBACK'); } catch (_) { /* already rolled back */ }
      throw err;
    }
  }

  async createTables() {
    const tables = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','customer','waiter','chef')) DEFAULT 'customer',
        createdAt TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tables_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tableNumber INTEGER UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('available','occupied','reserved')) DEFAULT 'available'
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        availability INTEGER NOT NULL DEFAULT 1,
        image TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        tableId INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('received','preparing','ready','completed')) DEFAULT 'received',
        waiterId INTEGER,
        totalAmount REAL DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customerId) REFERENCES users(id),
        FOREIGN KEY (tableId) REFERENCES tables_info(id),
        FOREIGN KEY (waiterId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        menuItemId INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        itemPrice REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (menuItemId) REFERENCES menu_items(id)
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        tableId INTEGER NOT NULL,
        reservationTime TEXT NOT NULL,
        guestsCount INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','confirmed','cancelled')) DEFAULT 'pending',
        FOREIGN KEY (customerId) REFERENCES users(id),
        FOREIGN KEY (tableId) REFERENCES tables_info(id)
      );

      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER UNIQUE NOT NULL,
        amount REAL NOT NULL,
        paymentStatus TEXT NOT NULL CHECK(paymentStatus IN ('pending','paid')) DEFAULT 'pending',
        generatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (orderId) REFERENCES orders(id)
      );
    `;

    this.db.exec(tables);
  }
}

// Singleton
const database = new Database();
module.exports = database;
