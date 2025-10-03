// --- Config ---
const JSON_URL = 'archive.json'; // adjust if needed
const GROUP_KEY = 'machine';

// Elements
const range   = document.getElementById('organize');
const stage   = document.getElementById('stage');
const pile    = document.getElementById('pile');
const popover = document.getElementById('popover');
const popImg  = document.getElementById('popover-img');
const popCap  = document.getElementById('popover-caption');
const popClose= popover.querySelector('.popover__close');

// Utilities
const setVar = (el, k, v) => el.style.setProperty(k, v);
const cssNumber = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
const resolved = (url) => new URL(url, window.location.href).toString();

let currentAnchor = null; // <button> that opened the popover

// Slider → interpolation factor (0..1)
function updateT(){
  const t = +range.value / 100;
  document.documentElement.style.setProperty('--t', t);
  range.style.backgroundSize = `${range.value}% 100%`;
}
range.addEventListener('input', updateT);
updateT();

// Resize → recompute grid + reposition popover
const ro = new ResizeObserver(() => {
  layout();
  if (popover.dataset.open === 'true' && currentAnchor) positionPopover(currentAnchor);
});
ro.observe(stage);

// Boot
init().catch(showTopError);

async function init(){
  const data = await fetchJSON(JSON_URL);
  if (!data || !Array.isArray(data[GROUP_KEY])) {
    throw new Error(`JSON missing "${GROUP_KEY}" array at ${resolved(JSON_URL)}`);
  }

  const list = data[GROUP_KEY];
  if (!list.length) return showEmpty(`No images in "${GROUP_KEY}" group.`);

  await renderItems(list);
  randomize();
  layout();

  // Interactions
  pile.addEventListener('click', onItemClick);
  popClose.addEventListener('click', closePopover);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
  document.addEventListener('pointerdown', (e) => {
    if (popover.dataset.open === 'true') {
      if (!popover.contains(e.target) && !pile.contains(e.target)) closePopover();
    }
  });
}

// ---------- Fetch helpers ----------
async function fetchJSON(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch JSON (${res.status}) → ${resolved(url)}`);
  try { return await res.json(); }
  catch (e) { throw new Error(`Invalid JSON at ${resolved(url)} — ${e.message}`); }
}

// ---------- Render ----------
async function renderItems(arr){
  pile.innerHTML = '';
  const frag = document.createDocumentFragment();
  const broken = [];

  for (const it of arr){
    const outer = document.createElement('div');
    outer.className = 'item';

    const btn = document.createElement('button');
    btn.className = 'item__btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');

    // Store data for popover
    btn.dataset.title   = it.title || '';
    btn.dataset.caption = it.caption || it.title || 'Untitled';
    btn.dataset.src     = it.src;
    if (it.full) btn.dataset.full = it.full; // optional large preview

    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async';
    img.src = it.src; img.alt = it.title || 'image';

    img.addEventListener('error', () => {
      broken.push({ title: it.title || '(untitled)', src: resolved(it.src) });
      img.style.opacity = 0.3; img.style.filter = 'grayscale(1)';
      img.title = `Failed to load: ${resolved(it.src)}`;
    }, { once: true });

    btn.appendChild(img);
    outer.appendChild(btn);
    frag.appendChild(outer);
  }
  pile.appendChild(frag);

  // Preload so the first layout is stable
  await Promise.all(Array.from(pile.querySelectorAll('img')).map(preload));

  if (broken.length){
    showDebugPanel(broken);
    console.warn('Some images failed to load:', broken);
  }
}

function preload(img){
  return new Promise((resolve) => {
    if (img.complete) return resolve();
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}

// ---------- Layout logic ----------
function randomize(){
  const rect = stage.getBoundingClientRect();
  const gap = cssNumber('--gap', 14);
  const W = rect.width  - gap*2;
  const H = rect.height - gap*2;

  Array.from(pile.children).forEach((el) => {
    const rx = (Math.random() - 0.5) * W * 0.9;
    const ry = (Math.random() - 0.5) * H * 0.9;
    const rrot = (Math.random() - 0.5) * 40; // -20..20 deg
    setVar(el, '--rx', `${rx}px`);
    setVar(el, '--ry', `${ry}px`);
    setVar(el, '--rrot', rrot);
  });
}

function layout(){
  const rect = stage.getBoundingClientRect();
  const gap = cssNumber('--gap', 14);
  const cols = cssNumber('--cols', 4);

  const W = rect.width  - gap*2;
  const H = rect.height - gap*2;

  const items = Array.from(pile.children);
  const rows = Math.ceil(items.length / cols) || 1;

  const cellW = (W - gap*(cols-1)) / cols;
  const cellH = (H - gap*(rows-1)) / rows;

  items.forEach((el, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const gx = col * (cellW + gap);
    const gy = row * (cellH + gap);
    setVar(el, '--gx', `${gx}px`);
    setVar(el, '--gy', `${gy}px`);
    setVar(el, '--w',  `${cellW}px`);
    setVar(el, '--h',  `${cellH}px`);
  });
}

// ---------- Popover (image + caption) ----------
function onItemClick(e){
  const btn = e.target.closest('.item__btn');
  if (!btn) return;

  if (popover.dataset.open === 'true' && currentAnchor === btn) {
    return closePopover(); // toggle off
  }

  currentAnchor = btn;

  // Choose preview image: prefer .full if provided
  const previewSrc = btn.dataset.full || btn.dataset.src;
  popImg.src = previewSrc;
  popImg.alt = btn.dataset.title || 'preview';
  popCap.textContent = btn.dataset.caption || 'Untitled';

  // Open + position
  openPopover(btn);

  // If the preview needs loading, reposition once it renders to avoid jumps
  if (!popImg.complete) {
    popImg.addEventListener('load', () => positionPopover(btn), { once: true });
  }
}

function openPopover(anchorBtn){
  popover.setAttribute('aria-hidden', 'false');
  popover.dataset.open = 'true';
  anchorBtn.setAttribute('aria-expanded', 'true');
  positionPopover(anchorBtn);
  popClose.focus({ preventScroll: true });
}

function closePopover(){
  if (popover.dataset.open !== 'true') return;
  popover.setAttribute('aria-hidden', 'true');
  popover.dataset.open = 'false';
  if (currentAnchor) currentAnchor.setAttribute('aria-expanded', 'false');
  if (currentAnchor) currentAnchor.focus({ preventScroll: true });
  currentAnchor = null;
}

function positionPopover(anchorBtn){
  const stageRect = stage.getBoundingClientRect();
  const btnRect   = anchorBtn.getBoundingClientRect();

  // Provisional position: above, centered
  let x = btnRect.left + btnRect.width / 2;
  let y = btnRect.top;

  // Convert to stage-local coords
  x -= stageRect.left;
  y -= stageRect.top;

  // Measure popover after content set
  const popRect = popover.getBoundingClientRect();

  // If not enough room above, flip below
  let translate = 'translate(-50%, -100%) translateY(-4px)';
  let arrowBottom = '-8px';
  if (y - popRect.height - 16 < 10) {
    y = btnRect.bottom - stageRect.top;
    translate = 'translate(-50%, 0%) translateY(8px)';
    arrowBottom = 'auto'; // visually flips via positioning
  }
  // Clamp horizontally within the stage
  const pad = 10;
  x = Math.max(pad + 8, Math.min(stageRect.width - pad - 8, x));

  popover.style.left = `${x}px`;
  popover.style.top  = `${y}px`;
  popover.style.transform = translate;

  // (Optional) we could rotate/toggle the tail with CSS vars; keeping simple here.
}

// ---------- Status helpers ----------
function showEmpty(msg){
  pile.innerHTML = '';
  const e = document.createElement('div');
  e.className = 'empty';
  e.textContent = msg || 'No images.';
  stage.appendChild(e);
}
function showTopError(err){
  console.error(err);
  pile.innerHTML = '';
  const e = document.createElement('div');
  e.className = 'error';
  e.textContent = String(err.message || err);
  stage.appendChild(e);
}
function showDebugPanel(broken){
  let panel = document.getElementById('debug-panel');
  if (!panel){
    panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.position = 'absolute';
    panel.style.right = '10px';
    panel.style.bottom = '10px';
    panel.style.maxWidth = '60ch';
    panel.style.font = '12px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    panel.style.background = 'rgba(255,255,255,.9)';
    panel.style.border = '1px solid #dde5ee';
    panel.style.borderRadius = '10px';
    panel.style.padding = '10px 12px';
    panel.style.boxShadow = '0 6px 18px rgba(0,0,0,.08)';
    stage.appendChild(panel);
  }
  panel.innerHTML = `
    <strong>Broken images (${broken.length}):</strong>
    <ul style="margin:6px 0 0 16px; padding:0;">
      ${broken.map(b => `<li><code>${b.title}</code> → <code>${b.src}</code></li>`).join('')}
    </ul>
  `;
}
