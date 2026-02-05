// server/db.js
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the /secure folder exists
const secureDir = path.join('../secure');
if (!fs.existsSync(secureDir)) fs.mkdirSync(secureDir);

// Database file path
const dbPath = path.join(secureDir, 'wiki.db');

// Open the database (will create if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Initialize tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Optional: Pages table if you store pages in the database
  db.run(`CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

export default db;
