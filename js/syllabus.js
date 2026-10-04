/* ============================
   SYLLABUS.JS — Syllabus Page (3-Level)
   ============================ */

let currentFilter = 'all';
let currentSearch = '';

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('subjectsContainer')) return;

  renderStats();
  renderSyllabus();
  attachEvents();
});

// ---------- STATS ----------
function renderStats() {
  const topics = getTopics();

  const completed = topics.filter(t => getTopicStatus(t) === 'completed').length;
  const inProgress = topics.filter(t => getTopicStatus(t) === 'in_progress').length;
  const notStarted = topics.filter(t => getTopicStatus(t) === 'not_started').length;

  setText('totalTopics', topics.length);
  setText('completedTopics', completed);
  setText('inProgressTopics', inProgress);
  setText('notStartedTopics', notStarted);
}

// ---------- TOPIC STATUS ----------
function getTopicStatus(topic) {
  if (topic.status === 'completed') {
    if (topic.confidence > 0 && topic.confidence <= 2) return 'weak';
    if (topic.questions && topic.questions.attempted >= 20) {
      const acc = percent(topic.questions.correct, topic.questions.attempted);
      if (acc < 60) return 'weak';
    }
    return 'completed';
  }
  if (topic.status === 'in_progress') return 'in_progress';
  return 'not_started';
}

// ---------- RENDER SYLLABUS ----------
function renderSyllabus() {
  const container = document.getElementById('subjectsContainer');
  if (!container) return;

  const subjects = Object.keys(SYLLABUS_DATA);
  let hasAny = false;

  let html = '';

  subjects.forEach(subject => {
    const sections = SYLLABUS_DATA[subject];
    let subjectTotal = 0;
    let subjectCompleted = 0;
    let sectionsHTML = '';

    sections.forEach(section => {
      const topicRows = section.topics
        .map(t => getTopic(t.id))
        .filter(Boolean)
        .filter(matchesFilter);

      if (topicRows.length === 0) return;

      // Section stats
      const secTotal = topicRows.length;
      const secCompleted = topicRows.filter(t => getTopicStatus(t) === 'completed').length;
      const secPct = secTotal > 0 ? percent(secCompleted, secTotal) : 0;

      subjectTotal += secTotal;
      subjectCompleted += secCompleted;
      hasAny = true;

      const topicsHTML = topicRows.map(topic => {
        const status = getTopicStatus(topic);
        return buildTopicRow(topic, status);
      }).join('');

      sectionsHTML += `
        <div class="section-block">
          <div class="section-header">
            <div class="section-header-left">
              <span class="section-arrow">▶</span>
              <span class="section-name">${section.name}</span>
            </div>
            <div class="section-progress">
              <span class="section-count">${secCompleted}/${secTotal}</span>
              <span class="section-pct">${secPct}%</span>
            </div>
          </div>
          <div class="section-body">
            ${topicsHTML}
          </div>
        </div>
      `;
    });

    if (!sectionsHTML) return;

    const subjectPct = subjectTotal > 0 ? percent(subjectCompleted, subjectTotal) : 0;
    const icon = getSubjectIcon(subject);

    html += `
      <div class="subject-block" data-subject="${subject}">
        <div class="subject-header" data-toggle-subject>
          <div class="subject-header-left">
            <span class="subject-arrow">▶</span>
            <div class="subject-icon">${icon}</div>
            <div class="subject-info">
              <div class="subject-name">${subject}</div>
              <div class="subject-meta">${subjectCompleted}/${subjectTotal} topics completed</div>
            </div>
          </div>
          <div class="subject-progress">
            <div class="subject-progress-bar">
              <div class="subject-progress-fill" style="width: ${subjectPct}%;"></div>
            </div>
            <span class="subject-progress-text">${subjectPct}%</span>
          </div>
        </div>

        <div class="subject-body">
          ${sectionsHTML}
        </div>
      </div>
    `;
  });

  if (!hasAny) {
    container.innerHTML = `
      <div class="syllabus-empty">
        <div class="syllabus-empty-icon">🔍</div>
        <h3 class="mb-2">Kuch nahi mila</h3>
        <p>Filter change karo ya search clear karo</p>
      </div>
    `;
    return;
  }

  container.innerHTML = html;
}

// ---------- BUILD TOPIC ROW ----------
function buildTopicRow(topic, status) {
  const statusIcon = {
    'completed': '✅',
    'in_progress': '🟡',
    'not_started': '⏳',
    'weak': '🔴'
  }[status];

  let meta = '';
  if (topic.studyTime > 0) {
    meta = `⏱ ${formatTime(topic.studyTime)}`;
  }
  if (topic.questions && topic.questions.attempted > 0) {
    const acc = percent(topic.questions.correct, topic.questions.attempted);
    meta += (meta ? ' • ' : '') + `📝 ${acc}% accuracy`;
  }
  if (!meta) meta = 'Not started yet';

  return `
    <a href="topic.html?id=${topic.id}" class="topic-row">
      <div class="topic-row-left">
        <div class="topic-row-status ${status}">${statusIcon}</div>
        <div>
          <div class="topic-row-name">${topic.name}</div>
          <div class="topic-row-meta">${meta}</div>
        </div>
      </div>
      <div class="topic-row-right">
        <span class="topic-row-arrow">→</span>
      </div>
    </a>
  `;
}

// ---------- SUBJECT ICON ----------
function getSubjectIcon(subject) {
  const icons = {
    'Mathematics': '📐',
    'Reasoning': '🧩',
    'General Awareness': '🌍'
  };
  return icons[subject] || '📚';
}

// ---------- FILTER LOGIC ----------
function matchesFilter(topic) {
  const status = getTopicStatus(topic);

  if (currentFilter !== 'all' && status !== currentFilter) {
    return false;
  }

  if (currentSearch) {
    const search = currentSearch.toLowerCase();
    const nameMatch = topic.name.toLowerCase().includes(search);
    const subjectMatch = (topic.subject || '').toLowerCase().includes(search);
    const sectionMatch = (topic.section || '').toLowerCase().includes(search);
    if (!nameMatch && !subjectMatch && !sectionMatch) return false;
  }

  return true;
}

// ---------- EVENTS ----------
function attachEvents() {
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      renderSyllabus();
      openMatchingAccordions();
    });
  }

  // Filter pills
  const filterPills = document.getElementById('filterPills');
  if (filterPills) {
    filterPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      filterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      currentFilter = pill.dataset.filter;
      renderSyllabus();
      openMatchingAccordions();
    });
  }

  // Subject + Section accordion
  const container = document.getElementById('subjectsContainer');
  if (container) {
    container.addEventListener('click', (e) => {
      // Section toggle (pehle check karo)
      const sectionHeader = e.target.closest('.section-header');
      if (sectionHeader && !e.target.closest('.subject-header')) {
        const block = sectionHeader.closest('.section-block');
        block.classList.toggle('open');
        return;
      }

      // Subject toggle
      const subjectHeader = e.target.closest('.subject-header');
      if (subjectHeader) {
        const block = subjectHeader.closest('.subject-block');
        block.classList.toggle('open');
      }
    });
  }

  // Auto-open first subject
  setTimeout(() => {
    const firstSubject = document.querySelector('.subject-block');
    if (firstSubject) firstSubject.classList.add('open');
  }, 100);
}

// ---------- AUTO-OPEN MATCHING ----------
function openMatchingAccordions() {
  if (currentSearch || currentFilter !== 'all') {
    document.querySelectorAll('.subject-block, .section-block').forEach(b => b.classList.add('open'));
  }
}

// ---------- HELPER ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}