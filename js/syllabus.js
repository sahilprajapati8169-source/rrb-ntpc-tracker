/* ============================
   SYLLABUS.JS — Syllabus Page
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
  // Weak detection
  if (topic.status === 'completed') {
    // Check if weak based on confidence or accuracy
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

  const topics = getTopics();
  const subjects = Object.keys(SYLLABUS_DATA);

  // Filter topics first
  const filteredTopics = topics.filter(matchesFilter);

  // Group by subject
  const grouped = {};
  subjects.forEach(sub => grouped[sub] = []);
  filteredTopics.forEach(t => {
    if (grouped[t.subject]) grouped[t.subject].push(t);
  });

  // Check if anything matched
  const totalMatched = filteredTopics.length;

  if (totalMatched === 0) {
    container.innerHTML = `
      <div class="syllabus-empty">
        <div class="syllabus-empty-icon">🔍</div>
        <h3 class="mb-2">Kuch nahi mila</h3>
        <p>Filter change karo ya search clear karo</p>
      </div>
    `;
    return;
  }

  // Build each subject block
  container.innerHTML = subjects.map(subject => {
    const subjectTopics = grouped[subject] || [];
    if (subjectTopics.length === 0) return '';

    const total = subjectTopics.length;
    const completed = subjectTopics.filter(t => getTopicStatus(t) === 'completed').length;
    const pct = percent(completed, total);

    const icon = getSubjectIcon(subject);

    const topicRowsHTML = subjectTopics.map(topic => {
      const status = getTopicStatus(topic);
      return buildTopicRow(topic, status);
    }).join('');

    return `
      <div class="subject-block" data-subject="${subject}">
        <div class="subject-header" data-toggle>
          <div class="subject-header-left">
            <span class="subject-arrow">▶</span>
            <div class="subject-icon">${icon}</div>
            <div class="subject-info">
              <div class="subject-name">${subject}</div>
              <div class="subject-meta">${completed}/${total} topics completed</div>
            </div>
          </div>
          <div class="subject-progress">
            <div class="subject-progress-bar">
              <div class="subject-progress-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="subject-progress-text">${pct}%</span>
          </div>
        </div>

        <div class="subject-body">
          ${topicRowsHTML}
        </div>
      </div>
    `;
  }).join('');
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
    'Maths': '📐',
    'Reasoning': '🧩',
    'General Awareness': '🌍'
  };
  return icons[subject] || '📚';
}

// ---------- FILTER LOGIC ----------
function matchesFilter(topic) {
  const status = getTopicStatus(topic);

  // Filter check
  if (currentFilter !== 'all' && status !== currentFilter) {
    return false;
  }

  // Search check
  if (currentSearch) {
    const search = currentSearch.toLowerCase();
    const nameMatch = topic.name.toLowerCase().includes(search);
    const subjectMatch = topic.subject.toLowerCase().includes(search);
    if (!nameMatch && !subjectMatch) return false;
  }

  return true;
}

// ---------- EVENTS ----------
function attachEvents() {
  // Search input
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

      // Active state
      filterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      // Apply filter
      currentFilter = pill.dataset.filter;
      renderSyllabus();
      openMatchingAccordions();
    });
  }

  // Accordion toggle
  const container = document.getElementById('subjectsContainer');
  if (container) {
    container.addEventListener('click', (e) => {
      const header = e.target.closest('.subject-header');
      if (!header) return;

      const block = header.closest('.subject-block');
      block.classList.toggle('open');
    });
  }

  // Auto-open first subject
  setTimeout(() => {
    const firstBlock = document.querySelector('.subject-block');
    if (firstBlock) firstBlock.classList.add('open');
  }, 100);
}

// ---------- AUTO-OPEN MATCHING ----------
function openMatchingAccordions() {
  // Agar search ya filter active hai → sab accordions open karo
  if (currentSearch || currentFilter !== 'all') {
    document.querySelectorAll('.subject-block').forEach(b => b.classList.add('open'));
  }
}

// ---------- HELPER ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}