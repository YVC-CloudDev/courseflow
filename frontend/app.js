'use strict';
let courses = [];
let assignments = [];
// ---- ID generator (replace with backend-generated IDs later) ----
function genId() {
  return '_' + Math.random().toString(36).slice(2, 10);
}

// ---- Data helpers (thin wrappers — swap for fetch() calls later) ----
function getCourses()                        { return courses; }
function getCourseById(id)                   { return courses.find(c => c.id === id); }
function addCourse(course)                   { courses.push(course); }
function getAssignmentsByCourse(courseId)    { return assignments.filter(a => a.courseId === courseId); }
function getAllAssignments()                 { return assignments; }
function addAssignment(assign)              { assignments.push(assign); }
function deleteAssignment(id)               { assignments = assignments.filter(a => a.id !== id); }
function updateAssignmentStatus(id, status) {
  const a = assignments.find(a => a.id === id);
  if (a) a.status = status;
}

// ============================================================
// STATE
// ============================================================

let currentView   = 'dashboard';
let selectedColor = '#6366f1';

// ============================================================
// ROUTER
// ============================================================

function navigateTo(view) {
  currentView = view;

  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.remove('hidden');

  const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', courses: 'My Courses' };
  document.getElementById('pageTitle').textContent = titles[view] || '';

  render();
}

// ============================================================
// RENDER ENGINE
// ============================================================

function render() {
  renderStats();
  renderProgress();

  if (currentView === 'dashboard') {
    renderDashboardCourses();
  } else if (currentView === 'courses') {
    renderCoursesPage();
  }
}

// ---- Stats ----
function renderStats() {
  const all   = getAllAssignments();
  const open  = all.filter(a => a.status === 'Open').length;
  const done  = all.filter(a => a.status === 'Done').length;

  document.getElementById('stat-courses').textContent = getCourses().length;
  document.getElementById('stat-total').textContent   = all.length;
  document.getElementById('stat-open').textContent    = open;
  document.getElementById('stat-done').textContent    = done;
}

// ---- Progress bar ----
function renderProgress() {
  const all  = getAllAssignments();
  const done = all.filter(a => a.status === 'Done').length;
  const pct  = all.length === 0 ? 0 : Math.round((done / all.length) * 100);

  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-bar').style.width  = pct + '%';
}

// ---- Dashboard: course cards ----
function renderDashboardCourses() {
  const list = document.getElementById('recent-assignments-list');
  const empty = document.getElementById('empty-state');

  const recent = getAllAssignments().slice(-5).reverse();

  if (recent.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  list.innerHTML = recent.map(a => {
    const course = getCourseById(a.courseId);
    const statusClass = a.status === 'Open' ? 'status-open'
      : a.status === 'In Progress' ? 'status-inprogress'
      : 'status-done';

    return `
      <div class="recent-item">
        <div>
          <div class="recent-title">${escHtml(a.title)}</div>
          <div class="recent-meta">${escHtml(course ? course.name : 'Unknown Course')} · ${formatDate(a.deadline)}</div>
        </div>

        <div class="assign-badges">
          <span class="priority-badge ${a.priority}">${a.priority}</span>
          <span class="status-select ${statusClass}">${a.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

function buildCourseCard(course) {
  const tasks   = getAssignmentsByCourse(course.id);
  const open    = tasks.filter(a => a.status !== 'Done').length;
  const done    = tasks.filter(a => a.status === 'Done').length;
  const initials = course.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="course-card">
      <div class="card-accent-bar" style="background:${course.color}"></div>
      <div class="card-body">
        <div class="card-header-row">
          <div class="card-course-icon" style="background:${course.color}">${initials}</div>
          <div class="card-meta">
            <div class="card-title">${escHtml(course.name)}</div>
            ${course.code ? `<div class="card-code">${escHtml(course.code)}</div>` : ''}
          </div>
        </div>
        <div class="card-stats-row">
          <span class="card-stat-pill">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
          <span class="card-stat-pill">${open} open</span>
          <span class="card-stat-pill">${done} done</span>
        </div>
        <button class="card-add-task-btn" data-course-id="${course.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add assignment
        </button>
      </div>
    </div>
  `;
}

// ---- Courses page: full sections ----
function renderCoursesPage() {
  const list = document.getElementById('courses-list');
  const cs   = getCourses();

  if (cs.length === 0) {
    list.innerHTML = buildEmptySection('No courses yet. Add your first course above.');
    return;
  }

  list.innerHTML = cs.map(c => buildCourseSection(c, true)).join('');
  attachSectionHandlers(list);
}



// ---- Build a course section (used in both course & assignment views) ----
function buildCourseSection(course, showAddBtn) {
  const tasks = getAssignmentsByCourse(course.id);

  const taskRows = tasks.map(a => buildAssignmentRow(a)).join('');

  const addRow = showAddBtn ? `
    <div class="add-assignment-row" data-course-id="${course.id}" style="${tasks.length > 0 ? 'border-top: 1px solid var(--border);' : ''}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add assignment
    </div>
  ` : '';

  const emptyMsg = tasks.length === 0
    ? `<div style="padding: 18px 0; color: var(--text-muted); font-size: 0.8rem;">No assignments yet.</div>`
    : '';

  return `
    <div class="course-section">
      <div class="course-section-header">
        <div class="section-accent-dot" style="background:${course.color}"></div>
        <span class="section-course-name">${escHtml(course.name)}</span>
        ${course.code ? `<span class="section-course-code">${escHtml(course.code)}</span>` : ''}
        <span class="section-task-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="course-section-body">
        ${emptyMsg}
        ${taskRows}
      </div>
      ${addRow}
    </div>
  `;
}

// ---- Build a single assignment row ----
function buildAssignmentRow(a) {
  const isDone     = a.status === 'Done';
  const statusClass = a.status === 'Open' ? 'status-open'
                    : a.status === 'In Progress' ? 'status-inprogress'
                    : 'status-done';

  const today      = new Date().toISOString().split('T')[0];
  const overdue    = a.deadline && a.deadline < today && a.status !== 'Done';
  const deadlineTxt = a.deadline ? formatDate(a.deadline) : '—';

  return `
    <div class="assignment-row" data-assignment-id="${a.id}">
      <div class="assign-check ${isDone ? 'done' : ''}" data-toggle-done="${a.id}" title="Toggle done"></div>
      <div class="assign-info">
        <div class="assign-title ${isDone ? 'strikethrough' : ''}">${escHtml(a.title)}</div>
        <div class="assign-deadline ${overdue ? 'overdue' : ''}">
          ${overdue ? '⚠ ' : ''}${deadlineTxt}
        </div>
      </div>
      <div class="assign-badges">
        <select class="status-select ${statusClass}" data-status-select="${a.id}">
          <option value="Open"        ${a.status === 'Open'        ? 'selected' : ''}>Open</option>
          <option value="In Progress" ${a.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Done"        ${a.status === 'Done'        ? 'selected' : ''}>Done</option>
        </select>
        <span class="priority-badge ${a.priority}">${a.priority}</span>
      </div>
      <div class="assign-actions">
        <button class="btn-icon btn-icon--red" data-delete-assign="${a.id}" title="Delete assignment">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

function buildEmptySection(msg) {
  return `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <p class="empty-title">${msg}</p>
    </div>
  `;
}

// ---- Attach event handlers inside a rendered list ----
function attachSectionHandlers(container) {
  // Add assignment from row
  container.querySelectorAll('.add-assignment-row').forEach(row => {
    row.addEventListener('click', () => openAssignmentModal(row.dataset.courseId));
  });

  // Toggle done via circle
  container.querySelectorAll('[data-toggle-done]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.toggleDone;
      const a  = assignments.find(x => x.id === id);
      if (!a) return;
      a.status = a.status === 'Done' ? 'Open' : 'Done';
      render();
    });
  });

  // Status select
  container.querySelectorAll('[data-status-select]').forEach(sel => {
    sel.addEventListener('change', () => {
      updateAssignmentStatus(sel.dataset.statusSelect, sel.value);
      render();
      showToast('Status updated');
    });
  });

  // Delete assignment
  container.querySelectorAll('[data-delete-assign]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this assignment?')) return;
      deleteAssignment(btn.dataset.deleteAssign);
      render();
      showToast('Assignment deleted', true);
    });
  });
}

// ============================================================
// MODALS
// ============================================================

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ---- Add Course Modal ----
function openCourseModal() {
  document.getElementById('course-name').value = '';
  document.getElementById('course-code').value = '';
  selectedColor = '#6366f1';
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === selectedColor);
  });
  openModal('modal-course');
  setTimeout(() => document.getElementById('course-name').focus(), 100);
}

function saveCourse() {
  const nameInput = document.getElementById('course-name');
  const codeInput = document.getElementById('course-code');

  const name = nameInput ? nameInput.value.trim() : '';
  const code = codeInput ? codeInput.value.trim() : '';

  if (!name) {
    showToast('Please enter a course name', true);
    return;
  }

  const newCourse = {
    id: genId(),
    name: name,
    code: code,
    color: selectedColor || '#6366f1'
  };

  addCourse(newCourse);

  closeModal('modal-course');

  if (nameInput) nameInput.value = '';
  if (codeInput) codeInput.value = '';

  render();
  showToast('Course added successfully!');
}

// ---- Add Assignment Modal ----
function openAssignmentModal(preselectedCourseId) {
  // Populate course dropdown
  const sel = document.getElementById('assign-course');
  sel.innerHTML = getCourses()
    .map(c => `<option value="${c.id}" ${c.id === preselectedCourseId ? 'selected' : ''}>${escHtml(c.name)}</option>`)
    .join('');

  document.getElementById('assign-title').value = '';
  document.getElementById('assign-deadline').value = '';
  document.getElementById('assign-priority').value = 'Medium';

  openModal('modal-assignment');
  setTimeout(() => document.getElementById('assign-title').focus(), 100);
}

function saveAssignment() {
  const title    = document.getElementById('assign-title').value.trim();
  const courseId = document.getElementById('assign-course').value;
  const deadline = document.getElementById('assign-deadline').value;
  const priority = document.getElementById('assign-priority').value;

  if (!title)    { showToast('Please enter an assignment title', true); return; }
  if (!courseId) { showToast('Please select a course', true); return; }

  addAssignment({ id: genId(), courseId, title, deadline, status: 'Open', priority });

  closeModal('modal-assignment');
  render();
  showToast('Assignment added!');
}

// ============================================================
// TOAST
// ============================================================

let toastTimer;

function showToast(msg, warn = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  clearTimeout(toastTimer);

  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<div class="toast-dot ${warn ? 'warn' : ''}"></div>${escHtml(msg)}`;
  document.body.appendChild(t);

  toastTimer = setTimeout(() => {
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

// ============================================================
// UTILITIES
// ============================================================

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================
// SIDEBAR MOBILE TOGGLE
// ============================================================

function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('menuToggle');

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  toggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('show', isOpen);
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
}

// ============================================================
// EVENT BINDING
// ============================================================

function bindEvents() {
  // Sidebar navigation
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.view);

      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.sidebar-overlay');

      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    });
  });

  // Topbar Add Course button
  const openAddCourseBtn = document.getElementById('openAddCourseModal');
  if (openAddCourseBtn) {
    openAddCourseBtn.addEventListener('click', openCourseModal);
  }

  // Topbar Add Assignment button
  const openAddAssignmentBtn = document.getElementById('openAddAssignmentModal');
  if (openAddAssignmentBtn) {
    openAddAssignmentBtn.addEventListener('click', () => {
      if (getCourses().length === 0) {
        showToast('Please add a course first', true);
        return;
      }

      openAssignmentModal(getCourses()[0].id);
    });
  }

  // Dashboard Add Course button, only if it exists
  const dashAddCourseBtn = document.getElementById('dashAddCourse');
  if (dashAddCourseBtn) {
    dashAddCourseBtn.addEventListener('click', openCourseModal);
  }

  // Empty state Add Course button
  const emptyAddCourseBtn = document.getElementById('emptyAddCourse');
  if (emptyAddCourseBtn) {
    emptyAddCourseBtn.addEventListener('click', openCourseModal);
  }

  // Courses page Add Course button, only if it exists
  const coursesPageAddCourseBtn = document.getElementById('coursesPageAddCourse');
  if (coursesPageAddCourseBtn) {
    coursesPageAddCourseBtn.addEventListener('click', openCourseModal);
  }

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Close modal when clicking overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Save course
  const saveCourseBtn = document.getElementById('saveCourse');
  if (saveCourseBtn) {
    saveCourseBtn.addEventListener('click', saveCourse);
  }

  // Save assignment
  const saveAssignmentBtn = document.getElementById('saveAssignment');
  if (saveAssignmentBtn) {
    saveAssignmentBtn.addEventListener('click', saveAssignment);
  }

  // Enter key in course modal
  const courseNameInput = document.getElementById('course-name');
  if (courseNameInput) {
    courseNameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveCourse();
    });
  }

  // Enter key in assignment modal
  const assignmentTitleInput = document.getElementById('assign-title');
  if (assignmentTitleInput) {
    assignmentTitleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveAssignment();
    });
  }

  // Color swatches
  const colorPicker = document.getElementById('color-picker');
  if (colorPicker) {
    colorPicker.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;

      selectedColor = swatch.dataset.color;

      document.querySelectorAll('.color-swatch').forEach(sw => {
        sw.classList.toggle('active', sw === swatch);
      });
    });
  }
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  setupSidebar();
  bindEvents();
  navigateTo('dashboard');
});