/* ============================
   ANALYTICS.JS — Analytics Page
   ============================ */

let currentRange = '7';
const charts = {};

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('studyHoursChart')) return;

  attachTabs();
  renderAll();
});

// ---------- TABS ----------
function attachTabs() {
  const tabs = document.getElementById('tabs');
  if (!tabs) return;

  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.analytics-tab');
    if (!tab) return;

    tabs.querySelectorAll('.analytics-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentRange = tab.dataset.range;
    renderAll();
  });
}

// ---------- RENDER ALL ----------
function renderAll() {
  renderStudyHours();
  renderSyllabus();
  renderAccuracy();
  renderMocks();
  renderTimeDistribution();
  renderBreakStats();
  renderHeatmap();
}

// ---------- RANGE HELPER ----------
function getDatesInRange() {
  if (currentRange === 'all') {
    // Determine earliest session date
    const sessions = getSessions();
    if (sessions.length === 0) return [todayStr()];

    let earliest = sessions[0].startTime?.split('T')[0] || todayStr();
    sessions.forEach(s => {
      const d = s.startTime?.split('T')[0];
      if (d && d < earliest) earliest = d;
    });

    const dates = [];
    let d = earliest;
    const today = todayStr();
    while (d <= today && dates.length < 90) {
      dates.push(d);
      d = addDays(d, 1);
    }
    return dates;
  } else {
    const days = parseInt(currentRange);
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(addDays(todayStr(), -i));
    }
    return dates;
  }
}

// ---------- 1. STUDY HOURS ----------
function renderStudyHours() {
  const canvas = document.getElementById('studyHoursChart');
  if (!canvas) return;

  const dates = getDatesInRange();
  const hours = dates.map(d => {
    const sessions = getSessionsByDate(d);
    return +(getTotalStudyMinutes(sessions) / 60).toFixed(1);
  });

  const labels = dates.map(d => {
    const parts = formatDate(d).split(' ');
    return parts[0] + ' ' + parts[1];
  });

  if (charts.studyHours) charts.studyHours.destroy();

  charts.studyHours = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours',
        data: hours,
        backgroundColor: '#4F46E5',
        borderRadius: 6,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: '#F3F4F6' }
        },
        x: {
          ticks: { color: '#6B7280', font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ---------- 2. SYLLABUS PROGRESS ----------
function renderSyllabus() {
  const canvas = document.getElementById('syllabusChart');
  if (!canvas) return;

  const topics = getTopics();
  const subjects = ['Maths', 'Reasoning', 'General Awareness'];
  const completed = subjects.map(s => {
    const subTopics = topics.filter(t => t.subject === s);
    return subTopics.filter(t => t.status === 'completed').length;
  });
  const remaining = subjects.map((s, i) => {
    const subTopics = topics.filter(t => t.subject === s);
    return subTopics.length - completed[i];
  });

  if (charts.syllabus) charts.syllabus.destroy();

  charts.syllabus = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Maths', 'Reasoning', 'GA'],
      datasets: [
        {
          label: 'Completed',
          data: completed,
          backgroundColor: '#10B981',
          borderRadius: 6
        },
        {
          label: 'Remaining',
          data: remaining,
          backgroundColor: '#E5E7EB',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#6B7280', font: { size: 12 }, boxWidth: 12 }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: '#F3F4F6' }
        }
      }
    }
  });
}

// ---------- 3. ACCURACY ----------
function renderAccuracy() {
  const canvas = document.getElementById('accuracyChart');
  if (!canvas) return;

  const topics = getTopics().filter(t => t.questions?.attempted > 0);

  if (topics.length === 0) {
    canvas.parentElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <p>Abhi koi question practice data nahi</p>
        <p class="text-xs mt-2">Topic detail page pe jakar questions add karo</p>
      </div>
    `;
    return;
  }

  const labels = topics.slice(0, 8).map(t => t.name.length > 14 ? t.name.slice(0, 12) + '…' : t.name);
  const data = topics.slice(0, 8).map(t => percent(t.questions.correct, t.questions.attempted));

  if (charts.accuracy) charts.accuracy.destroy();

  charts.accuracy = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Accuracy %',
        data: data,
        backgroundColor: data.map(v => v >= 75 ? '#10B981' : v >= 60 ? '#F59E0B' : '#EF4444'),
        borderRadius: 6,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: '#F3F4F6' }
        },
        x: {
          ticks: { color: '#6B7280', font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ---------- 4. MOCK SCORES ----------
function renderMocks() {
  const canvas = document.getElementById('mockChart');
  if (!canvas) return;

  const mocks = getMocks().slice().sort((a, b) => (a.num || 0) - (b.num || 0));

  if (mocks.length < 2) {
    canvas.parentElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>Kam se kam 2 mocks do</p>
        <a href="mock.html" class="btn btn-primary btn-sm mt-3">Add Mock →</a>
      </div>
    `;
    return;
  }

  if (charts.mock) charts.mock.destroy();

  charts.mock = new Chart(canvas, {
    type: 'line',
    data: {
      labels: mocks.map(m => `Mock ${m.num || '?'}`),
      datasets: [{
        label: 'Score',
        data: mocks.map(m => m.score || 0),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#4F46E5',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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

// ---------- 5. TIME DISTRIBUTION ----------
function renderTimeDistribution() {
  const canvas = document.getElementById('timeDistChart');
  if (!canvas) return;

  const topics = getTopics();
  const subjects = ['Maths', 'Reasoning', 'General Awareness'];
  const timeData = subjects.map(s => {
    return topics.filter(t => t.subject === s)
      .reduce((acc, t) => acc + (t.studyTime || 0), 0);
  });

  const total = timeData.reduce((a, b) => a + b, 0);

  if (total === 0) {
    canvas.parentElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏱</div>
        <p>Abhi koi study time nahi</p>
        <a href="timer.html" class="btn btn-primary btn-sm mt-3">Start Timer →</a>
      </div>
    `;
    return;
  }

  if (charts.timeDist) charts.timeDist.destroy();

  charts.timeDist = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: subjects,
      datasets: [{
        data: timeData,
        backgroundColor: ['#4F46E5', '#F59E0B', '#10B981'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#6B7280', font: { size: 12 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed;
              const mins = val;
              return `${ctx.label}: ${formatTime(mins)}`;
            }
          }
        }
      }
    }
  });
}

// ---------- 6. BREAK STATS ----------
function renderBreakStats() {
  const canvas = document.getElementById('breakChart');
  if (!canvas) return;

  const sessions = getSessions();

  if (sessions.length === 0) {
    canvas.parentElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">☕</div>
        <p>Abhi koi session data nahi</p>
      </div>
    `;
    return;
  }

  let shortBreaks = 0, mediumBreaks = 0, longBreaks = 0, totalBreak = 0, totalStudy = 0;

  sessions.forEach(s => {
    totalStudy += s.totalStudy || 0;
    totalBreak += s.totalBreak || 0;
    (s.segments || []).forEach(seg => {
      if (seg.type === 'break') {
        if (seg.duration <= 5) shortBreaks++;
        else if (seg.duration <= 15) mediumBreaks++;
        else longBreaks++;
      }
    });
  });

  if (charts.breakStats) charts.breakStats.destroy();

  charts.breakStats = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Short (≤5m)', 'Medium (5-15m)', 'Long (>15m)'],
      datasets: [{
        label: 'Break Count',
        data: [shortBreaks, mediumBreaks, longBreaks],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderRadius: 6,
        maxBarThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} breaks`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#6B7280', font: { size: 11 }, stepSize: 1 },
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

// ---------- 7. HEATMAP ----------
function renderHeatmap() {
  const container = document.getElementById('heatmap');
  if (!container) return;

  const subjects = ['Maths', 'Reasoning', 'General Awareness'];
  const allTopics = getTopics();

  // Header
  let html = `
    <div class="heatmap-row header">
      <div></div>
      <div style="text-align:center;">Maths</div>
      <div style="text-align:center;">Reasoning</div>
      <div style="text-align:center;">GA</div>
    </div>
  `;

  // Group topics by first letter for grouping (ya simple list)
  const allTopicsSorted = allTopics.sort((a, b) => a.name.localeCompare(b.name));

  allTopicsSorted.slice(0, 12).forEach(topic => {
    html += `
      <div class="heatmap-row">
        <div class="heatmap-label">${topic.name.length > 18 ? topic.name.slice(0, 16) + '…' : topic.name}</div>
        ${subjects.map(sub => {
          if (topic.subject !== sub) {
            return `<div class="heatmap-cell empty">—</div>`;
          }
          const cellClass = getHeatmapClass(topic);
          const label = getHeatmapLabel(topic);
          return `<div class="heatmap-cell ${cellClass}" title="${topic.name}">${label}</div>`;
        }).join('')}
      </div>
    `;
  });

  container.innerHTML = html;
}

function getHeatmapClass(topic) {
  if (topic.status === 'not_started') return 'empty';
  if (topic.confidence > 0 && topic.confidence <= 2) return 'weak';
  if (topic.questions?.attempted >= 10) {
    const acc = percent(topic.questions.correct, topic.questions.attempted);
    if (acc < 60) return 'weak';
    if (acc >= 80) return 'strong';
  }
  if (topic.status === 'completed') return 'strong';
  if (topic.status === 'in_progress') return 'average';
  return 'empty';
}

function getHeatmapLabel(topic) {
  const cls = getHeatmapClass(topic);
  if (cls === 'strong') return '🟢';
  if (cls === 'average') return '🟡';
  if (cls === 'weak') return '🔴';
  return '—';
}