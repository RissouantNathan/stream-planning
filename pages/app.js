// --- DONNÉES PAR DÉFAUT ---
const DEFAULT_SCHEDULE = [
  { day: "Lundi", time: "20h00 - 23h00", game: "Just Chatting", img: "https://static-cdn.jtvnw.net/ttv-boxart/509658-285x380.jpg", desc: "Debrief du WE & Chill" },
  { day: "Mardi", time: "OFF", game: "OFF", img: "", desc: "Pas de stream" },
  { day: "Mercredi", time: "15h00 - 18h00", game: "Dota 2", img: "https://static-cdn.jtvnw.net/ttv-boxart/29595-285x380.jpg", desc: "Ranked tryhard Pos 4/5" },
  { day: "Jeudi", time: "OFF", game: "OFF", img: "", desc: "Pas de stream" },
  { day: "Vendredi", time: "21h00 - 00h00", game: "Valorant", img: "https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg", desc: "Soirée abonnés" },
  { day: "Samedi", time: "18h00 - 22h00", game: "Minecraft", img: "https://static-cdn.jtvnw.net/ttv-boxart/27471_IGDB-285x380.jpg", desc: "SMP entre potes" },
  { day: "Dimanche", time: "OFF", game: "OFF", img: "", desc: "Repos" }
];

// STATE LOCAL
let schedule = JSON.parse(localStorage.getItem('stream_schedule')) || DEFAULT_SCHEDULE;
let adminPin = localStorage.getItem('stream_pin') || '1234';
let isAdmin = false;

// --- DÉTECTION DU JOUR ACTUEL ---
function getTodayIndex() {
  const day = new Date().getDay();
  // Transforme Dimanche(0)->6, Lundi(1)->0, etc.
  return day === 0 ? 6 : day - 1;
}

// --- RENDU DU PLANNING ---
function renderSchedule() {
  const grid = document.getElementById('schedule-grid');
  const todayIdx = getTodayIndex();
  grid.innerHTML = '';

  schedule.forEach((item, index) => {
    const isToday = index === todayIdx;
    const isOff = item.game === 'OFF';

    // Mettre à jour l'en-tête pour aujourd'hui
    if (isToday) {
      const summary = document.getElementById('today-summary');
      summary.innerHTML = isOff 
        ? `<i class="fa-solid fa-moon"></i> Aujourd'hui : OFF`
        : `<i class="fa-solid fa-circle"></i> Aujourd'hui (${item.time}) : <strong>${item.game}</strong>`;
    }

    const card = document.createElement('div');
    card.className = `day-card ${isToday ? 'today' : ''} ${isOff ? 'off' : ''}`;

    card.innerHTML = `
      <div class="day-header">
        <span class="day-name">${item.day}</span>
        ${isToday ? '<span class="today-tag">AUJOURD\'HUI</span>' : ''}
      </div>
      <div class="day-body">
        ${!isOff && item.img ? `
          <div class="game-cover-container">
            <img src="${item.img}" alt="${item.game}" class="game-cover" onerror="this.src='https://via.placeholder.com/285x380?text=No+Image'">
          </div>
        ` : ''}
        
        <div class="game-details">
          <div class="game-title">${isOff ? 'Pas de Stream' : item.game}</div>
          ${!isOff ? `<div class="stream-time"><i class="fa-regular fa-clock"></i> ${item.time}</div>` : ''}
          ${item.desc ? `<div class="stream-desc">${item.desc}</div>` : ''}
        </div>

        ${isAdmin ? `<button class="card-edit-btn" onclick="openEditModal(${index})"><i class="fa-solid fa-pen"></i> Modifier</button>` : ''}
      </div>
    `;

    grid.appendChild(card);
  });
}

// --- GESTION DU MODE ADMIN ---
const adminBtn = document.getElementById('admin-toggle-btn');
const pinModal = document.getElementById('pin-modal');
const adminBar = document.getElementById('admin-bar');

adminBtn.addEventListener('click', () => {
  if (isAdmin) {
    isAdmin = false;
    updateAdminUI();
  } else {
    pinModal.classList.remove('hidden');
    document.getElementById('pin-input').focus();
  }
});

document.getElementById('pin-cancel').addEventListener('click', () => {
  pinModal.classList.add('hidden');
});

document.getElementById('pin-submit').addEventListener('click', () => {
  const pinInput = document.getElementById('pin-input');
  if (pinInput.value === adminPin) {
    isAdmin = true;
    pinModal.classList.add('hidden');
    pinInput.value = '';
    updateAdminUI();
  } else {
    alert('Code PIN incorrect.');
    pinInput.value = '';
  }
});

function updateAdminUI() {
  const btnText = document.getElementById('admin-btn-text');
  if (isAdmin) {
    adminBtn.classList.add('active');
    btnText.innerText = 'Quitter Édition';
    adminBar.classList.remove('hidden');
  } else {
    adminBtn.classList.remove('active');
    btnText.innerText = 'Mode Édition';
    adminBar.classList.add('hidden');
  }
  renderSchedule();
}

// --- MODIFICATION D'UN CRÉNEAU ---
const editModal = document.getElementById('edit-modal');
const gameSelect = document.getElementById('edit-game-select');
const customFields = document.getElementById('custom-game-fields');

function openEditModal(index) {
  const item = schedule[index];
  document.getElementById('edit-day-index').value = index;
  document.getElementById('edit-modal-title').innerText = `Modifier le ${item.day}`;
  document.getElementById('edit-time').value = item.time === 'OFF' ? '' : item.time;
  document.getElementById('edit-desc').value = item.desc || '';

  // Sélectionner le bon jeu dans le menu déroulant
  let matchFound = false;
  for (let option of gameSelect.options) {
    if (option.value.startsWith(item.game + '|')) {
      gameSelect.value = option.value;
      matchFound = true;
      break;
    }
  }

  if (!matchFound) {
    if (item.game === 'OFF') {
      gameSelect.value = 'OFF';
    } else {
      gameSelect.value = 'CUSTOM';
      document.getElementById('edit-custom-title').value = item.game;
      document.getElementById('edit-custom-img').value = item.img;
    }
  }

  toggleCustomFields();
  editModal.classList.remove('hidden');
}

gameSelect.addEventListener('change', toggleCustomFields);

function toggleCustomFields() {
  if (gameSelect.value === 'CUSTOM') {
    customFields.classList.remove('hidden');
  } else {
    customFields.classList.add('hidden');
  }
}

document.getElementById('edit-cancel').addEventListener('click', () => {
  editModal.classList.add('hidden');
});

document.getElementById('edit-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const idx = document.getElementById('edit-day-index').value;
  const selectValue = gameSelect.value;
  let gameTitle = '', gameImg = '';

  if (selectValue === 'OFF') {
    gameTitle = 'OFF';
    gameImg = '';
  } else if (selectValue === 'CUSTOM') {
    gameTitle = document.getElementById('edit-custom-title').value || 'Jeu Inconnu';
    gameImg = document.getElementById('edit-custom-img').value || '';
  } else {
    const [title, img] = selectValue.split('|');
    gameTitle = title;
    gameImg = img;
  }

  schedule[idx] = {
    day: schedule[idx].day,
    time: selectValue === 'OFF' ? 'OFF' : (document.getElementById('edit-time').value || '20h00'),
    game: gameTitle,
    img: gameImg,
    desc: document.getElementById('edit-desc').value
  };

  localStorage.setItem('stream_schedule', JSON.stringify(schedule));
  editModal.classList.add('hidden');
  renderSchedule();
});

// --- AUTRES ACTIONS ADMIN ---
document.getElementById('change-pin-btn').addEventListener('click', () => {
  const newPin = prompt("Entre ton nouveau code PIN :");
  if (newPin) {
    adminPin = newPin;
    localStorage.setItem('stream_pin', newPin);
    alert("Code PIN mis à jour avec succès !");
  }
});

document.getElementById('reset-default-btn').addEventListener('click', () => {
  if (confirm("Réinitialiser tout le planning avec les valeurs par défaut ?")) {
    schedule = [...DEFAULT_SCHEDULE];
    localStorage.setItem('stream_schedule', JSON.stringify(schedule));
    renderSchedule();
  }
});

// INITIALISATION
renderSchedule();