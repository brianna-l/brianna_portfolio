const DATA_URL = "archive.json";
const HIGH_BAND = [0.10, 0.25];
const LOW_BASELINE = 0.70;

const SIZE_RANGE = [0.85, 1.35];
const SPEED_HIGH = [0.8, 1.6];
const SPEED_LOW  = [0.4, 1.0];
const GRAVITY = 0.9;
const HOP_RANGE = [-24, -10];
const AUTO_JUMP_MS = [1800, 5500];

// FLY tag motion
const FLY_SPEED = [0.6, 0.6];
const FLY_SIZE = 56;
const FLY_PUSH_COOLDOWN = 700;
//
const $scene = document.getElementById("scene");
const rand   = (a, b) => Math.random() * (b - a) + a;
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const vw     = () => window.innerWidth;
const vh     = () => window.innerHeight;
const mouse  = { x: -9999, y: -9999 };
window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });

async function loadFlightList() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first : [];
}

//
function makeTile(item, isHigh) {
  const el = document.createElement("div");
  el.className = "drifter";
  el.innerHTML = `
    <img src="${item.src}" alt="${item.title || ""}">
    <div class="cap">${item.title || ""}</div>
  `;

  // per-tile randomized aesthetics & speed
  const scale = rand(SIZE_RANGE[0], SIZE_RANGE[1]);
  const vx    = isHigh ? rand(SPEED_HIGH[0], SPEED_HIGH[1])
                       : rand(SPEED_LOW[0],  SPEED_LOW[1]);

  const x0 = rand(60, vw() - 180);
  const y0 = isHigh
    ? rand(vh() * HIGH_BAND[0], vh() * HIGH_BAND[1])
    : vh() * LOW_BASELINE;

  el._s = {
    x: x0, y: y0, vx, vy: 0, scale,
    isHigh,
    baseline: isHigh ? null : vh() * LOW_BASELINE,
    autoTimer: null,
    // promotion animation
    promoting: false,
    targetY: 0
  };

  // Low flyers: hop on hover + occasional auto hops
  if (!isHigh) {
    el.addEventListener("mouseenter", () => hop(el));
    scheduleAutoHop(el);
  }

  applyTransform(el);
  $scene.appendChild(el);
  return el;
}

function applyTransform(el) {
  const { x, y, scale } = el._s;
  el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

function hop(el) {
  const s = el._s;
  if (s.isHigh) return;
  if (s.y >= s.baseline - 1) s.vy = rand(HOP_RANGE[0], HOP_RANGE[1]);
}

function scheduleAutoHop(el) {
  const s = el._s;
  const delay = rand(AUTO_JUMP_MS[0], AUTO_JUMP_MS[1]);
  s.autoTimer = setTimeout(() => { hop(el); scheduleAutoHop(el); }, delay);
}

// =================== Updates ==================
function updateHigh(el) {
  const s = el._s;

  // Horizontal cruise + bounce at edges
  s.x += s.vx;
  if (s.x < 40 || s.x > vw() - 180) s.vx *= -1;

  // Cursor avoidance
  const dx = s.x - mouse.x, dy = s.y - mouse.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 220) {
    const push = (220 - dist) / 220 * 60; // up to ~60px shove
    s.x += (dx / (dist || 1)) * push;
    s.y += (dy / (dist || 1)) * (push * 0.5);
  }

  // Promotion easing (if recently promoted from low)
  if (s.promoting) {
    s.y = s.y * 0.85 + s.targetY * 0.15; // ease toward target band
    if (Math.abs(s.y - s.targetY) < 1) s.promoting = false;
  }

  // Keep in high band
  s.y = clamp(s.y, vh() * HIGH_BAND[0], vh() * HIGH_BAND[1]);

  applyTransform(el);
}

function updateLow(el) {
  const s = el._s;

  // Horizontal cruise + bounce at edges
  s.x += s.vx;
  if (s.x < 40 || s.x > vw() - 180) s.vx *= -1;

  // Hover/auto hop arc + gravity back to baseline
  s.vy += GRAVITY;
  s.y  += s.vy;
  if (s.y > s.baseline) { s.y = s.baseline; s.vy = 0; }

  // Keep hops visible (don’t intrude into high band too much)
  const maxRise = vh() * (LOW_BASELINE - 0.18);
  s.y = clamp(s.y, maxRise, s.baseline);

  applyTransform(el);
}

// =================== FLY tag ==================
function makeFlyTag(onClick) {
  const tag = document.createElement("button");
  tag.className = "fly-tag";
  tag.textContent = "BOOST";
  $scene.appendChild(tag);

  tag._s = {
    x: rand(40, vw() - 40 - FLY_SIZE),
    y: rand(vh() * 0.30, vh() * 0.60),
    vx: rand(FLY_SPEED[0], FLY_SPEED[1]) * (Math.random() < 0.5 ? -1 : 1),
    vy: rand(FLY_SPEED[0], FLY_SPEED[1]) * (Math.random() < 0.5 ? -1 : 1),
    lastClick: 0
  };

  tag.addEventListener("click", () => {
    const now = performance.now();
    if (now - tag._s.lastClick < FLY_PUSH_COOLDOWN) return; // debounce
    tag._s.lastClick = now;
    onClick();
  });

  function step() {
    const s = tag._s;
    s.x += s.vx; s.y += s.vy;

    // bounce inside viewport
    if (s.x < 8 || s.x > vw() - FLY_SIZE - 8) s.vx *= -1;
    if (s.y < 8 || s.y > vh() - FLY_SIZE - 8) s.vy *= -1;

    tag.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${(s.vx + s.vy) * 2}deg)`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  return tag;
}

// =================== Promotion =================
function promoteAll(lowArr, highArr) {
  // Move every low flyer into high band & behavior
  while (lowArr.length) {
    const el = lowArr.pop();
    const s = el._s;

    // stop auto hops
    if (s.autoTimer) { clearTimeout(s.autoTimer); s.autoTimer = null; }

    // convert to high flyer behavior
    s.isHigh = true;
    s.baseline = null;
    // speed up to high range (preserve direction)
    const dir = Math.sign(s.vx) || 1;
    s.vx = dir * rand(SPEED_HIGH[0], SPEED_HIGH[1]);
    // set a target in high band and ease toward it
    s.targetY = rand(vh() * HIGH_BAND[0], vh() * HIGH_BAND[1]);
    s.promoting = true;

    highArr.push(el);
  }
}

// =================== Main loop ================
function animate(high, low) {
  function frame() {
    high.forEach(updateHigh);
    low.forEach(updateLow);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// =================== Init =====================
async function init() {
  // Ensure full-viewport stage (no scrolling)
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  const flight = await loadFlightList();
  if (!flight.length) return;

  // Choose 1–2 high flyers; the rest are low
  const highCount = Math.floor(rand(1, 3));
  const tilesHigh = flight.slice(0, highCount).map(item => makeTile(item, true));
  const tilesLow  = flight.slice(highCount).map(item => makeTile(item, false));

  // Create roaming FLY tag
  makeFlyTag(() => promoteAll(tilesLow, tilesHigh));

  // Run
  animate(tilesHigh, tilesLow);
}

window.addEventListener("DOMContentLoaded", init);
