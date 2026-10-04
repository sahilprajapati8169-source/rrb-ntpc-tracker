/* ============================
   LAYOUT.JS — Sidebar + Header
   ============================ */

// ---------- PAGE PROTECTION ----------
(function checkAuth() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const publicPages = ['index.html', ''];

  if (publicPages.includes(currentPage)) return;

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
      <div class="notif-wrap">
        <button class="header-icon-btn" id="notifBtn" title="Notifications">
          🔔
          <span class="notif-badge hidden" id="notifBadge"></span>
        </button>
        <div class="notif-dropdown" id="notifDropdown">
          <div class="notif-header">
            <div class="notif-header-title">🔔 Notifications</div>
            <button class="notif-clear-btn" id="notifClearBtn">Mark all read</button>
          </div>
          <div id="notifList"></div>
        </div>
      </div>
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

  // User menu toggle
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenu = document.getElementById('userMenu');

  if (userMenuBtn && userMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      if (e.target.closest('#logoutMenuBtn')) return;
      e.stopPropagation();
      userMenu.classList.toggle('show');
    });

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

  // Notification Bell
  setupNotifications();
}

// ---------- TOGGLE OVERLAY ----------
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

// ---------- NOTIFICATIONS ----------
function setupNotifications() {
  const btn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  const clearBtn = document.getElementById('notifClearBtn');

  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show')) {
      renderNotifications();
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      saveData('rrb_notif_read', todayStr());
      renderNotifications();
      updateNotifBadge();
      showToast('All marked as read', 'success');
    });
  }

  updateNotifBadge();
}

// ---------- GET NOTIFICATIONS ----------
function getNotifications() {
  const list = [];
  const today = todayStr();

  const topics = getTopics();
  const overdueRevs = [];
  topics.forEach(t => {
    (t.revisions || []).forEach(r => {
      if (!r.done && r.dueDate < today) {
        overdueRevs.push({ topicName: t.name, days: daysBetween(r.dueDate, today) });
      }
    });
  });
  if (overdueRevs.length > 0) {
    list.push({
      icon: '🔴',
      title: `${overdueRevs.length} revision${overdueRevs.length > 1 ? 's' : ''} overdue`,
      desc: `Sabse purani: ${overdueRevs[0].topicName} (${overdueRevs[0].days}d late)`,
      action: 'revision.html',
      type: 'danger'
    });
  }

  const dueToday = [];
  topics.forEach(t => {
    (t.revisions || []).forEach(r => {
      if (!r.done && r.dueDate === today) {
        dueToday.push(t.name);
      }
    });
  });
  if (dueToday.length > 0) {
    list.push({
      icon: '🟡',
      title: `${dueToday.length} revision${dueToday.length > 1 ? 's' : ''} due today`,
      desc: 'Aaj ye revisions kar lo',
      action: 'revision.html',
      type: 'warning'
    });
  }

  const todayMin = getTotalStudyMinutes(getTodaySessions());
  const goal = getSettings().dailyGoal * 60;
  if (todayMin < goal && todayMin > 0) {
    const remaining = goal - todayMin;
    list.push({
      icon: '⏱️',
      title: `Aaj ka goal: ${Math.floor(remaining / 60)}h ${remaining % 60}m baaki`,
      desc: `${formatTime(todayMin)} / ${formatTime(goal)} padha`,
      action: 'timer.html',
      type: 'info'
    });
  } else if (todayMin >= goal && todayMin > 0) {
    list.push({
      icon: '🎉',
      title: 'Aaj ka goal complete!',
      desc: `${formatTime(todayMin)} padha — shabaash!`,
      action: 'dashboard.html',
      type: 'success'
    });
  }

  const streak = getStreak();
  if (streak.current > 0 && todayMin === 0) {
    list.push({
      icon: '🔥',
      title: 'Streak tod mat dena!',
      desc: `${streak.current} din ka streak chal raha hai`,
      action: 'timer.html',
      type: 'warning'
    });
  }

  const weakTopics = topics.filter(t => {
    if (t.confidence > 0 && t.confidence <= 2) return true;
    if (t.questions?.attempted >= 15) {
      const acc = percent(t.questions.correct, t.questions.attempted);
      if (acc < 65) return true;
    }
    return false;
  });
  if (weakTopics.length > 0) {
    list.push({
      icon: '⚠️',
      title: `${weakTopics.length} weak topic${weakTopics.length > 1 ? 's' : ''}`,
      desc: `${weakTopics[0].name} par dhyaan do`,
      action: 'mentor.html',
      type: 'danger'
    });
  }

  return list;
}

// ---------- RENDER NOTIFICATIONS ----------
function renderNotifications() {
  const container = document.getElementById('notifList');
  if (!container) return;

  const list = getNotifications();

  if (list.length === 0) {
    container.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">🎉</div>
        <p>Sab clear! Koi notification nahi.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(n => `
    <a href="${n.action}" class="notif-item ${n.type}">
      <div class="notif-item-icon">${n.icon}</div>
      <div class="notif-item-content">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-desc">${n.desc}</div>
      </div>
    </a>
  `).join('');
}

// ---------- UPDATE BADGE ----------
function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;

  const list = getNotifications();
  if (list.length > 0) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}