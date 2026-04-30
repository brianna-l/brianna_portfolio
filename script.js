/* gallery */
const container = document.querySelector('.work-list');
const gridBtn = document.getElementById('grid-view');
const listBtn = document.getElementById('list-view');
const filterContainer = document.getElementById('list');

let currentView = 'grid';
let activeFilter = 'ALL';

/* 从数据里自动取出所有分类 */
function getAllCategories() {
  const set = new Set();

  projects.forEach(project => {
    project.categories.forEach(category => {
      set.add(category.toUpperCase());
    });
  });

  return ['ALL', ...set];
}

/* 根据当前筛选过滤 */
function getFilteredProjects() {
  if (activeFilter === 'ALL') return projects;

  return projects.filter(project =>
    project.categories.some(category => category.toUpperCase() === activeFilter)
  );
}

/* 渲染筛选列表 */
function renderFilters() {
  if (!filterContainer) return;

  filterContainer.innerHTML = '';

  const categories = getAllCategories();

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'filter-item';
    button.type = 'button';
    button.textContent = category;

    if (category === activeFilter) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      activeFilter = category;
      renderFilters();
      renderProjects(currentView);
    });

    filterContainer.appendChild(button);
  });
}

/* 渲染项目 */
function renderProjects(view = 'grid') {
  currentView = view;

  container.classList.remove('grid-view', 'list-view');
  container.classList.add(`${view}-view`);
  container.innerHTML = '';

  const filteredProjects = getFilteredProjects();

  filteredProjects.forEach(project => {
    const item = document.createElement('a');
    item.className = 'work';
    item.href = project.link;

    if (view === 'grid') {
      item.innerHTML = `
        <div class="desc">
          <h3>${project.title}</h3>
        </div>
        <img src="${project.image}" alt="${project.alt}" loading="lazy">
      `;
    } else {
      item.innerHTML = `
        <div class="meta">
          <p>${project.title}</p>
          <h3>${project.time}</h3>
          <h3>${project.categories.join(', ')}</h3>
        </div>
        <div class="hover-image">
          <img src="${project.image}" alt="${project.alt}" loading="lazy">
        </div>
      `;
    }

    container.appendChild(item);
  });

  updateViewButtons();
}

/* 更新 GRID / LIST 状态颜色 */
function updateViewButtons() {
  if (gridBtn) {
    gridBtn.classList.toggle('active', currentView === 'grid');
  }
  if (listBtn) {
    listBtn.classList.toggle('active', currentView === 'list');
  }
}

/* view toggle */
if (gridBtn) {
  gridBtn.addEventListener('click', () => {
    renderProjects('grid');
  });
}

if (listBtn) {
  listBtn.addEventListener('click', () => {
    renderProjects('list');
  });
}

/* init */
if (container) {
  renderFilters();
  renderProjects(currentView);
}