'use strict';

const API_BASE_URL = 'https://073nr9xy3a.execute-api.us-east-1.amazonaws.com';



let courses = [];
let assignments = [];

let currentView = 'dashboard';
let selectedColor = '#6366f1';

/* ============================================================
   API HELPERS
   ============================================================ */

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

async function loadDataFromApi() {
  try {
    courses = await apiRequest('/courses');
    assignments = await apiRequest('/assignments');

    render();
  } catch (error) {
    console.error('Failed to load data from API:', error);
    showToast('Failed to load data from AWS API', true);
  }
}

/* ============================================================
   DATA HELPERS
   ============================================================ */

function getCourses() {
  return courses;
}

function getCourseById(id) {
  return courses.find(course => course.id === id);
}

function getAssignmentsByCourse(courseId) {
  return assignments.filter(assignment => assignment.courseId === courseId);
}

function getAllAssignments() {
  return assignments;
}

/* ============================================================
   ROUTER
   ============================================================ */

function navigateTo(view) {
  currentView = view;

  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.add('hidden');
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const viewElement = document.getElementById(`view-${view}`);
  if (viewElement) {
    viewElement.classList.remove('hidden');
  }

  const navElement = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (navElement) {
    navElement.classList.add('active');
  }

  const titles = {
    dashboard: 'Dashboard',
    courses: 'My Courses'
  };

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = titles[view] || '';
  }

  render();
}

/* ============================================================
   RENDER ENGINE
   ============================================================ */

function render() {
  renderStats();
  renderProgress();

  if (currentView === 'dashboard') {
    renderDashboard();
  }

  if (currentView === 'courses') {
    renderCoursesPage();
  }
}

/* =========================
   STATS
   ========================= */

function renderStats() {
  const allAssignments = getAllAssignments();
  const openAssignments = allAssignments.filter(item => item.status === 'Open').length;
  const doneAssignments = allAssignments.filter(item => item.status === 'Done').length;

  setTextContent('stat-courses', getCourses().length);
  setTextContent('stat-total', allAssignments.length);
  setTextContent('stat-open', openAssignments);
  setTextContent('stat-done', doneAssignments);
}

function renderProgress() {
  const allAssignments = getAllAssignments();
  const doneAssignments = allAssignments.filter(item => item.status === 'Done').length;

  const progressPercent =
    allAssignments.length === 0
      ? 0
      : Math.round((doneAssignments / allAssignments.length) * 100);

  setTextContent('progress-pct', `${progressPercent}%`);

  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }
}

/* =========================
   DASHBOARD
   ========================= */

function renderDashboard() {
  const recentList = document.getElementById('recent-assignments-list');
  const emptyState = document.getElementById('empty-state');

  if (!recentList || !emptyState) {
    return;
  }

  const recentAssignments = getAllAssignments().slice(-5).reverse();

  if (recentAssignments.length === 0) {
    recentList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  recentList.innerHTML = recentAssignments.map(assignment => {
    const course = getCourseById(assignment.courseId);
    const statusClass = getStatusClass(assignment.status);

    return `
      <div class="recent-item">
        <div>
          <div class="recent-title">${escapeHtml(assignment.title)}</div>
          <div class="recent-meta">
            ${escapeHtml(course ? course.name : 'Unknown Course')} · ${formatDate(assignment.deadline)}
          </div>
        </div>

        <div class="assign-badges">
          <span class="priority-badge ${escapeHtml(assignment.priority)}">
            ${escapeHtml(assignment.priority)}
          </span>
          <span class="status-select ${statusClass}">
            ${escapeHtml(assignment.status)}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================
   COURSES PAGE
   ========================= */

function renderCoursesPage() {
  const list = document.getElementById('courses-list');

  if (!list) {
    return;
  }

  if (courses.length === 0) {
    list.innerHTML = buildEmptySection('No courses yet. Add your first course above.');
    return;
  }

  list.innerHTML = courses.map(course => buildCourseSection(course)).join('');
  attachCourseSectionHandlers(list);
}

function buildCourseSection(course) {
  const courseAssignments = getAssignmentsByCourse(course.id);
  const taskRows = courseAssignments.map(assignment => buildAssignmentRow(assignment)).join('');

  const emptyMessage = courseAssignments.length === 0
    ? `<div style="padding: 18px 0; color: var(--text-muted); font-size: 0.8rem;">No assignments yet.</div>`
    : '';

  return `
    <div class="course-section">
      <div class="course-section-header">
        <div class="section-accent-dot" style="background:${escapeHtml(course.color || '#6366f1')}"></div>
        <span class="section-course-name">${escapeHtml(course.name)}</span>
        ${course.code ? `<span class="section-course-code">${escapeHtml(course.code)}</span>` : ''}
        <span class="section-task-count">
          ${courseAssignments.length} task${courseAssignments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div class="course-section-body">
        ${emptyMessage}
        ${taskRows}
      </div>

      <div class="add-assignment-row" data-course-id="${escapeHtml(course.id)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add assignment
      </div>
    </div>
  `;
}

function buildAssignmentRow(assignment) {
  const isDone = assignment.status === 'Done';
  const statusClass = getStatusClass(assignment.status);
  const today = new Date().toISOString().split('T')[0];
  const overdue = assignment.deadline && assignment.deadline < today && assignment.status !== 'Done';

  return `
    <div class="assignment-row" data-assignment-id="${escapeHtml(assignment.id)}">
      <div
        class="assign-check ${isDone ? 'done' : ''}"
        data-toggle-done="${escapeHtml(assignment.id)}"
        title="Toggle done">
      </div>

      <div class="assign-info">
        <div class="assign-title ${isDone ? 'strikethrough' : ''}">
          ${escapeHtml(assignment.title)}
        </div>
        <div class="assign-deadline ${overdue ? 'overdue' : ''}">
          ${overdue ? '⚠ ' : ''}${formatDate(assignment.deadline)}
        </div>
      </div>

      <div class="assign-badges">
        <select class="status-select ${statusClass}" data-status-select="${escapeHtml(assignment.id)}">
          <option value="Open" ${assignment.status === 'Open' ? 'selected' : ''}>Open</option>
          <option value="In Progress" ${assignment.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Done" ${assignment.status === 'Done' ? 'selected' : ''}>Done</option>
        </select>

        <span class="priority-badge ${escapeHtml(assignment.priority)}">
          ${escapeHtml(assignment.priority)}
        </span>
      </div>

      <div class="assign-actions">
        <button class="btn-icon btn-icon--red" data-delete-assign="${escapeHtml(assignment.id)}" title="Delete assignment">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function buildEmptySection(message) {
  return `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <p class="empty-title">${escapeHtml(message)}</p>
    </div>
  `;
}

/* ============================================================
   COURSE SECTION EVENTS
   ============================================================ */

function attachCourseSectionHandlers(container) {
  container.querySelectorAll('.add-assignment-row').forEach(row => {
    row.addEventListener('click', () => {
      openAssignmentModal(row.dataset.courseId);
    });
  });

  container.querySelectorAll('[data-toggle-done]').forEach(item => {
    item.addEventListener('click', async () => {
      const assignmentId = item.dataset.toggleDone;
      const assignment = assignments.find(item => item.id === assignmentId);

      if (!assignment) {
        return;
      }

      const newStatus = assignment.status === 'Done' ? 'Open' : 'Done';
      await updateAssignmentStatusInApi(assignmentId, newStatus);
    });
  });

  container.querySelectorAll('[data-status-select]').forEach(select => {
    select.addEventListener('change', async () => {
      const assignmentId = select.dataset.statusSelect;
      const newStatus = select.value;

      await updateAssignmentStatusInApi(assignmentId, newStatus);
    });
  });

  container.querySelectorAll('[data-delete-assign]').forEach(button => {
    button.addEventListener('click', async () => {
      const assignmentId = button.dataset.deleteAssign;

      if (!confirm('Delete this assignment?')) {
        return;
      }

      await deleteAssignmentFromApi(assignmentId);
    });
  });
}

/* ============================================================
   API ACTIONS
   ============================================================ */

async function createCourseInApi(courseData) {
  const createdCourse = await apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  });

  courses.push(createdCourse);
  render();

  return createdCourse;
}

async function createAssignmentInApi(assignmentData) {
  const createdAssignment = await apiRequest('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  });

  assignments.push(createdAssignment);
  render();

  return createdAssignment;
}

async function updateAssignmentStatusInApi(assignmentId, status) {
  try {
    await apiRequest(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    assignments = assignments.map(assignment => {
      if (assignment.id === assignmentId) {
        return {
          ...assignment,
          status
        };
      }

      return assignment;
    });

    render();
    showToast('Status updated');
  } catch (error) {
    console.error('Failed to update assignment:', error);
    showToast('Failed to update assignment', true);
  }
}

async function deleteAssignmentFromApi(assignmentId) {
  try {
    await apiRequest(`/assignments/${assignmentId}`, {
      method: 'DELETE'
    });

    assignments = assignments.filter(assignment => assignment.id !== assignmentId);

    render();
    showToast('Assignment deleted');
  } catch (error) {
    console.error('Failed to delete assignment:', error);
    showToast('Failed to delete assignment', true);
  }
}

/* ============================================================
   MODALS
   ============================================================ */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}

function openCourseModal() {
  setInputValue('course-name', '');
  setInputValue('course-code', '');

  selectedColor = '#6366f1';

  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.toggle('active', swatch.dataset.color === selectedColor);
  });

  openModal('modal-course');

  setTimeout(() => {
    const input = document.getElementById('course-name');
    if (input) input.focus();
  }, 100);
}

async function saveCourse() {
  const name = getInputValue('course-name').trim();
  const code = getInputValue('course-code').trim();

  if (!name) {
    showToast('Please enter a course name', true);
    return;
  }

  try {
    await createCourseInApi({
      name,
      code,
      color: selectedColor || '#6366f1'
    });

    closeModal('modal-course');
    showToast('Course added successfully');
  } catch (error) {
    console.error('Failed to create course:', error);
    showToast('Failed to add course', true);
  }
}

function openAssignmentModal(preselectedCourseId) {
  const courseSelect = document.getElementById('assign-course');

  if (!courseSelect) {
    return;
  }

  courseSelect.innerHTML = courses
    .map(course => `
      <option value="${escapeHtml(course.id)}" ${course.id === preselectedCourseId ? 'selected' : ''}>
        ${escapeHtml(course.name)}
      </option>
    `)
    .join('');

  setInputValue('assign-title', '');
  setInputValue('assign-deadline', '');
  setInputValue('assign-priority', 'Medium');

  openModal('modal-assignment');

  setTimeout(() => {
    const input = document.getElementById('assign-title');
    if (input) input.focus();
  }, 100);
}

async function saveAssignment() {
  const courseId = getInputValue('assign-course');
  const title = getInputValue('assign-title').trim();
  const deadline = getInputValue('assign-deadline');
  const priority = getInputValue('assign-priority');

  if (!courseId) {
    showToast('Please select a course', true);
    return;
  }

  if (!title) {
    showToast('Please enter an assignment title', true);
    return;
  }

  try {
    await createAssignmentInApi({
      courseId,
      title,
      deadline,
      priority,
      status: 'Open'
    });

    closeModal('modal-assignment');
    showToast('Assignment added successfully');
  } catch (error) {
    console.error('Failed to create assignment:', error);
    showToast('Failed to add assignment', true);
  }
}

/* ============================================================
   TOAST
   ============================================================ */

let toastTimer;

function showToast(message, warn = false) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-dot ${warn ? 'warn' : ''}"></div>
    ${escapeHtml(message)}
  `;

  document.body.appendChild(toast);

  toastTimer = setTimeout(() => {
    toast.classList.add('fade-out');

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2600);
}

/* ============================================================
   SIDEBAR
   ============================================================ */

function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');

  if (!sidebar || !toggle) {
    return;
  }

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

/* ============================================================
   GLOBAL EVENTS
   ============================================================ */

function bindEvents() {
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();

      navigateTo(item.dataset.view);

      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.sidebar-overlay');

      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    });
  });

  bindClick('openAddCourseModal', openCourseModal);

  bindClick('openAddAssignmentModal', () => {
    if (courses.length === 0) {
      showToast('Please add a course first', true);
      return;
    }

    openAssignmentModal(courses[0].id);
  });

  bindClick('emptyAddCourse', openCourseModal);
  bindClick('saveCourse', saveCourse);
  bindClick('saveAssignment', saveAssignment);

  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
      closeModal(button.dataset.close);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  bindEnter('course-name', saveCourse);
  bindEnter('assign-title', saveAssignment);

  const colorPicker = document.getElementById('color-picker');

  if (colorPicker) {
    colorPicker.addEventListener('click', event => {
      const swatch = event.target.closest('.color-swatch');

      if (!swatch) {
        return;
      }

      selectedColor = swatch.dataset.color;

      document.querySelectorAll('.color-swatch').forEach(item => {
        item.classList.toggle('active', item === swatch);
      });
    });
  }
}

/* ============================================================
   UTILITIES
   ============================================================ */

function bindClick(id, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener('click', handler);
  }
}

function bindEnter(id, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        handler();
      }
    });
  }
}

function getInputValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : '';
}

function setInputValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function setTextContent(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function getStatusClass(status) {
  if (status === 'Done') {
    return 'status-done';
  }

  if (status === 'In Progress') {
    return 'status-inprogress';
  }

  return 'status-open';
}

function formatDate(dateString) {
  if (!dateString) {
    return '—';
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  setupSidebar();
  bindEvents();
  navigateTo('dashboard');
  loadDataFromApi();
});