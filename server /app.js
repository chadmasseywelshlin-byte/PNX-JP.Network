// server/app.js
import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';

const app = express();
const dbPath = path.join('../secure', 'wiki.db');
const pagesDir = path.join('../pages');

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static(path.join('../'))); // serve index.html, engine.js, etc.
app.use(session({
  secret: '536563757265536974654461746162617365556e6b6e6f776e537475666648657265496e736572744b696e6461546572727269626c65', // change to a secure secret
  resave: false,
  saveUninitialized: false,
}));

// --- Initialize Database ---
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- Helper Functions ---
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

// --- Routes ---

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users(username, password_hash) VALUES(?, ?)', [username, hash], function(err) {
    if (err) return res.status(400).json({ error: 'Username already exists' });
    req.session.userId = this.lastID;
    res.json({ success: true });
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'Invalid username/password' });
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid username/password' });
    req.session.userId = row.id;
    res.json({ success: true });
  });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
app.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  db.get('SELECT id, username FROM users WHERE id = ?', [req.session.userId], (err, row) => {
    res.json({ user: row || null });
  });
});

// --- Create a new page (requires login) ---
app.post('/createPage', requireLogin, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title or content' });

  const filename = path.join(pagesDir, `${title}.html`);
  if (fs.existsSync(filename)) return res.status(400).json({ error: 'Page already exists' });

  fs.writeFile(filename, content, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to create page' });
    res.json({ success: true, page: title });
  });
});

// --- Start server ---
const PORT = 3000;
app.listen(PORT, () => console.log(`Wiki server running on http://localhost:${PORT}`));
