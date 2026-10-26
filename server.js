const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads folder exists (Render might delete empty folders)
const uploadDir = './public/uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// 1. SETUP MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// 2. SETUP FILE UPLOAD (MULTER)
// ==========================================
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, uploadDir);
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 3. CONNECT TO DATABASE
// ==========================================
const db = new sqlite3.Database('database.db');

db.run(`
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        type TEXT,
        description TEXT,
        location TEXT,
        image TEXT,
        status TEXT DEFAULT 'Pending',
        date TEXT
    )
`);

// ==========================================
// 4. CITIZEN ROUTES
// ==========================================
app.post('/api/complaints', upload.single('image'), (req, res) => {
    const { name, email, type, description, location } = req.body;
    const date = new Date().toLocaleDateString();
    const image = req.file ? req.file.filename : 'No Image';

    const sql = `INSERT INTO complaints (name, email, type, description, location, image, date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, email, type, description, location, image, date], function(err) {
        if (err) {
            res.status(500).json({ error: "Database error" });
        } else {
            res.json({ message: "Complaint submitted successfully!" });
        }
    });
});

app.get('/api/track', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email required" });

    const sql = `SELECT * FROM complaints WHERE email = ? ORDER BY id DESC`;
    db.all(sql, [email], (err, rows) => {
        if (err) res.status(500).json({ error: "Database error" });
        else res.json(rows);
    });
});

// ==========================================
// 5. ADMIN ROUTES
// ==========================================
app.post('/api/login', (req, res) => {
    if (!req.body || !req.body.password) {
        return res.status(400).json({ success: false, error: "No password provided" });
    }

    const enteredPassword = req.body.password.trim();

    if (enteredPassword === 'lcda123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: "Wrong password. Please try again." });
    }
});

app.get('/api/complaints', (req, res) => {
    db.all(`SELECT * FROM complaints ORDER BY id DESC`, [], (err, rows) => {
        if (err) res.status(500).json({ error: "Database error" });
        else res.json(rows);
    });
});

app.put('/api/complaints/:id', (req, res) => {
    db.run(`UPDATE complaints SET status = ? WHERE id = ?`, [req.body.status, req.params.id], function(err) {
        if (err) res.status(500).json({ error: "Update failed" });
        else res.json({ message: "Status updated" });
    });
});

// ==========================================
// 6. START SERVER (Dynamic Port for Render)
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});