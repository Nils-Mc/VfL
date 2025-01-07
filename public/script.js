document.addEventListener('DOMContentLoaded', () => {
    const liveticker = document.getElementById('liveticker');
    const scheduleList = document.getElementById('scheduleList');
    const adminScheduleList = document.getElementById('adminScheduleList');
    const musicWishesList = document.getElementById('musicWishesList');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');
    const addScheduleForm = document.getElementById('addScheduleForm');
    const musicRequestForm = document.getElementById('musicRequestForm');
    const adminSection = document.getElementById('adminSection');
    const loginSection = document.getElementById('loginSection');

    // Funktion: Liveticker aktualisieren
    async function updateLiveticker() {
        const response = await fetch('/liveticker');
        const data = await response.json();
        liveticker.textContent = data.liveticker;
    }

    // Funktion: Zeitplan laden
    async function loadSchedule() {
        const response = await fetch('/schedule');
        const schedule = await response.json();
        scheduleList.innerHTML = '';
        adminScheduleList.innerHTML = '';

        schedule.forEach(event => {
            const li = document.createElement('li');
            li.textContent = `${event.day}: ${event.activity} (${event.startTime} - ${event.endTime})`;
            scheduleList.appendChild(li);

            const adminLi = document.createElement('li');
            adminLi.textContent = `${event.day}: ${event.activity} (${event.startTime} - ${event.endTime})`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Löschen';
            deleteButton.addEventListener('click', async () => {
                await fetch(`/schedule/${event.id}`, { method: 'DELETE' });
                loadSchedule();
            });
            adminLi.appendChild(deleteButton);
            adminScheduleList.appendChild(adminLi);
        });
    }

    // Funktion: Zeitplan-Eintrag hinzufügen
    addScheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const day = document.getElementById('scheduleDay').value;
        const activity = document.getElementById('scheduleActivity').value;
        const startTime = document.getElementById('scheduleStartTime').value;
        const endTime = document.getElementById('scheduleEndTime').value;

        await fetch('/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, activity, startTime, endTime })
        });

        addScheduleForm.reset();
        loadSchedule();
    });

    // Funktion: Musikwunsch absenden
    musicRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('requestName').value;
        const song = document.getElementById('requestSong').value;

        const response = await fetch('/wishes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, song })
        });

        const result = await response.json();
        if (result.success) {
            alert("Musikwunsch wurde gesendet!");
            musicRequestForm.reset();
        } else {
            alert(result.message);
        }
    });

    // Funktion: Admin-Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (result.success) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            loadSchedule();
            loadMusicWishes();
        } else {
            alert(result.message);
        }
    });

    // Funktion: Admin-Logout
    logoutButton.addEventListener('click', async () => {
        const response = await fetch('/logout', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            adminSection.style.display = 'none';
            loginSection.style.display = 'block';
        }
    });

    // Funktion: Musikwünsche laden (Admin)
    async function loadMusicWishes() {
        const response = await fetch('/wishes');
        const wishes = await response.json();
        musicWishesList.innerHTML = '';

        wishes.forEach(wish => {
            const li = document.createElement('li');
            li.textContent = `${wish.name}: ${wish.song}`;
            musicWishesList.appendChild(li);
        });
    }

    // Initiale Daten laden
    updateLiveticker();
    loadSchedule();

    // Liveticker alle 60 Sekunden aktualisieren
    setInterval(updateLiveticker, 60000);
});