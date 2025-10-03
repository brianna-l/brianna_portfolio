// THEME: init & toggle
(function initTheme(){
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initial);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', initial === 'dark' ? 'true' : 'false');
      btn.textContent = initial === 'dark' ? '☀︎' : '☾';
      btn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
        btn.textContent = next === 'dark' ? '☀︎' : '☾';
      });
    }
  })();
  
const DATA_URL = "archive.json";
const $whole = document.getElementById("whole");

const rand = (a,b) => Math.random()*(b-a)+a;

async function loadFourthList(){
  const res = await fetch(DATA_URL);
  const data = await res.json();
  const lists = Object.values(data);
  return (lists.length >= 4 && Array.isArray(lists[3])) ? lists[3] : [];
}

function placeRandom(img){
  const maxX = Math.max(0, window.innerWidth  - 200);
  const maxY = Math.max(0, window.innerHeight - 150);
  img.style.left = `${Math.random()*maxX}px`;
  img.style.top  = `${Math.random()*maxY}px`;
}

function createOverlay(src, caption, onClosed){
  const overlay = document.createElement('div');
  overlay.className = 'zoom-overlay';
  overlay.innerHTML = `
    <div class="zoom-card" role="dialog" aria-modal="true" aria-label="${caption || 'Image'}">
      <img class="zoom-img" src="${src}" alt="${caption || ''}">
      <div class="zoom-cap">${caption || ''}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
      onClosed?.();
    }, 220);
  };

  // open (animate)
  requestAnimationFrame(() => overlay.classList.add('show'));

  // exits
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  const onKey = (e) => { if (e.key === 'Escape') { close(); window.removeEventListener('keydown', onKey); } };
  window.addEventListener('keydown', onKey);

  return overlay;
}

// ---------------- main ----------------
async function showRandomImages(){
  const list = await loadFourthList();

  list.forEach(item => {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title || '';
    img.className = 'random-img';
    // basic technical frame
    img.style.position = 'absolute';
    img.style.width = '180px';
    img.style.border = '1px solid #333';
    img.style.borderRadius = '1px';
    img.style.background = '#f9f9fb';
    img.style.boxShadow = '0 0 0 1px #999 inset, 0 6px 18px rgba(0,0,0,.15)';

    placeRandom(img);
    $whole.appendChild(img);

    img.addEventListener('click', () => {
        createOverlay(item.src, item.title, () => {
            img.classList.add('hidden-light');
            img.style.transform = 'scale(0.85)';
          });
    });
  });
}

window.addEventListener('DOMContentLoaded', showRandomImages);