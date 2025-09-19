// --- Config
const DATA_URL = 'archive.json';
const PAGE_SIZE = 48;

// --- Elements
const galleryEl = document.getElementById('gallery');
const filtersEl = document.getElementById('filters');
const pagerEl   = document.getElementById('pager');

const dialog = document.getElementById('lightbox');
const dialogImg = document.getElementById('lightboxImg');
const dialogCap = document.getElementById('lightboxCap');
const dialogClose = dialog.querySelector('.lightbox__close');

let ARCHIVE = {};
let currentFilter = 'all';
let currentPage = 1;

// Lazy-load images
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const img = e.target;
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    io.unobserve(img);
  });
}, { rootMargin: '200px' });

// Helpers
function allItemsArray(filter = 'all'){
  const out = [];
  for (const [group, items] of Object.entries(ARCHIVE)) {
    items.forEach(item => {
      if (filter === 'all' || filter === group) out.push({...item, _group: group});
    });
  }
  return out;
}

function paginatedItems(items, page, pageSize){
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function makeCard(item){
  const li = document.createElement('li');
  li.innerHTML = `
    <figure>
      <img alt="${item.title.replace(/"/g, '&quot;')}"
           loading="lazy"
           data-src="${item.src}">
      <figcaption>${item.title}</figcaption>
    </figure>
  `;
  li.addEventListener('click', () => openLightbox(item));
  io.observe(li.querySelector('img'));
  return li;
}

// Render gallery (with pagination)
function render(){
  const items = allItemsArray(currentFilter);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, currentPage), totalPages);

  // build page items
  galleryEl.innerHTML = '';
  const pageItems = paginatedItems(items, currentPage, PAGE_SIZE);
  pageItems.forEach(item => galleryEl.appendChild(makeCard(item)));

  renderPager(totalPages);
}

// Render pager number bar
function renderPager(totalPages){
  // If only one page, hide bar
  if (totalPages <= 1){ pagerEl.innerHTML = ''; return; }

  const btnPrev = `<button class="pager__btn" data-page="prev" ${currentPage===1?'disabled':''} aria-label="Previous page">‹</button>`;
  const btnNext = `<button class="pager__btn" data-page="next" ${currentPage===totalPages?'disabled':''} aria-label="Next page">›</button>`;

  // Smart page list: 1 … (p-1) p (p+1) … N
  const nums = [];
  const addNum = (p) => {
    nums.push(`<button class="pager__btn pager__num ${p===currentPage?'is-active':''}" data-page="${p}" aria-label="Page ${p}">${p}</button>`);
  };
  const addEllipsis = () => nums.push(`<span class="pager__ellipsis">…</span>`);

  const windowSize = 1; // show neighbors around current
  const start = Math.max(1, currentPage - windowSize);
  const end   = Math.min(totalPages, currentPage + windowSize);

  // Always show 1
  addNum(1);
  if (start > 2) addEllipsis();

  for (let p = Math.max(2, start); p <= Math.min(end, totalPages-1); p++){
    addNum(p);
  }

  if (end < totalPages - 1) addEllipsis();
  if (totalPages > 1) addNum(totalPages);

  pagerEl.innerHTML = btnPrev + nums.join('') + btnNext;
}

// Pager clicks
pagerEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  const val = btn.getAttribute('data-page');

  const items = allItemsArray(currentFilter);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  if (val === 'prev') currentPage = Math.max(1, currentPage - 1);
  else if (val === 'next') currentPage = Math.min(totalPages, currentPage + 1);
  else currentPage = Number(val);

  render();
  // optional: scroll to top of gallery on page change
  galleryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Filters
filtersEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  currentPage = 1; // reset to first page on filter change
  filtersEl.querySelectorAll('.chip').forEach(b => b.classList.toggle('is-active', b === btn));
  render();
});

// Lightbox
function openLightbox(item) {
  dialogImg.src = item.src;
  dialogImg.alt = item.title;
  dialogCap.textContent = item.title;
  dialog.showModal();
}
dialogClose.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => {
  const fig = dialog.querySelector('.lightbox__figure').getBoundingClientRect();
  const outside = e.clientX < fig.left || e.clientX > fig.right || e.clientY < fig.top || e.clientY > fig.bottom;
  if (outside) dialog.close();
});
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dialog.open) dialog.close(); });

// Init
fetch(DATA_URL)
  .then(r => r.json())
  .then(json => { ARCHIVE = json; render(); })
  .catch(err => {
    galleryEl.innerHTML = `<p style="color:#c00">Failed to load archive: ${err.message}</p>`;
    pagerEl.innerHTML = '';
  });
