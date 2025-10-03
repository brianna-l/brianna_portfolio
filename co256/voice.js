// ---------- Config ----------
const JSON_URL   = 'archive.json'; // your archive
const GROUP_INDEX= 2;              // third group (0-based)

// Elements
const stage   = document.getElementById('stage');
const nodesEl = document.getElementById('nodes');
const svg     = document.getElementById('wires');

const shuffleBtn    = document.getElementById('shuffleBtn');
const clearLinesBtn = document.getElementById('clearLinesBtn');
const machineBtn    = document.getElementById('machineBtn');
const statusEl      = document.getElementById('status');

const progressWrap = document.getElementById('progress');
const bar          = document.getElementById('bar');
const ptime        = document.getElementById('ptime');

const usedList     = document.getElementById('usedList');

// State
let nodes = [];       // [{el, title, src, xPct, yPct, removed:boolean}]
let paths = [];       // [{pointsPct: [{x,y}...], el}]
let startNode = null;
let machineMode = false;

let livePathEl = null;        // SVG path while drawing
let livePointsPct = null;     // array of {x,y} in percent (0-100)
let startedAt = 0;

// ---------- Init ----------
init().catch(err => {
  console.error(err);
  status('Failed to load archive.json');
});

async function init(){
  const list = await loadThirdGroup(JSON_URL);
  buildNodes(list);
  randomizePositions();
  layoutAll();
  bindUI();
  status('Idle');
}

// Load the 3rd group from archive.json
async function loadThirdGroup(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  const groups = Object.values(data);
  if (!Array.isArray(groups) || groups.length <= GROUP_INDEX)
    throw new Error(`No group at index ${GROUP_INDEX}`);
  const list = groups[GROUP_INDEX];
  if (!Array.isArray(list) || list.length === 0)
    throw new Error(`Group ${GROUP_INDEX} is empty`);
  return list;
}

function buildNodes(list){
  nodesEl.innerHTML = '';
  nodes = list.map((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'node';
    btn.type = 'button';
    btn.title = item.title || `Image ${i+1}`;
    btn.dataset.index = String(i);

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title || 'image';
    img.loading = 'lazy'; img.decoding = 'async';

    btn.appendChild(img);
    nodesEl.appendChild(btn);

    return { el: btn, title: item.title || '', src: item.src, xPct: 50, yPct: 50, removed: false };
  });
}

// Random positions (percent coordinates so they’re responsive)
function randomizePositions(){
  const { innerW, innerH } = innerSize();
  nodes.forEach(n => {
    const x = (Math.random()*0.84 + 0.08) * innerW;
    const y = (Math.random()*0.84 + 0.08) * innerH;
    n.xPct = clamp( (x / innerW) * 100, 2, 98 );
    n.yPct = clamp( (y / innerH) * 100, 2, 98 );
  });
}

function bindUI(){
  // Start & end clicks on images
  nodesEl.addEventListener('click', onNodeClick);

  // Freehand: move anywhere to append to live path while drawing
  document.addEventListener('pointermove', onPointerMoveFree);

  // Buttons
  shuffleBtn.addEventListener('click', () => {
    cancelLive();
    startNode = null;
    nodes.forEach(n => n.el.removeAttribute('data-active'));
    randomizePositions();
    layoutAll();
    status('Shuffled');
  });

  clearLinesBtn.addEventListener('click', () => {
    cancelLive();
    paths.forEach(p => p.el.remove());
    paths = [];
    status('Lines cleared');
  });

  machineBtn.addEventListener('click', () => {
    machineMode = !machineMode;
    machineBtn.classList.toggle('active', machineMode);
    machineBtn.textContent = `Machine: ${machineMode ? 'ON' : 'OFF'}`;
    status(machineMode ? 'Machine mode: on' : 'Machine mode: off');
  });

  // Resize => re-layout nodes and paths
  const ro = new ResizeObserver(() => layoutAll());
  ro.observe(stage);
}

function onNodeClick(e){
  const btn = e.target.closest('.node');
  if (!btn) return;
  const node = nodes[ +btn.dataset.index ];
  if (!node || node.removed) return;

  if (!startNode){
    // Start a new freehand path
    startNode = node;
    startedAt = performance.now();
    node.el.dataset.active = 'true';
    beginLivePathFrom(node);
    status(`Selected: ${node.title || 'image'}.`);
    progressWrap.hidden = true;

    // Mark start node as used immediately (and remove it)
    addUsedCaption(node);
    removeNode(node);
  } else {
    if (node === startNode){
      // clicking start again cancels
      cancelLive();
      startNode = null;
      status('Canceled');
      return;
    }
    // End the path at this node center
    appendPointAtNode(node);
    finalizeLivePath();
    const elapsedMs = performance.now() - startedAt;

    // Add end node to used list and remove it
    addUsedCaption(node);
    removeNode(node);

    // cleanup
    startNode = null;

    playProgress(elapsedMs);
    status(`Linked (${(elapsedMs/1000).toFixed(2)}s)`);
  }
}

// ---------- Remove node & log caption ----------
function removeNode(node){
  if (node.removed) return;
  node.removed = true;
  // soft fade out then remove
  node.el.style.transition = 'opacity 160ms ease, transform 160ms ease';
  node.el.style.opacity = '0';
  node.el.style.transform += ' scale(.92)';
  setTimeout(() => node.el.remove(), 170);
}

function addUsedCaption(node){
  const li = document.createElement('li');
  li.textContent = node.title || 'Untitled image';
  usedList.appendChild(li);
}

// ---------- Live freehand path ----------
function beginLivePathFrom(node){
  cancelLive(); // just in case
  livePointsPct = [];
  // seed with start node center
  const { xPct, yPct } = node;
  livePointsPct.push({ x: xPct, y: yPct });

  // create SVG path
  livePathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  livePathEl.classList.add('link', 'live');
  svg.appendChild(livePathEl);
  drawLivePath();
}

function onPointerMoveFree(e){
  if (!livePointsPct) return;
  const { innerW, innerH, padLeft, padTop } = innerSize();
  const x = clamp(e.clientX - (stage.getBoundingClientRect().left + padLeft), 0, innerW);
  const y = clamp(e.clientY - (stage.getBoundingClientRect().top  + padTop ), 0, innerH);

  // convert to percentages
  const xp = (x / innerW) * 100;
  const yp = (y / innerH) * 100;

  // avoid too-dense points
  const last = livePointsPct[livePointsPct.length - 1];
  if (!last || dist2(last.x, last.y, xp, yp) > 0.02) {
    livePointsPct.push({ x: xp, y: yp });
    drawLivePath();
  }
}

function appendPointAtNode(node){
  if (!livePointsPct) return;
  livePointsPct.push({ x: node.xPct, y: node.yPct });
  drawLivePath();
}

function drawLivePath(){
  if (!livePathEl || !livePointsPct || livePointsPct.length < 1) return;
  const { innerW, innerH } = innerSize();
  const d = toPathD(livePointsPct, innerW, innerH);
  livePathEl.setAttribute('d', d);
}

function finalizeLivePath(){
  if (!livePathEl || !livePointsPct || livePointsPct.length < 2) {
    cancelLive();
    return;
  }
  // finalize: remove 'live' class, store for future relayout
  livePathEl.classList.remove('live');
  paths.push({ pointsPct: livePointsPct.slice(), el: livePathEl });
  livePathEl = null;
  livePointsPct = null;
}

function cancelLive(){
  if (livePathEl) {
    livePathEl.remove();
    livePathEl = null;
  }
  livePointsPct = null;
}

// Convert percentage points to an SVG path string
function toPathD(pointsPct, w, h){
  const pts = pointsPct.map(p => [ (p.x/100)*w, (p.y/100)*h ]);
  if (pts.length === 1) {
    const [x,y] = pts[0];
    return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i=1;i<pts.length;i++){
    d += ` L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;
  }
  return d;
}

// ---------- Layout ----------
function layoutAll(){
  layoutNodes();
  layoutPaths();
}

function layoutNodes(){
  const { innerW, innerH, padLeft, padTop } = innerSize();
  nodes.forEach(n => {
    if (n.removed) return;
    const x = padLeft + (n.xPct / 100) * innerW;
    const y = padTop  + (n.yPct / 100) * innerH;
    n.el.style.left = `${x}px`;
    n.el.style.top  = `${y}px`;
  });

  // fit SVG to inner area
  svg.setAttribute('viewBox', `0 0 ${innerW} ${innerH}`);
  svg.setAttribute('width', innerW);
  svg.setAttribute('height', innerH);

  // keep live path in sync while drawing
  drawLivePath();
}

function layoutPaths(){
  const { innerW, innerH } = innerSize();
  paths.forEach(p => {
    p.el.setAttribute('d', toPathD(p.pointsPct, innerW, innerH));
  });
}

// ---------- Progress ----------
function playProgress(realMs){
  // Machine mode => super fast (fixed) progress
  const ms = machineMode ? 300 : clamp(realMs, 100, 120000);
  progressWrap.hidden = false;
  bar.style.transition = 'none';
  bar.style.width = '0%';
  void bar.offsetWidth; // reflow to restart
  bar.style.transition = `width ${ms}ms linear`;
  bar.style.width = '100%';
  ptime.textContent = (realMs/1000).toFixed(2) + 's';
  setTimeout(() => {
    bar.style.transition = 'width 300ms ease';
    bar.style.width = '0%';
  }, ms + 60);
}

// ---------- Helpers ----------
function innerSize(){
  const pad = getPadPx(); // same on all sides
  const rect = stage.getBoundingClientRect();
  return {
    innerW: rect.width  - pad*2,
    innerH: rect.height - pad*2,
    padLeft: pad,
    padTop: pad
  };
}
function getPadPx(){
  const v = getComputedStyle(document.documentElement).getPropertyValue('--pad').trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 14;
}
function status(msg){ statusEl.textContent = msg; }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function dist2(x1,y1,x2,y2){ const dx=x2-x1, dy=y2-y1; return dx*dx+dy*dy; }
