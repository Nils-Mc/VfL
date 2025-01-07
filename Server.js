const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Datenbank-Dateien
const USERS_FILE = path.join(__dirname, 'users.json');
const WISHES_FILE = path.join(__dirname, 'wishes.json');
const SCHEDULE_FILE = path.join(__dirname, 'schedule.json');

// Hilfsfunktionen
function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadData(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
}

// Daten laden
let users = loadData(USERS_FILE);
let wishes = loadData(WISHES_FILE);
let schedule = loadData(SCHEDULE_FILE);
let adminLoggedIn = false;

// Endpunkte

// Abrufen des Zeitplans
app.get('/schedule', (req, res) => res.json(schedule));

// Zeitplan aktualisieren (Admin)
app.post('/schedule', (req, res) => {
    if (!adminLoggedIn) return res.status(403).json({ success: false, message: "Nicht autorisiert!" });
    const { id, day, activity, startTime, endTime } = req.body;
    const eventIndex = schedule.findIndex(e => e.id === id);
    if (eventIndex >= 0) {
        schedule[eventIndex] = { id, day, activity, startTime, endTime };
    } else {
        schedule.push({ id: Date.now(), day, activity, startTime, endTime });
    }
    saveData(SCHEDULE_FILE, schedule);
    res.json({ success: true, message: "Zeitplan aktualisiert!", schedule });
});

// Zeitplan löschen (Admin)
app.delete('/schedule/:id', (req, res) => {
    if (!adminLoggedIn) return res.status(403).json({ success: false, message: "Nicht autorisiert!" });
    const id = parseInt(req.params.id);
    schedule = schedule.filter(event => event.id !== id);
    saveData(SCHEDULE_FILE, schedule);
    res.json({ success: true, message: "Eintrag gelöscht!", schedule });
});

// Liveticker
app.get('/liveticker', (req, res) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    const currentActivity = schedule.find(event => {
        const [startHour, startMinutes] = event.startTime.split(':').map(Number);
        const [endHour, endMinutes] = event.endTime.split(':').map(Number);
        const start = startHour * 60 + startMinutes;
        const end = endHour * 60 + endMinutes;
        const nowMinutes = currentHour * 60 + currentMinutes;
        return nowMinutes >= start && nowMinutes <= end;
    });

    if (currentActivity) {
        res.json({ liveticker: `Aktuell: ${currentActivity.activity} (${currentActivity.day})` });
    } else {
        res.json({ liveticker: "Keine aktuelle Aktivität." });
    }
});

// Musikwünsche (wie zuvor)
app.get('/wishes', (req, res) => {
    if (!adminLoggedIn) return res.status(403).json({ success: false, message: "Nicht autorisiert!" });
    res.json(wishes);
});

app.post('/wishes', (req, res) => {
    const { name, song } = req.body;
    if (!name || !song) return res.status(400).json({ success: false, message: "Name und Lied erforderlich!" });
    wishes.push({ id: Date.now(), name, song });
    saveData(WISHES_FILE, wishes);
    res.json({ success: true, message: "Musikwunsch hinzugefügt!" });
});

// Admin-Login/Logout
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user) return res.status(400).json({ success: false, message: "Benutzername oder Passwort falsch!" });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ success: false, message: "Benutzername oder Passwort falsch!" });
    adminLoggedIn = true;
    res.json({ success: true, message: "Login erfolgreich!" });
});

app.post('/logout', (req, res) => {
    adminLoggedIn = false;
    res.json({ success: true, message: "Logout erfolgreich!" });
});

// Server starten
app.listen(port, () => console.log(`Server läuft auf http://localhost:${port}`));