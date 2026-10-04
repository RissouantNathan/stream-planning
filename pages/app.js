import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- CONFIGURATION FIREBASE ---
// Remplace ces valeurs par celles de ta console Firebase
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAbEUGxn_r1nFX5qL9HHDVYcE17KbF2taQ",
    authDomain: "planning-stream.firebaseapp.com",
    projectId: "planning-stream",
    storageBucket: "planning-stream.firebasestorage.app",
    messagingSenderId: "773016135585",
    appId: "1:773016135585:web:55a4d4a2f201e298db8de0",
    measurementId: "G-6TH1L23MMT"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const scheduleDocRef = doc(db, "stream", "planning");
</script>


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

let schedule = [...DEFAULT_SCHEDULE];
let adminPin = localStorage.getItem('stream_pin') || '1234';
let isAdmin = false;

// DÉTECTION DU JOUR
function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

// ÉCOUTE EN TEMPS RÉEL DE FIREBASE
onSnapshot(scheduleDocRef, (docSnap) => {
  if (docSnap.exists()) {
    schedule = docSnap.data().days || DEFAULT_SCHEDULE;
  } else {
    // Si le document n'existe pas encore, on l'initialise
    setDoc(scheduleDocRef, { days: DEFAULT_SCHEDULE });
  }
  renderSchedule();
});

// RENDU DU PLANNING
function renderSchedule() {
  const grid = document.getElementById('schedule-grid');
  if (!grid) return;
  const todayIdx = getTodayIndex();
  grid.innerHTML = '';

  schedule.forEach((item, index) => {
    const isToday = index === todayIdx;
    const isOff = item.game === 'OFF';

    if (isToday) {
      const summary = document.getElementById('today-summary');
      if (summary) {
        summary.innerHTML = isOff 
          ? `<i class="fa-solid fa-moon"></i> Aujourd'hui : OFF`
          : `<i class="fa-solid fa-circle"></i> Aujourd'hui (${item.time}) : <strong>${item.game}</strong>`;
      }
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

        ${isAdmin ? `<button class="card-edit-btn" data-index="${index}"><i class="fa-solid fa-pen"></i> Modifier</button>` : ''}
      </div>
    `;

    grid.appendChild(card);
  });

  // Reconnecter les évènements de modification
  document.querySelectorAll('.card-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      openEditModal(idx);
    });
  });
}

// GESTION DU MODE ADMIN
const adminBtn = document.getElementById('admin-toggle-btn');
const pinModal = document.getElementById('pin-modal');
const adminBar = document.getElementById('admin-bar');

if (adminBtn) {
  adminBtn.addEventListener('click', () => {
    if (isAdmin) {
      isAdmin = false;
      updateAdminUI();
    } else {
      pinModal.classList.remove('hidden');
      document.getElementById('pin-input').focus();
    }
  });
}

document.getElementById('pin-cancel')?.addEventListener('click', () => {
  pinModal.classList.add('hidden');
});

document.getElementById('pin-submit')?.addEventListener('click', () => {
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

// MODIFICATION & SAUVEGARDE SUR FIREBASE
const editModal = document.getElementById('edit-modal');
const gameSelect = document.getElementById('edit-game-select');
const customFields = document.getElementById('custom-game-fields');

function openEditModal(index) {
  const item = schedule[index];
  document.getElementById('edit-day-index').value = index;
  document.getElementById('edit-modal-title').innerText = `Modifier le ${item.day}`;
  document.getElementById('edit-time').value = item.time === 'OFF' ? '' : item.time;
  document.getElementById('edit-desc').value = item.desc || '';

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

gameSelect?.addEventListener('change', toggleCustomFields);

function toggleCustomFields() {
  if (gameSelect.value === 'CUSTOM') {
    customFields.classList.remove('hidden');
  } else {
    customFields.classList.add('hidden');
  }
}

document.getElementById('edit-cancel')?.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

document.getElementById('edit-form')?.addEventListener('submit', async (e) => {
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

  // Envoi des modifications sur Firebase
  try {
    await setDoc(scheduleDocRef, { days: schedule });
    editModal.classList.add('hidden');
  } catch (err) {
    console.error("Erreur lors de la sauvegarde :", err);
    alert("Erreur lors de la sauvegarde sur la base de données.");
  }
});

// AUTRES ACTIONS ADMIN
document.getElementById('change-pin-btn')?.addEventListener('click', () => {
  const newPin = prompt("Entre ton nouveau code PIN :");
  if (newPin) {
    adminPin = newPin;
    localStorage.setItem('stream_pin', newPin);
    alert("Code PIN mis à jour avec succès !");
  }
});

document.getElementById('reset-default-btn')?.addEventListener('click', async () => {
  if (confirm("Réinitialiser tout le planning avec les valeurs par défaut ?")) {
    schedule = [...DEFAULT_SCHEDULE];
    await setDoc(scheduleDocRef, { days: schedule });
  }
});