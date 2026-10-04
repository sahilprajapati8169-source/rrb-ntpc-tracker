/* ============================
   LAYOUT.JS — Sidebar + Header
   ============================ */


/* ============================
   LAYOUT.JS — Sidebar + Header
   ============================ */

// ---------- PAGE PROTECTION ----------
// Agar user logged in nahi hai → login page pe bhejo
(function checkAuth() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const publicPages = ['index.html', '']; // ye pages bina login khul sakte hain

  if (publicPages.includes(currentPage)) return; // login page pe check nahi karna

  // Check user
  const user = localStorage.getItem('rrb_user');
  if (!user) {
    window.location.href = 'index.html';
  }
})();


// ---------- MENU CONFIG ----------
const MENU_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',   icon: '🏠', href: 'dashboard.html' },
  { id: 'syllabus',      label: 'Syllabus',    icon: '📚', href: 'syllabus.html' },
  { id: 'timer',         label: 'Timer',       icon: '⏱️', href: 'timer.html' },
  { id: 'revision',      label: 'Revision',    icon: '🔁', href: 'revision.html' },
  { id: 'mistakes',      label: 'Mistakes',    icon: '❌', href: 'mistakes.html' },
  { id: 'mock',          label: 'Mock Tests',  icon: '📝', href: 'mock.html' },
  { id: 'flashcards',    label: 'Flashcards',  icon: '🃏', href: 'flashcards.html' },
  { id: 'mentor',        label: 'AI Mentor',   icon: '🧠', href: 'mentor.html' },
  { id: 'analytics',     label: 'Analytics',   icon: '📊', href: 'analytics.html' },
  { id: 'calendar',      label: 'Calendar',    icon: '📅', href: 'calendar.html' },
  { id: 'achievements',  label: 'Achievements', icon: '🏆', href: 'achievements.html' }
];

// ---------- GET CURRENT PAGE ----------
function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
  return file.replace('.html', '');
}

// ---------- GET USER ----------
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('rrb_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { name: 'Aspirant' };
}

// ---------- GET PAGE TITLE ----------
function getPageTitle(pageId) {
  const item = MENU_ITEMS.find(m => m.id === pageId);
  return item ? item.label : 'Dashboard';
}

// ---------- BUILD SIDEBAR ----------
function buildSidebar() {
  const currentPage = getCurrentPage();

  const navHTML = MENU_ITEMS.map(item => `
    <a href="${item.href}" 
       class="nav-item ${item.id === currentPage ? 'active' : ''}">
      <span class="nav-item-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  return `
    <a href="dashboard.html" class="sidebar-logo">
      <div class="sidebar-logo-icon">🎯</div>
      <span>RRB Tracker</span>
    </a>

    <nav class="sidebar-nav">
      ${navHTML}
    </nav>

    <div class="sidebar-footer">
      <button class="nav-item" id="logoutBtn" style="width: 100%; border: none; background: transparent; cursor: pointer; font-family: inherit; text-align: left;">
        <span class="nav-item-icon">🚪</span>
        <span>Logout</span>
      </button>
    </div>
  `;
}

// ---------- BUILD HEADER ----------
function buildHeader() {
  const currentPage = getCurrentPage();
  const title = getPageTitle(currentPage);
  const user = getCurrentUser();
  const initial = (user.name || 'A').charAt(0).toUpperCase();

  return `
    <div class="header-left">
      <button class="menu-toggle" id="menuToggle">☰</button>
      <h1 class="header-title">${title}</h1>
    </div>

    <div class="header-right">
      <button class="header-icon-btn" title="Notifications">🔔</button>
      <div class="header-user" id="userMenuBtn">
  <div class="header-user-avatar">${initial}</div>
  <span>${user.name}</span>
  <div class="header-user-menu" id="userMenu">
    <button class="header-user-menu-item" disabled style="cursor: default; color: var(--text-muted); font-size: 12px;">
      ${user.email || ''}
    </button>
    <hr style="border: none; border-top: 1px solid var(--border); margin: 4px 0;" />
    <button class="header-user-menu-item danger" id="logoutMenuBtn">
      🚪 Logout
    </button>
  </div>
</div>
    </div>
  `;
}

// ---------- RENDER LAYOUT ----------
function renderLayout() {
  const sidebarEl = document.getElementById('sidebar');
  const headerEl = document.getElementById('header');

  if (sidebarEl) sidebarEl.innerHTML = buildSidebar();
  if (headerEl) headerEl.innerHTML = buildHeader();

  attachLayoutEvents();
}

// ---------- LAYOUT EVENTS ----------
function attachLayoutEvents() {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      toggleOverlay();
    });
  }

  // Overlay create
  if (!document.querySelector('.overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // Logout
    // User menu toggle
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenu = document.getElementById('userMenu');

  if (userMenuBtn && userMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      if (e.target.closest('#logoutMenuBtn')) return;
      e.stopPropagation();
      userMenu.classList.toggle('show');
    });

    // Click outside → close menu
    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target)) {
        userMenu.classList.remove('show');
      }
    });
  }

  // Logout (from user menu)
  const logoutMenuBtn = document.getElementById('logoutMenuBtn');
if (logoutMenuBtn) {
  logoutMenuBtn.addEventListener('click', async () => {
    const ok = await confirmAction('Logout karna hai?', 'Logout');
    if (ok) {
      logout();
      window.location.href = 'index.html';
    }
  });
}

  // Sidebar Logout Button
  const sidebarLogoutBtn = document.getElementById('logoutBtn');
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', async () => {
      const ok = await confirmAction('Logout karna hai?', 'Logout');
      if (ok) {
        logout();
        window.location.href = 'index.html';
      }
    });
  }
}

function toggleOverlay() {
  const overlay = document.querySelector('.overlay');
  const sidebar = document.getElementById('sidebar');
  if (overlay && sidebar) {
    if (sidebar.classList.contains('open')) {
      overlay.classList.add('show');
    } else {
      overlay.classList.remove('show');
    }
  }
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', renderLayout);