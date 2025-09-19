// --- Firebase config (ADD your databaseURL from Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyAIR9QOt7g_-S_5IYPv72HN_TwyM1UkxpE",
    authDomain: "discussion-256.firebaseapp.com",
    projectId: "discussion-256",
    storageBucket: "discussion-256.firebasestorage.app",
    messagingSenderId: "618889478232",
    appId: "1:618889478232:web:b79c5f3d9231e1e68cca2d",
    measurementId: "G-VTYN0GSPKX",
    databaseURL: "https://discussion-256-default-rtdb.firebaseio.com" // <-- IMPORTANT
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database().ref("reflections"); // collection path
  
  // --- DOM
  const chatroom = document.getElementById("chatroom");
  const form = document.getElementById("chat");
  const nameInput = document.getElementById("name-input");
  const messageInput = document.getElementById("message-input");
  const list = document.getElementById("chat-list");
  
  // Track placed notes so we can avoid overlaps a bit
  let placed = [];
  
  // Utility to place a note in a free-ish spot
  function placeNote(el) {
    const rect = chatroom.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (!w || !h) return;
  
    let tries = 0;
    while (tries < 80) {
      const top = Math.random() * Math.max(0, h - 120);
      const left = Math.random() * Math.max(0, w - 300);
  
      const overlaps = placed.some(p => {
        const buffer = 12;
        return (
          top < p.top + p.height + buffer &&
          top + 100 > p.top - buffer &&
          left < p.left + p.width + buffer &&
          left + 260 > p.left - buffer
        );
      });
  
      if (!overlaps) {
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        placed.push({ top, left, width: 260, height: 100 });
        return;
      }
      tries++;
    }
  
    // Fallback, just stack near top-left
    el.style.top = "8px";
    el.style.left = "8px";
  }
  
  function addNote({ name, message, createdAt }) {
    const note = document.createElement("div");
    note.className = "note";
    const who = (name || "Someone").slice(0, 30);
    const text = (message || "").slice(0, 240);
  
    note.innerHTML = `<strong>${escapeHTML(who)}</strong>${escapeHTML(text)}`;
    chatroom.appendChild(note);
    placeNote(note);
  
    // Also add to linear list (optional)
    if (list) {
      const li = document.createElement("li");
      const date = createdAt ? new Date(createdAt) : new Date();
      const t = date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      li.textContent = `${who}: ${text} — ${t}`;
      list.prepend(li);
    }
  }
  
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  
  // Listen for new posts (realtime)
  db.limitToLast(200).on("child_added", (snap) => {
    const val = snap.val();
    addNote(val);
  });
  
  // Submit handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (!message) return;
  
    db.push({
      name,
      message,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
  
    messageInput.value = "";
  });
  