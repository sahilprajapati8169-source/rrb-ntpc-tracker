/* ============================
   CALENDAR.JS — Study Calendar
   ============================ */

// ---------- STATE ----------
let currentYear, currentMonth; // 0-11 month

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('calendarGrid')) return;

  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();

  renderCalendar();
  renderStats();
  attachEvents();
});

// ---------- EVENTS ----------
function attachEvents() {
  document.getElementById('prevBtn')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
    renderStats();
  });

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
    renderStats();
  });

  document.getElementById('todayBtn')?.addEventListener('click', () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    renderCalendar();
    renderStats();
  });

  // Day click (delegate)
  document.getElementById('calendarGrid')?.addEventListener('click', (e) => {
    const dayEl = e.target.closest('.calendar-day[data-date]');
    if (!dayEl) return;
    const date = dayEl.dataset.date;
    showDayDetail(date);
  });

  // Close modal
  document.getElementById('closeDayModal')?.addEventListener('click', () => {
    document.getElementById('dayModal').classList.remove('show');
  });

  document.getElementById('dayModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'dayModal') {
      e.target.classList.remove('show');
    }
  });
}

// ---------- RENDER CALENDAR ----------
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  const monthNames = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

  // Update label
  setText('monthLabel', `${monthNames[currentMonth]} ${currentYear}`);

  // Weekday headers (Monday first)
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Build first day info
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Monday-first: 0=Sun → 6, 1=Mon → 0
  let startWeekday = firstDay.getDay(); // 0=Sun, 1=Mon...
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1; // convert to Mon=0

  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = formatDateStr(today);

  // HTML build
  let html = '';

  // Weekday headers
  weekdays.forEach(w => {
    html += `<div class="calendar-weekday">${w}</div>`;
  });

  // Empty slots before first day
  for (let i = 0; i < startWeekday; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // Study hours for this date
    const sessions = getSessionsByDate(dateStr);
    const totalMin = getTotalStudyMinutes(sessions);
    const hours = totalMin / 60;

    // Color class
    let colorClass = '';
    if (hours >= 4) colorClass = 'study-high';
    else if (hours >= 1) colorClass = 'study-mid';
    else if (hours > 0) colorClass = 'study-low';

    const hoursLabel = hours > 0 ? `${hours.toFixed(1)}h` : '';

    html += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${colorClass}" data-date="${dateStr}">
        <div class="calendar-day-num">${day}</div>
        ${hoursLabel ? `<div class="calendar-day-hours">${hoursLabel}</div>` : ''}
      </div>
    `;
  }

  grid.innerHTML = html;
}

// ---------- STATS ----------
function renderStats() {
  // Current month's sessions
  const firstDay = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const lastDayDate = new Date(currentYear, currentMonth + 1, 0);
  const lastDay = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

  const allSessions = getSessions();
  const monthSessions = allSessions.filter(s => {
    const d = s.startTime?.split('T')[0];
    return d && d >= firstDay && d <= lastDay;
  });

  // Group by date
  const byDate = {};
  monthSessions.forEach(s => {
    const d = s.startTime?.split('T')[0];
    if (!d) return;
    if (!byDate[d]) byDate[d] = 0;
    byDate[d] += s.totalStudy || 0;
  });

  const studyDays = Object.keys(byDate).filter(d => byDate[d] > 0).length;
  const totalMin = Object.values(byDate).reduce((a, b) => a + b, 0);
  const totalHours = (totalMin / 60).toFixed(1);

  // Days in month so far
  const today = new Date();
  let daysForAvg = lastDayDate.getDate();
  if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
    daysForAvg = today.getDate();
  }

  const avg = daysForAvg > 0 ? (totalMin / 60 / daysForAvg).toFixed(1) : 0;

  // Best day
  let bestDate = '—';
  let bestMin = 0;
  Object.keys(byDate).forEach(d => {
    if (byDate[d] > bestMin) {
      bestMin = byDate[d];
      bestDate = formatDate(d);
    }
  });
  if (bestMin === 0) bestDate = '—';

  setText('statStudyDays', studyDays);
  setText('statMonthHours', totalHours + 'h');
  setText('statAvg', avg + 'h');
  setText('statBest', bestDate);
}

// ---------- DAY DETAIL MODAL ----------
function showDayDetail(dateStr) {
  const sessions = getSessionsByDate(dateStr);

  const totalStudy = getTotalStudyMinutes(sessions);
  const totalBreak = getTotalBreakMinutes(sessions);

  setText('modalDate', formatDate(dateStr));

  const subtext = sessions.length === 0 ? 'Aaj koi study nahi' : `${sessions.length} session${sessions.length > 1 ? 's' : ''}`;
  setText('modalSubtext', subtext);

  setText('modalStudy', formatTime(totalStudy));
  setText('modalBreak', formatTime(totalBreak));
  setText('modalSessions', sessions.length);

  // Session list
  const listEl = document.getElementById('modalSessionsList');
  if (!listEl) return;

  if (sessions.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <div class="empty-state-icon">😴</div>
        <p>Is din koi session nahi hua</p>
      </div>
    `;
  } else {
    listEl.innerHTML = sessions.map(s => {
      const startTime = s.startTime ? new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
      return `
        <div class="calendar-session-item">
          <div>
            <div class="calendar-session-name">${s.topic || s.subject || 'Study'}</div>
            <div class="calendar-session-time">${s.subject} • ${startTime}</div>
          </div>
          <div class="font-bold">${formatTime(s.totalStudy || 0)}</div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('dayModal').classList.add('show');
}

// ---------- HELPERS ----------
function formatDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}