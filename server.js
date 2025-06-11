const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000; // Set a specific port number

// Configure CORS with specific options
app.use(cors({
  origin: '*', // In production, you should specify exact origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Define database path
const dbPath = path.join(__dirname, 'database', 'mydb.sqlite');

// Ensure database directory exists
const fs = require('fs');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to SQLite database at:', dbPath);
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables with better structure
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table is ready');
      }
    });

    // Create orders table with foreign key reference
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      nume TEXT NOT NULL,
      prenume TEXT NOT NULL,
      email TEXT NOT NULL,
      telefon TEXT NOT NULL,
      adresa TEXT NOT NULL,
      cantitate INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (email) REFERENCES users(email)
    )`, (err) => {
      if (err) {
        console.error('Error creating orders table:', err.message);
      } else {
        console.log('Orders table is ready');
      }
    });
  });
});

// --- API Endpoints pentru Utilizatori (conform exemplului tău inițial) ---

// Ruta GET pentru a obține toți utilizatorii
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ users: rows });
  });
});

// Ruta POST pentru a adăuga un utilizator nou
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', 
    [name, email], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(409).json({ error: 'Email already registered.' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.status(201).json({ 
        message: 'User added successfully', 
        id: this.lastID 
      });
    }
  );
});

// --- NOU: API Endpoint pentru Comenzi ---

// Ruta POST pentru a plasa o comandă nouă
app.post('/api/orders', (req, res) => {
  const { produs, nume, prenume, email, telefon, adresa, cantitate } = req.body;

  if (!produs || !nume || !prenume || !email || !telefon || !adresa || !cantitate) {
    return res.status(400).json({ 
      error: 'All fields are required.' 
    });
  }

  if (isNaN(cantitate) || cantitate < 1) {
    return res.status(400).json({ 
      error: 'Quantity must be a positive number.' 
    });
  }

  db.run(
    `INSERT INTO orders (product, nume, prenume, email, telefon, adresa, cantitate) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [produs, nume, prenume, email, telefon, adresa, cantitate],
    function(err) {
      if (err) {
        console.error('Error inserting order:', err.message);
        res.status(500).json({ 
          error: 'Server error while saving order: ' + err.message 
        });
        return;
      }
      res.status(201).json({ 
        message: 'Order placed successfully!', 
        orderId: this.lastID 
      });
    }
  );
});

// Get all orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY order_date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ orders: rows });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!' 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Database location:', dbPath);
});
