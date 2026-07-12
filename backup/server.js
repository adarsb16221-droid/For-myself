const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'tasks.json');
const JOURNAL_FILE = path.join(__dirname, 'journal.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize files if they don't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
}
if (!fs.existsSync(JOURNAL_FILE)) {
    // Journal will be an object keyed by date string (e.g. "2023-10-15": "Journal text")
    fs.writeFileSync(JOURNAL_FILE, JSON.stringify({}), 'utf-8');
}

app.get('/api/tasks', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read tasks' });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const tasks = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save tasks' });
    }
});

// Journal Endpoints
app.get('/api/journal', (req, res) => {
    try {
        const data = fs.readFileSync(JOURNAL_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read journal' });
    }
});

app.post('/api/journal', (req, res) => {
    try {
        const journalData = req.body;
        fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journalData, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save journal' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
