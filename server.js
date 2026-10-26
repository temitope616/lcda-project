require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
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

let complaints;

function serializeComplaint({
    _id,
    name,
    email,
    type,
    description,
    location,
    image,
    status,
    date
}) {
    return {
        id: _id.toString(),
        name,
        email,
        type,
        description,
        location,
        image,
        status,
        date
    };
}

// ==========================================
// 3. CITIZEN ROUTES
// ==========================================
app.post('/api/complaints', upload.single('image'), async (req, res) => {
    const { name, email, type, description, location } = req.body;
    const date = new Date().toLocaleDateString();
    const image = req.file ? req.file.filename : 'No Image';

    try {
        await complaints.insertOne({
            name,
            email,
            type,
            description,
            location,
            image,
            status: 'Pending',
            date,
            createdAt: new Date()
        });
        res.json({ message: "Complaint submitted successfully!" });
    } catch (err) {
        console.error('Failed to insert complaint:', err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/api/track', async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        const rows = await complaints.find({ email })
            .sort({ createdAt: -1, _id: -1 })
            .toArray();
        res.json(rows.map(serializeComplaint));
    } catch (err) {
        console.error('Failed to track complaints:', err);
        res.status(500).json({ error: "Database error" });
    }
});

// ==========================================
// 4. ADMIN ROUTES
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

app.get('/api/complaints', async (req, res) => {
    try {
        const rows = await complaints.find({})
            .sort({ createdAt: -1, _id: -1 })
            .toArray();
        res.json(rows.map(serializeComplaint));
    } catch (err) {
        console.error('Failed to list complaints:', err);
        res.status(500).json({ error: "Database error" });
    }
});

app.put('/api/complaints/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Invalid complaint ID" });
    }
    if (typeof status !== 'string' || !status.trim()) {
        return res.status(400).json({ error: "Status required" });
    }

    try {
        const result = await complaints.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: status.trim() } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Complaint not found" });
        }
        res.json({ message: "Status updated" });
    } catch (err) {
        console.error('Failed to update complaint status:', err);
        res.status(500).json({ error: "Update failed" });
    }
});

// ==========================================
// 5. START SERVER AFTER DATABASE CONNECTION
// ==========================================
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_DB_URI;
let mongoClient;

async function startServer() {
    if (!MONGO_URI) {
        throw new Error('MONGO_DB_URI is required');
    }

    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient.db();
    complaints = db.collection('complaints');
    await complaints.createIndex({ email: 1 });
    await complaints.createIndex({ createdAt: -1 });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

}

startServer().catch(async (err) => {
    console.error('Failed to start server:', err);
    if (mongoClient) {
        try {
            await mongoClient.close();
        } catch (closeError) {
            console.error('Failed to close MongoDB client after startup error:', closeError);
        }
    }
    process.exitCode = 1;
});
