const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Necesare pentru a permite browserului să facă cereri către server

const app = express();
const port = '*'; // Portul pe care va rula serverul tău backend

// Middleware pentru a permite cereri de la domenii diferite (CORS)
app.use(cors());
// Middleware pentru a parsa corpul cererilor JSON (de la frontend)
app.use(express.json());

// Conectează-te la baza de date SQLite. Fișierul 'mydb.sqlite' va fi creat dacă nu există.
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Eroare la conectarea la baza de date:', err.message);
  } else {
    console.log('Conectat la baza de date SQLite.');
    // Creează tabela 'users' dacă nu există
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Eroare la crearea tabelei users:', err.message);
      } else {
        console.log('Tabela users este gata.');
      }
    });

    // NOU: Creează tabela 'orders' (comenzi) dacă nu există
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      nume TEXT NOT NULL,
      prenume TEXT NOT NULL,
      email TEXT NOT NULL,
      telefon TEXT NOT NULL,
      adresa TEXT NOT NULL,
      cantitate INTEGER NOT NULL,
      order_date TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Eroare la crearea tabelei orders:', err.message);
      } else {
        console.log('Tabela orders este gata.');
      }
    });
  }
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
    return res.status(400).json({ error: 'Numele și emailul sunt obligatorii.' });
  }
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function (err) {
    if (err) {
      // Eroare dacă emailul este deja înregistrat (din cauza UNIQUE NOT NULL)
      if (err.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email')) {
        res.status(409).json({ error: 'Acest email este deja înregistrat.' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.status(201).json({ message: 'Utilizator adăugat cu succes', id: this.lastID });
  });
});

// --- NOU: API Endpoint pentru Comenzi ---

// Ruta POST pentru a plasa o comandă nouă
app.post('/api/orders', (req, res) => {
  // Extrage datele din corpul cererii (trimise de formularul din magazin.html)
  const { produs, nume, prenume, email, telefon, adresa, cantitate } = req.body;

  // Validare simplă a datelor primite
  if (!produs || !nume || !prenume || !email || !telefon || !adresa || !cantitate) {
    return res.status(400).json({ error: 'Toate câmpurile (produs, nume, prenume, email, telefon, adresa, cantitate) sunt obligatorii.' });
  }
  if (isNaN(cantitate) || cantitate < 1) {
    return res.status(400).json({ error: 'Cantitatea trebuie să fie un număr valid și pozitiv.' });
  }

  // Inserarea datelor în tabela 'orders'
  db.run(
    `INSERT INTO orders (product, nume, prenume, email, telefon, adresa, cantitate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [produs, nume, prenume, email, telefon, adresa, cantitate],
    function (err) {
      if (err) {
        console.error('Eroare la inserarea comenzii:', err.message);
        res.status(500).json({ error: 'Eroare server la salvarea comenzii: ' + err.message });
        return;
      }
      // Trimite un răspuns de succes către frontend
      res.status(201).json({ message: 'Comanda a fost plasată cu succes!', orderId: this.lastID });
    }
  );
});

// Pornirea serverului
app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
  console.log('Asigură-te că rulezi și fișierele HTML în browser.');
});
