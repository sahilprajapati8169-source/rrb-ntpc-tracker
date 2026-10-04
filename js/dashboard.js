/* ============================
   DASHBOARD.JS — Main Page Logic
   ============================ */

let studyChartInstance = null;

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('statSyllabus')) return; // not on dashboard page

  renderWelcome();
  renderExamCountdown();
  renderStats();
  renderAIPlan();
  renderProbability();
  renderRevisionDue();
  renderBreakAnalytics();
  renderStudyChart();
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
function renderAIPlan() {
  const planList = document.getElementById('aiPlanList');
  if (!planList) return;

  const plan = generateTodayPlan();

  if (plan.length === 0) {
    planList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <p>Sab kaam ho gaya! Aaj kuch pending nahi.</p>
      </div>
    `;
    return;
  }

  planList.innerHTML = plan.map((item, idx) => `
    <div class="plan-item ${item.priority}">
      <div class="plan-item-number">${idx + 1}</div>
      <div class="plan-item-content">
        <div class="plan-item-title">${item.topic.name}</div>
        <div class="plan-item-reason">${item.reason}</div>
      </div>
      <a href="topic.html?id=${item.topic.id}" class="btn btn-ghost btn-sm">→</a>
    </div>
  `).join('');
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