/* ============================
   DASHBOARD.JS — Main Page Logic
   ============================ */

let studyChartInstance = null;

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('statSyllabus')) return; // not on dashboard page

  // Auto-copy yesterday's unfinished tasks
  checkAndCopyYesterday();

  renderWelcome();
  renderExamCountdown();
  renderStats();
  renderAIPlan();
  attachPlanEvents();
  renderWeeklyReport();
  renderProbability();
  renderRevisionDue();
  renderBreakAnalytics();
  renderStudyChart();
  initReminders();
  attachTemplateEvents();
  renderWeakSubtopics();    // ← YE NAYA
});

// ---------- WELCOME ----------
function renderWelcome() {
  const user = getUser();
  const hour = new Date().getHours();

  let greeting = 'Namaste';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  const welcomeText = document.getElementById('welcomeText');
  const welcomeSubtext = document.getElementById('welcomeSubtext');

  if (welcomeText) {
    welcomeText.textContent = `${greeting}, ${user?.name || 'Aspirant'} 👋`;
  }
  if (welcomeSubtext) {
    welcomeSubtext.textContent = 'Aaj kya padhna hai, dekhte hain!';
  }
}

// ---------- EXAM COUNTDOWN ----------
function renderExamCountdown() {
  const el = document.getElementById('examCountdown');
  if (!el) return;

  const examDate = getExamDate();
  const today = todayStr();

  // Agar exam date set nahi hai
  if (!examDate) {
    el.innerHTML = '📅 Set Exam Date';
    el.style.cursor = 'pointer';
    el.onclick = promptExamDate;
    el.style.background = 'rgba(255, 255, 255, 0.2)';
    return;
  }

  // Agar exam date past mein hai
  if (examDate < today) {
    el.innerHTML = `📅 Exam done (${formatDate(examDate)})`;
    el.style.cursor = 'pointer';
    el.onclick = promptExamDate;
    el.style.background = 'rgba(255, 255, 255, 0.2)';
    return;
  }

  const daysLeft = daysBetween(today, examDate);

  el.innerHTML = `⏳ ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} to Exam`;
  el.style.cursor = 'pointer';
  el.onclick = promptExamDate;

  // Color based on days left
  if (daysLeft <= 15) {
    el.style.background = 'rgba(239, 68, 68, 0.4)';
  } else if (daysLeft <= 30) {
    el.style.background = 'rgba(245, 158, 11, 0.4)';
  } else {
    el.style.background = 'rgba(255, 255, 255, 0.2)';
  }
}

// ---------- PROMPT EXAM DATE ----------
function promptExamDate() {
  const current = getExamDate() || '';
  const input = prompt(
    '📅 Exam date daalo (YYYY-MM-DD format)\n\nExample: 2026-12-15\n\nClear karne ke liye khaali chhodo',
    current
  );

  // Cancel button
  if (input === null) return;

  const trimmed = input.trim();

  // Clear exam date
  if (!trimmed) {
    setExamDate(null);
    renderExamCountdown();
    showToast('Exam date cleared', 'info');
    return;
  }

  // Format validate
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(trimmed)) {
    showToast('Format galat. Use YYYY-MM-DD ❌', 'danger');
    return;
  }

  // Date validate
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    showToast('Invalid date ❌', 'danger');
    return;
  }

  // Past date check
  if (trimmed < todayStr()) {
    showToast('Past date nahi daal sakte ❌', 'danger');
    return;
  }

  setExamDate(trimmed);
  renderExamCountdown();
  showToast('Exam date set! 📅', 'success');
}
// ---------- STATS ----------
function renderStats() {
  const topics = getTopics();
  const todaySessions = getTodaySessions();
  const streak = getStreak();
  const settings = getSettings();

  // Syllabus %
  const completed = topics.filter(t => t.status === 'completed').length;
  const totalTopics = topics.length;
  const syllabusPct = totalTopics > 0 ? percent(completed, totalTopics) : 0;

  setText('statSyllabus', syllabusPct + '%');
  setWidth('statSyllabusBar', syllabusPct);

  // Study Time Today
  const todayMinutes = getTotalStudyMinutes(todaySessions);
  setText('statStudyTime', formatTime(todayMinutes));
  setText('statStudySubtext', `Target: ${settings.dailyGoal}h`);

  // Streak
  setText('statStreak', streak.current + ' Days');
  setText('statStreakSubtext', `Longest: ${streak.longest}`);

  // Revision Due
  const dueRevisions = getDueRevisions();
  setText('statRevision', dueRevisions.length);
  setText('statRevisionSubtext', dueRevisions.length === 0 ? 'All caught up!' : 'Needs attention');
}

// ---------- DUE REVISIONS ----------
function getDueRevisions() {
  const topics = getTopics();
  const today = todayStr();
  const due = [];

  topics.forEach(topic => {
    (topic.revisions || []).forEach(rev => {
      if (!rev.done && rev.dueDate <= today) {
        due.push({
          topic: topic.name,
          topicId: topic.id,
          num: rev.num,
          dueDate: rev.dueDate,
          daysLate: daysBetween(rev.dueDate, today)
        });
      }
    });
  });

  return due.sort((a, b) => b.daysLate - a.daysLate);
}

// ---------- AI PLAN ----------
// ---------- DAILY PLAN ----------
let currentTaskType = 'study';
let currentTimeBlock = 'anytime';

function renderAIPlan() {
  const plan = getTodayPlanData();
  const tasks = plan.tasks || [];
  const listEl = document.getElementById('planList');
  if (!listEl) return;

  // Stats
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const totalMin = tasks.reduce((a, t) => a + (t.duration || 0), 0);
  const doneMin = tasks.filter(t => t.done).reduce((a, t) => a + (t.duration || 0), 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  setText('planStatTasks', `${done} / ${total}`);
  setText('planStatTime', `${formatTime(doneMin)} / ${formatTime(totalMin)}`);
  setText('planStatPct', pct + '%');

  // Color for pct
  const pctEl = document.getElementById('planStatPct');
  if (pctEl) {
    pctEl.className = 'plan-stat-value';
    if (pct >= 80) pctEl.classList.add('success');
    else if (pct >= 40) pctEl.classList.add('warning');
    else if (total > 0) pctEl.classList.add('danger');
  }

  // Progress bar
  setWidth('planProgressFill', pct);

  // Empty state
    // Empty state
  if (total === 0) {
    listEl.innerHTML = `
      <div class="plan-empty">
        <div class="plan-empty-icon">📝</div>
        <p>Aaj ka plan khaali hai</p>
        <p class="text-xs mt-2">"+ Add Task" click karke tasks add karo</p>
      </div>
    `;
  } else {
    // Group tasks by time block
    const blocks = {
      morning:   { label: '🌅 Morning',   tasks: [] },
      afternoon: { label: '☀️ Afternoon', tasks: [] },
      evening:   { label: '🌆 Evening',   tasks: [] },
      night:     { label: '🌙 Night',     tasks: [] },
      anytime:   { label: '🕐 Anytime',   tasks: [] }
    };

    tasks.forEach(t => {
      const block = t.timeBlock || 'anytime';
      if (blocks[block]) blocks[block].tasks.push(t);
      else blocks.anytime.tasks.push(t);
    });

    const order = ['morning', 'afternoon', 'evening', 'night', 'anytime'];
    let html = '';

    order.forEach(key => {
      const b = blocks[key];
      if (b.tasks.length === 0) return;
      const doneCount = b.tasks.filter(t => t.done).length;

      html += `
        <div class="time-block-section">
          <div class="time-block-heading">
            ${b.label}
            <span class="count">${doneCount}/${b.tasks.length}</span>
          </div>
          <div class="plan-list">
            ${b.tasks.map(t => renderPlanTask(t)).join('')}
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  // Update suggestions
  renderSuggestions();
}

// ---------- RENDER TASK ----------
function renderPlanTask(task) {
  const typeIcon = {
    study: '📖',
    revision: '🔁',
    practice: '📝',
    custom: '🎯'
  }[task.type || 'custom'];

  const durationText = task.duration ? `${task.duration}m` : '';

  return `
    <div class="plan-task ${task.done ? 'done' : ''}" data-task-id="${task.id}">
      <div class="plan-task-check" data-toggle-task>
        ${task.done ? '✓' : ''}
      </div>
      <div class="plan-task-content">
        <div class="plan-task-name">${typeIcon} ${escapeHtml(task.name)}</div>
        <div class="plan-task-meta">
          <span class="plan-task-type ${task.type || 'custom'}">${task.type || 'custom'}</span>
          ${durationText ? `<span>⏱ ${durationText}</span>` : ''}
          ${task.topicId ? `<a href="topic.html?id=${task.topicId}" style="color: var(--primary); font-size: 11px;">View Topic →</a>` : ''}
        </div>
      </div>
      <div class="plan-task-actions">
        <button class="plan-task-btn" data-start-task title="Start Timer">⏱</button>
        <button class="plan-task-btn danger" data-delete-task title="Delete">🗑️</button>
      </div>
    </div>
  `;
}

// ---------- SUGGESTIONS ----------
function renderSuggestions() {
  const container = document.getElementById('suggestionChips');
  if (!container) return;

  const suggestions = [];

  // 1. Weak topics
  const topics = getTopics();
  const weak = topics.filter(t => {
    if (t.confidence > 0 && t.confidence <= 2) return true;
    if (t.questions?.attempted >= 15) {
      const acc = percent(t.questions.correct, t.questions.attempted);
      if (acc < 65) return true;
    }
    return false;
  }).slice(0, 2);

  weak.forEach(t => {
    suggestions.push({
      icon: '⚠️',
      label: t.name,
      type: 'study',
      duration: 45,
      topicId: t.id
    });
  });

  // 2. Revision due
  const today = todayStr();
  const dueRevs = [];
  topics.forEach(t => {
    (t.revisions || []).forEach(r => {
      if (!r.done && r.dueDate <= today) {
        dueRevs.push({ name: t.name, topicId: t.id });
      }
    });
  });
  dueRevs.slice(0, 2).forEach(r => {
    suggestions.push({
      icon: '🔁',
      label: `Revise: ${r.name}`,
      type: 'revision',
      duration: 20,
      topicId: r.topicId
    });
  });

  // 3. Not started topics
  const notStarted = topics.filter(t => t.status === 'not_started').slice(0, 2);
  notStarted.forEach(t => {
    suggestions.push({
      icon: '📖',
      label: t.name,
      type: 'study',
      duration: 40,
      topicId: t.id
    });
  });

  if (suggestions.length === 0) {
    container.innerHTML = '<span class="text-xs text-muted">Abhi koi suggestion nahi</span>';
    return;
  }

  container.innerHTML = suggestions.map((s, i) => `
    <button class="plan-suggestion-chip" data-suggestion-idx="${i}">
      ${s.icon} ${s.label} (${s.duration}m)
    </button>
  `).join('');

  // Store suggestions globally for click
  window._planSuggestions = suggestions;
}

// ---------- ATTACH TASK EVENTS ----------
function attachPlanEvents() {
  // Toggle add form
  document.getElementById('toggleAddTaskBtn')?.addEventListener('click', () => {
    document.getElementById('addTaskForm').classList.toggle('hidden');
  });

  // Cancel
  document.getElementById('cancelTaskBtn')?.addEventListener('click', () => {
    document.getElementById('addTaskForm').classList.add('hidden');
    resetTaskForm();
  });

  // Type chips
  document.getElementById('taskTypeChips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.plan-type-chip');
    if (!chip) return;
    document.querySelectorAll('#taskTypeChips .plan-type-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentTaskType = chip.dataset.type;
  });

    // Time block chips
  document.getElementById('timeBlockChips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.plan-time-chip');
    if (!chip) return;
    document.querySelectorAll('#timeBlockChips .plan-time-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentTimeBlock = chip.dataset.block;
  });

  // Save task
  document.getElementById('saveTaskBtn')?.addEventListener('click', saveNewTask);

  // Enter key in inputs
  ['taskName', 'taskDuration'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveNewTask();
    });
  });

  // Clear all
  document.getElementById('clearPlanBtn')?.addEventListener('click', async () => {
    const ok = await confirmAction('Aaj ka pura plan delete karna hai?', 'Clear Plan');
    if (ok) {
      clearTodayPlan();
      renderAIPlan();
      showToast('Plan cleared', 'info');
    }
  });

  // Suggestion chips
  document.getElementById('suggestionChips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-suggestion-idx]');
    if (!chip) return;
    const idx = parseInt(chip.dataset.suggestionIdx);
    const s = (window._planSuggestions || [])[idx];
    if (!s) return;

    addPlanTask({
      name: s.label,
      type: s.type,
      duration: s.duration,
      topicId: s.topicId
    });
    renderAIPlan();
    showToast(`Task added: ${s.label}`, 'success');
  });

  // Task list actions
  document.getElementById('planList')?.addEventListener('click', async (e) => {
    const taskEl = e.target.closest('[data-task-id]');
    if (!taskEl) return;
    const taskId = taskEl.dataset.taskId;

    // Toggle done
    if (e.target.closest('[data-toggle-task]')) {
      const task = getTodayPlanData().tasks.find(t => t.id === taskId);
      if (!task) return;
      updatePlanTask(taskId, { done: !task.done });
      renderAIPlan();
      return;
    }

    // Start timer
    if (e.target.closest('[data-start-task]')) {
      const task = getTodayPlanData().tasks.find(t => t.id === taskId);
      if (!task) return;
      const url = task.topicId ? `timer.html?id=${task.topicId}` : 'timer.html';
      window.location.href = url;
      return;
    }

    // Delete
    if (e.target.closest('[data-delete-task]')) {
      const ok = await confirmAction('Task delete karna hai?', 'Delete Task');
      if (ok) {
        deletePlanTask(taskId);
        renderAIPlan();
        showToast('Task deleted', 'info');
      }
      return;
    }
  });
    // Test Reminder Button
  document.getElementById('testReminderBtn')?.addEventListener('click', () => {
    if (!('Notification' in window)) {
      showToast('Browser notifications support nahi karta ❌', 'danger');
      return;
    }

    if (Notification.permission === 'granted') {
      // Direct notification
      new Notification('🔔 Test Reminder', {
        body: 'Notifications kaam kar rahe hain! Ab tumhe reminders milenge.',
        icon: '/favicon.ico'
      });
      showToast('Test notification bheji! 🔔', 'success');
    } else if (Notification.permission === 'denied') {
      showToast('Notifications blocked hain. Browser settings se allow karo ❌', 'danger');
    } else {
      // Ask permission
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification('🔔 Test Reminder', {
            body: 'Notifications enabled! Ab tumhe reminders milenge.',
            icon: '/favicon.ico'
          });
          showToast('Notifications enabled 🔔', 'success');
        } else {
          showToast('Permission denied', 'warning');
        }
      });
    }
  });
}

// ---------- SAVE NEW TASK ----------
function saveNewTask() {
  const name = document.getElementById('taskName').value.trim();
  const duration = parseInt(document.getElementById('taskDuration').value) || 0;

  if (!name) {
    showToast('Task name required ❌', 'danger');
    return;
  }

    addPlanTask({
    name,
    type: currentTaskType,
    duration,
    timeBlock: currentTimeBlock    // ← Ye line add karo
  });

  resetTaskForm();
  renderAIPlan();
  showToast('Task added ✅', 'success');
}

function resetTaskForm() {
  document.getElementById('taskName').value = '';
  document.getElementById('taskDuration').value = '';
  currentTaskType = 'study';
  currentTimeBlock = 'anytime';   // ← Ye line add karo

  document.querySelectorAll('#taskTypeChips .plan-type-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.type === 'study');
  });

  // ← Ye 3 lines add karo (time chips reset)
  document.querySelectorAll('#timeBlockChips .plan-time-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.block === 'anytime');
  });
}

// ---------- HELPERS ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- AI PLAN LOGIC ----------
function generateTodayPlan() {
  const topics = getTopics();
  const today = todayStr();
  const scored = [];

  topics.forEach(topic => {
    let score = 0;
    let reason = '';
    let priority = 'normal';

    // Overdue revision (highest priority)
    const overdueRevs = (topic.revisions || []).filter(r => !r.done && r.dueDate < today);
    if (overdueRevs.length > 0) {
      score += 60;
      reason = `Revision ${overdueRevs[0].num} overdue (${daysBetween(overdueRevs[0].dueDate, today)} din)`;
      priority = 'high';
    }
    // Due today
    else {
      const dueToday = (topic.revisions || []).filter(r => !r.done && r.dueDate === today);
      if (dueToday.length > 0) {
        score += 40;
        reason = `Revision ${dueToday[0].num} due today`;
        priority = 'medium';
      }
    }

    // Weak accuracy
    if (topic.questions && topic.questions.attempted > 10) {
      const acc = percent(topic.questions.correct, topic.questions.attempted);
      if (acc < 70) {
        score += 30;
        if (!reason) reason = `Accuracy ${acc}% — weak`;
        priority = 'high';
      }
    }

    // Low confidence
    if (topic.confidence > 0 && topic.confidence <= 2) {
      score += 20;
      if (!reason) reason = `Confidence low (${topic.confidence}/5)`;
      priority = priority === 'high' ? 'high' : 'medium';
    }

    // Not started (lowest priority)
    if (topic.status === 'not_started') {
      score += 5;
      if (!reason) reason = 'Not started yet';
    }

    if (score > 0) {
      scored.push({ topic, score, reason, priority });
    }
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

// ---------- PROBABILITY ----------
function renderProbability() {
  const prob = calculateProbability();
  setText('probValue', prob + '%');
  setWidth('probBar', prob);

  // Color
  const bar = document.getElementById('probBar');
  if (bar) {
    bar.className = 'progress-bar';
    if (prob >= 75) bar.classList.add('success');
    else if (prob >= 50) bar.classList.add('warning');
    else bar.classList.add('danger');
  }
}

function calculateProbability() {
  const topics = getTopics();
  if (topics.length === 0) return 0;

  // Syllabus %
  const completed = topics.filter(t => t.status === 'completed').length;
  const syllabusPct = percent(completed, topics.length);

  // Accuracy
  const withQs = topics.filter(t => t.questions && t.questions.attempted > 0);
  let accuracy = 0;
  if (withQs.length > 0) {
    const totalAttempted = withQs.reduce((a, t) => a + t.questions.attempted, 0);
    const totalCorrect = withQs.reduce((a, t) => a + t.questions.correct, 0);
    accuracy = totalAttempted > 0 ? percent(totalCorrect, totalAttempted) : 0;
  }

  // Mock Avg
  const mocks = getMocks();
  let mockAvg = 0;
  if (mocks.length > 0) {
    const total = mocks.reduce((a, m) => a + (m.score || 0), 0);
    const maxTotal = mocks.reduce((a, m) => a + (m.total || 100), 0);
    mockAvg = maxTotal > 0 ? percent(total, maxTotal) : 0;
  }

  // Consistency (streak based)
  const streak = getStreak();
  const consistency = clamp(streak.current * 10, 0, 100);

  // Weighted
  const prob = (syllabusPct * 0.3) + (accuracy * 0.3) + (mockAvg * 0.3) + (consistency * 0.1);
  return Math.round(prob);
}

// ---------- REVISION DUE LIST ----------
function renderRevisionDue() {
  const list = document.getElementById('revisionList');
  const subtext = document.getElementById('revisionSubtext');
  if (!list) return;

  const due = getDueRevisions();

  if (subtext) {
    subtext.textContent = due.length === 0 ? 'All caught up!' : `${due.length} pending`;
  }

  if (due.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <p>Sab revisions done! Shabaash!</p>
      </div>
    `;
    return;
  }

  list.innerHTML = due.slice(0, 5).map(r => `
    <div class="revision-item">
      <div>
        <div class="revision-item-name">${r.topic}</div>
        <div class="text-xs text-muted">R${r.num} • ${formatDate(r.dueDate)}</div>
      </div>
      <div class="revision-item-days">
        ${r.daysLate === 0 ? 'Today' : r.daysLate + 'd late'}
      </div>
    </div>
  `).join('');
}

// ---------- BREAK ANALYTICS ----------
function renderBreakAnalytics() {
  const container = document.getElementById('breakAnalytics');
  if (!container) return;

  const todaySessions = getTodaySessions();

  if (todaySessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">☕</div>
        <p>Aaj abhi koi session nahi. Timer start karo!</p>
      </div>
    `;
    return;
  }

  let shortBreaks = 0, mediumBreaks = 0, longBreaks = 0;
  let totalBreak = 0, totalStudy = 0, longestFocus = 0;

  todaySessions.forEach(s => {
    totalStudy += s.totalStudy || 0;
    totalBreak += s.totalBreak || 0;
    if ((s.longestFocus || 0) > longestFocus) longestFocus = s.longestFocus;

    (s.segments || []).forEach(seg => {
      if (seg.type === 'break') {
        if (seg.duration <= 5) shortBreaks++;
        else if (seg.duration <= 15) mediumBreaks++;
        else longBreaks++;
      }
    });
  });

  const totalTime = totalStudy + totalBreak;
  const focusRatio = totalTime > 0 ? percent(totalStudy, totalTime) : 0;

  container.innerHTML = `
    <div class="grid grid-2 gap-3">
      <div class="stat-card">
        <div class="stat-label">Total Study</div>
        <div class="stat-value" style="font-size: 18px;">${formatTime(totalStudy)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Break</div>
        <div class="stat-value" style="font-size: 18px;">${formatTime(totalBreak)}</div>
      </div>
    </div>

    <div class="mt-3">
      <div class="flex-between text-sm mb-2">
        <span class="text-muted">Focus Ratio</span>
        <span class="font-bold">${focusRatio}%</span>
      </div>
      <div class="progress">
        <div class="progress-bar success" style="width: ${focusRatio}%;"></div>
      </div>
    </div>

    <div class="mt-4 text-sm">
      <div class="flex-between mb-2">
        <span class="text-muted">☕ Short (≤5m)</span>
        <span class="font-semibold">${shortBreaks}</span>
      </div>
      <div class="flex-between mb-2">
        <span class="text-muted">🍵 Medium (5-15m)</span>
        <span class="font-semibold">${mediumBreaks}</span>
      </div>
      <div class="flex-between">
        <span class="text-muted">🍽️ Long (>15m)</span>
        <span class="font-semibold">${longBreaks}</span>
      </div>
    </div>

    <div class="text-xs text-muted text-center mt-3">
      Longest focus: <strong>${formatTime(longestFocus)}</strong>
    </div>
  `;
}

// ---------- STUDY CHART ----------
function renderStudyChart() {
  const canvas = document.getElementById('studyChart');
  if (!canvas) return;

  // Last 7 days data
  const labels = [];
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = addDays(todayStr(), -i);
    const sessions = getSessionsByDate(date);
    const minutes = getTotalStudyMinutes(sessions);
    const hours = +(minutes / 60).toFixed(1);

    labels.push(formatDate(date).split(' ').slice(0, 2).join(' ')); // "03 Oct"
    data.push(hours);
  }

  if (studyChartInstance) studyChartInstance.destroy();

  studyChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours',
        data: data,
        backgroundColor: '#4F46E5',
        borderRadius: 6,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}h studied`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: '#F3F4F6' }
        },
        x: {
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ---------- HELPERS ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = clamp(pct, 0, 100) + '%';
}


// ---------- DAILY RESET + COPY ----------
function checkAndCopyYesterday() {
  const today = todayStr();
  const lastCheckKey = 'rrb_last_plan_check';
  const lastCheck = getData(lastCheckKey, null);

  // Aaj already check ho chuka hai?
  if (lastCheck === today) return;

  // Check karo kal ke unfinished tasks hain?
  const copied = copyUnfinishedFromYesterday();

  // Aaj ka check mark karo
  saveData(lastCheckKey, today);

  // Toast only if kuch copy hua
  if (copied > 0) {
    setTimeout(() => {
      showToast(`${copied} task${copied > 1 ? 's' : ''} copied from yesterday 📋`, 'info');
    }, 800);
  }
}


// ---------- WEEKLY REPORT ----------
function renderWeeklyReport() {
  const container = document.getElementById('weeklyReport');
  const statsEl = document.getElementById('weeklyStats');
  if (!container) return;

  const history = getPlanHistory(7);

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <div class="empty-state-icon">📊</div>
        <p>Abhi koi plan data nahi</p>
        <p class="text-xs mt-2">Tasks add karo aur aaj ka plan banao</p>
      </div>
    `;
    if (statsEl) statsEl.innerHTML = '<p class="text-muted text-sm text-center">Data nahi</p>';
    return;
  }

  // Bars
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let totalTasks = 0;
  let totalDone = 0;
  let totalPlannedMin = 0;
  let totalDoneMin = 0;
  let bestDay = { date: null, pct: -1 };
  let worstDay = { date: null, pct: 101 };

  const barsHTML = history.map(h => {
    const pct = h.total > 0 ? Math.round((h.done / h.total) * 100) : 0;
    const d = new Date(h.date);
    const dayName = weekdays[d.getDay()];

    totalTasks += h.total;
    totalDone += h.done;
    totalPlannedMin += h.plannedMin || 0;
    totalDoneMin += h.doneMin || 0;

    if (h.total > 0) {
      if (pct > bestDay.pct) bestDay = { date: h.date, pct };
      if (pct < worstDay.pct) worstDay = { date: h.date, pct };
    }

    return `
      <div class="week-bar-wrap">
        <div class="week-bar-pct">${pct}%</div>
        <div class="week-bar ${h.total === 0 ? 'empty' : ''}" 
             style="height: ${Math.max(pct, 4)}%;"
             title="${formatDate(h.date)}: ${h.done}/${h.total}"></div>
        <div class="week-bar-label">${dayName}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="week-bars">${barsHTML}</div>
    <div class="week-summary">
      <div class="week-summary-item">
        <div class="week-summary-value best">${formatDate(bestDay.date).split(' ').slice(0, 2).join(' ')}</div>
        <div class="week-summary-label">🏆 Best Day (${bestDay.pct}%)</div>
      </div>
      <div class="week-summary-item">
        <div class="week-summary-value weak">${formatDate(worstDay.date).split(' ').slice(0, 2).join(' ')}</div>
        <div class="week-summary-label">⚠️ Weakest (${worstDay.pct}%)</div>
      </div>
    </div>
  `;

  // Stats card
  if (statsEl) {
    const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    statsEl.innerHTML = `
      <div class="grid grid-2 gap-3">
        <div class="stat-card">
          <div class="stat-label">Tasks Done</div>
          <div class="stat-value">${totalDone} / ${totalTasks}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completion</div>
          <div class="stat-value">${overallPct}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Planned Time</div>
          <div class="stat-value">${formatTime(totalPlannedMin)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Done Time</div>
          <div class="stat-value">${formatTime(totalDoneMin)}</div>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex-between text-sm mb-2">
          <span class="text-muted">Weekly Progress</span>
          <span class="font-bold">${overallPct}%</span>
        </div>
        <div class="progress progress-lg">
          <div class="progress-bar success" style="width: ${overallPct}%;"></div>
        </div>
      </div>
    `;
  }
}

// ---------- REMINDERS ----------
function initReminders() {
  // Browser support check
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  // Ask permission after 30 seconds (so user can interact first)
  if (Notification.permission === 'default') {
    setTimeout(() => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          showToast('Reminders enabled 🔔', 'success');
        }
      });
    }, 30000); // 30 sec baad
  }

  // Check reminders every 5 minutes
  setInterval(checkReminders, 5 * 60 * 1000);

  // Initial check after 10 seconds
  setTimeout(checkReminders, 10000);
}

function checkReminders() {
  // Permission check
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const today = todayStr();
  const lastReminderKey = 'rrb_last_reminder_' + today;
  const lastReminder = getData(lastReminderKey, 0);
  const now = Date.now();

  // Ek reminder har 2 ghante mein max
  if (now - lastReminder < 2 * 60 * 60 * 1000) return;

  const plan = getTodayPlanData();
  const tasks = plan.tasks || [];
  const pending = tasks.filter(t => !t.done);

  if (pending.length === 0) return;

  const hour = new Date().getHours();

  // Sirf 9 AM - 9 PM ke beech reminder
  if (hour < 9 || hour > 21) return;

  // Message banao
  const pendingMin = pending.reduce((a, t) => a + (t.duration || 0), 0);
  const message = `${pending.length} task${pending.length > 1 ? 's' : ''} pending (${formatTime(pendingMin)}). Focus karo! 💪`;

  try {
    new Notification('📅 RRB Tracker Reminder', {
      body: message,
      icon: '/favicon.ico',
      tag: 'rrb-reminder',
      requireInteraction: false
    });
    saveData(lastReminderKey, now);
  } catch (e) {
    console.log('Notification error:', e);
  }
}


// ---------- TEMPLATES ----------
function renderTemplates() {
  const container = document.getElementById('templatesList');
  if (!container) return;

  const templates = getPlanTemplates();

  if (templates.length === 0) {
    container.innerHTML = `
      <div class="template-empty">
        <p style="font-size: 32px; margin-bottom: 8px;">📋</p>
        <p>Abhi koi template nahi</p>
        <p class="text-xs mt-2">Aaj ka plan banao, phir "Save as Template" click karo</p>
      </div>
    `;
    return;
  }

  container.innerHTML = templates.map(t => {
    const totalMin = t.tasks.reduce((a, task) => a + (task.duration || 0), 0);
    return `
      <div class="template-card">
        <div class="template-info">
          <div class="template-name">${escapeHtml(t.name)}</div>
          <div class="template-meta">${t.tasks.length} task${t.tasks.length > 1 ? 's' : ''} • ${formatTime(totalMin)}</div>
        </div>
        <div class="template-actions">
          <button class="btn btn-primary btn-sm" data-apply-template="${t.id}">Apply</button>
          <button class="btn btn-ghost btn-sm" data-delete-template="${t.id}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openTemplatesPanel() {
  const panel = document.getElementById('templatesPanel');
  if (!panel) return;

  // Add backdrop
  if (!document.querySelector('.templates-backdrop')) {
    const bd = document.createElement('div');
    bd.className = 'templates-backdrop';
    bd.addEventListener('click', closeTemplatesPanel);
    document.body.appendChild(bd);
  }

  panel.classList.remove('hidden');
  renderTemplates();
}

function closeTemplatesPanel() {
  document.getElementById('templatesPanel')?.classList.add('hidden');
  document.querySelector('.templates-backdrop')?.remove();
}

function attachTemplateEvents() {
  document.getElementById('templatesBtn')?.addEventListener('click', openTemplatesPanel);
  document.getElementById('closeTemplatesBtn')?.addEventListener('click', closeTemplatesPanel);

  // Save current as template
  document.getElementById('saveCurrentAsTemplateBtn')?.addEventListener('click', () => {
    const plan = getTodayPlanData();
    if (!plan.tasks || plan.tasks.length === 0) {
      showToast('Pehle tasks add karo ❌', 'danger');
      return;
    }

    const name = prompt('Template ka naam daalo:', 'My Plan');
    if (!name || !name.trim()) return;

    savePlanTemplate({
      name: name.trim(),
      tasks: plan.tasks.map(t => ({
        name: t.name,
        type: t.type,
        duration: t.duration,
        timeBlock: t.timeBlock,
        topicId: t.topicId
      }))
    });

    showToast('Template saved 📋', 'success');
    renderTemplates();
  });

  // Template list actions
  document.getElementById('templatesList')?.addEventListener('click', async (e) => {
    const applyBtn = e.target.closest('[data-apply-template]');
    if (applyBtn) {
      const id = applyBtn.dataset.applyTemplate;
      const added = applyPlanTemplate(id);
      showToast(`${added} task${added > 1 ? 's' : ''} added from template ✨`, 'success');
      closeTemplatesPanel();
      renderAIPlan();
      return;
    }

    const delBtn = e.target.closest('[data-delete-template]');
    if (delBtn) {
      const ok = await confirmAction('Template delete karna hai?', 'Delete Template');
      if (ok) {
        deletePlanTemplate(delBtn.dataset.deleteTemplate);
        renderTemplates();
        showToast('Template deleted', 'info');
      }
    }
  });
}


// ---------- WEAK / STRONG SUBTOPICS (Phase 6) ----------
function renderWeakSubtopics() {
  const weakList = document.getElementById('weakSubtopicsList');
  const strongList = document.getElementById('strongSubtopicsList');
  const weakSub = document.getElementById('weakSubtext');
  const strongSub = document.getElementById('strongSubtext');

  if (!weakList) return;

  // Get weak (accuracy < 60%)
  const weak = getWeakSubtopics(60);

  // Get strong (accuracy >= 80%)
  const allTopics = getTopics();
  const strong = [];

  allTopics.forEach(topic => {
    (topic.subtopics || []).forEach(sub => {
      const q = sub.questions || { attempted: 0, correct: 0 };
      if (q.attempted >= 5) {
        const acc = Math.round((q.correct / q.attempted) * 100);
        if (acc >= 80) {
          strong.push({
            topicId: topic.id,
            topicName: topic.name,
            subtopicId: sub.id,
            subtopicName: sub.name,
            accuracy: acc,
            attempted: q.attempted,
            correct: q.correct
          });
        }
      }
    });
  });

  strong.sort((a, b) => b.accuracy - a.accuracy);

  // Update subtext
  if (weakSub) {
    weakSub.textContent = weak.length === 0
      ? 'Sab strong hai! 🎉'
      : `${weak.length} subtopic${weak.length > 1 ? 's' : ''} practice needed`;
  }
  if (strongSub) {
    strongSub.textContent = strong.length === 0
      ? 'Abhi kuch strong nahi'
      : `${strong.length} subtopic${strong.length > 1 ? 's' : ''} mastered`;
  }

  // Render weak list
  if (weak.length === 0) {
    weakList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <p>Koi weak subtopic nahi!</p>
        <p class="text-xs mt-2">Great work — keep it up</p>
      </div>
    `;
  } else {
    weakList.innerHTML = weak.slice(0, 4).map(w => `
      <div class="weak-subtopic-item">
        <div class="weak-subtopic-info">
          <div class="weak-subtopic-name">
            <span class="weak-dot"></span>
            ${escapeHtml(w.topicName)} → ${escapeHtml(w.subtopicName)}
          </div>
          <div class="weak-subtopic-meta">
            ${w.accuracy}% accuracy (${w.correct}/${w.attempted})
          </div>
        </div>
        <a href="topic.html?id=${w.topicId}" class="btn btn-ghost btn-sm">Study →</a>
      </div>
    `).join('');

    if (weak.length > 4) {
      weakList.innerHTML += `
        <p class="text-xs text-muted text-center mt-3">
          +${weak.length - 4} aur weak subtopics
        </p>
      `;
    }
  }

  // Render strong list
  if (strong.length === 0) {
    strongList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <p>Abhi koi strong subtopic nahi</p>
        <p class="text-xs mt-2">Practice karo, yahan dikhega</p>
      </div>
    `;
  } else {
    strongList.innerHTML = strong.slice(0, 4).map(s => `
      <div class="weak-subtopic-item strong-subtopic-item">
        <div class="weak-subtopic-info">
          <div class="weak-subtopic-name">
            <span class="strong-dot"></span>
            ${escapeHtml(s.topicName)} → ${escapeHtml(s.subtopicName)}
          </div>
          <div class="weak-subtopic-meta">
            ${s.accuracy}% accuracy (${s.correct}/${s.attempted})
          </div>
        </div>
        <a href="topic.html?id=${s.topicId}" class="btn btn-ghost btn-sm">View →</a>
      </div>
    `).join('');

    if (strong.length > 4) {
      strongList.innerHTML += `
        <p class="text-xs text-muted text-center mt-3">
          +${strong.length - 4} aur strong subtopics
        </p>
      `;
    }
  }
}