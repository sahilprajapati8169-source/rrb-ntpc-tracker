/* ============================
   UTILS.JS — Helper Functions
   ============================ */

// ---------- ID GENERATOR ----------
function generateId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// ---------- DATE HELPERS ----------
function todayStr() {
  // Returns "2026-10-03" format
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  // "2026-10-03" → "03 Oct 2026"
  if (!dateStr) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addDays(dateStr, days) {
  // "2026-10-03" + 5 → "2026-10-08"
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateStr1, dateStr2) {
  // Kitne din ka difference
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return daysBetween(dateStr, todayStr());
}

function isToday(dateStr) {
  return dateStr === todayStr();
}

function isPast(dateStr) {
  return dateStr < todayStr();
}

function isFuture(dateStr) {
  return dateStr > todayStr();
}

// ---------- TIME HELPERS ----------
function formatTime(minutes) {
  // 145 → "2h 25m"
  if (!minutes || minutes < 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTimer(seconds) {
  // 3725 → "01:02:05"
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function msToMinutes(ms) {
  return Math.round(ms / 1000 / 60);
}

// ---------- NUMBER HELPERS ----------
function percent(num, total) {
  if (!total || total === 0) return 0;
  return Math.round((num / total) * 100);
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// ---------- ARRAY HELPERS ----------
function sum(arr, key) {
  return arr.reduce((acc, item) => acc + (key ? item[key] : item), 0);
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// ---------- STRING HELPERS ----------
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function initials(name) {
  if (!name) return 'A';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ---------- DOM HELPERS ----------
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function show(el) {
  if (el) el.classList.remove('hidden');
}

function hide(el) {
  if (el) el.classList.add('hidden');
}

// ---------- TOAST ----------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 4px solid var(--${type});
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---------- CONFIRM ----------
function confirmAction(message) {
  return confirm(message);
}