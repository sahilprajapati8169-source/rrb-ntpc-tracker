/* ============================
   MISTAKES.JS — Mistake Book
   ============================ */

let currentFilter = 'all';

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('mistakeList')) return;
  populateSubjects();
  render();
  attachEvents();
});

// ---------- POPULATE SUBJECTS ----------
function populateSubjects() {
  const sel = document.getElementById('mSubject');
  if (!sel) return;

  sel.innerHTML = '<option value="">Select subject</option>';
  Object.keys(SYLLABUS_DATA).forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    sel.appendChild(opt);
  });
}

// ---------- POPULATE TOPICS ----------
function populateFormTopics(subject) {
  const sel = document.getElementById('mTopic');
  if (!sel) return;

  sel.innerHTML = '<option value="">Select topic</option>';
  if (!subject) return;

  getTopicsBySubject(subject).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
}

// ---------- RENDER ----------
function render() {
  const all = getMistakes();

  // Stats
  const weekAgo = addDays(todayStr(), -7);
  const thisWeek = all.filter(m => m.createdAt >= weekAgo);
  const reviewed = all.filter(m => m.reviewed);

  setText('statTotal', all.length);
  setText('statWeek', thisWeek.length);
  setText('statReviewed', reviewed.length);
  setText('statPending', all.length - reviewed.length);

  // Filter
  let list = [...all];
  if (currentFilter === 'pending') list = list.filter(m => !m.reviewed);
  else if (currentFilter === 'reviewed') list = list.filter(m => m.reviewed);
  else if (currentFilter === 'week') list = list.filter(m => m.createdAt >= weekAgo);

  // Sort latest first
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // Render
  const container = document.getElementById('mistakeList');
  if (list.length === 0) {
    container.innerHTML = `
      <div class="syllabus-empty">
        <div class="syllabus-empty-icon">🎉</div>
        <h3>Koi mistake nahi!</h3>
        <p>Great going — keep practicing</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(m => renderMistakeCard(m)).join('');
}

// ---------- RENDER CARD ----------
function renderMistakeCard(m) {
  const types = (m.types || []).map(t => `<span class="badge badge-neutral">${t}</span>`).join(' ');

  return `
    <div class="mistake-card ${m.reviewed ? 'reviewed' : ''}">
      <div class="mistake-card-top">
        <div class="mistake-meta">
          <span class="badge badge-info">${m.subject || '—'}</span>
          <span class="badge badge-neutral">${m.topicName || m.topic || '—'}</span>
          <span class="text-xs text-muted">${formatDate(m.createdAt)}</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-delete="${m.id}" title="Delete">🗑️</button>
      </div>

      <div class="mistake-question">${escapeHtml(m.question || '(no question)')}</div>

      <div class="mistake-answers">
        <div class="mistake-answer wrong">
          <span class="mistake-answer-label">Your Answer</span>
          ${escapeHtml(m.wrongAnswer || '—')}
        </div>
        <div class="mistake-answer correct">
          <span class="mistake-answer-label">Correct</span>
          ${escapeHtml(m.correctAnswer || '—')}
        </div>
      </div>

      ${types ? `<div class="mistake-types">${types}</div>` : ''}

      ${m.note ? `<div class="mistake-note">💡 ${escapeHtml(m.note)}</div>` : ''}

      <div class="mistake-actions">
        <button class="btn ${m.reviewed ? 'btn-secondary' : 'btn-success'} btn-sm" data-toggle-review="${m.id}">
          ${m.reviewed ? '✅ Reviewed' : 'Mark Reviewed'}
        </button>
      </div>
    </div>
  `;
}

// ---------- EVENTS ----------
function attachEvents() {
  // Toggle form
  document.getElementById('toggleFormBtn')?.addEventListener('click', () => {
    document.getElementById('formCard').classList.toggle('hidden');
  });
  document.getElementById('closeFormBtn')?.addEventListener('click', () => {
    document.getElementById('formCard').classList.add('hidden');
  });
  document.getElementById('cancelMistakeBtn')?.addEventListener('click', () => {
    document.getElementById('formCard').classList.add('hidden');
  });

  // Subject → topics
  document.getElementById('mSubject')?.addEventListener('change', (e) => {
    populateFormTopics(e.target.value);
  });

  // Checkbox chips
  document.querySelectorAll('.checkbox-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const input = chip.querySelector('input');
      input.checked = !input.checked;
      chip.classList.toggle('checked', input.checked);
    });
  });

  // Save mistake
  document.getElementById('saveMistakeBtn')?.addEventListener('click', saveMistake);

  // Filters
  document.getElementById('filterBar')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    document.querySelectorAll('#filterBar .filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter;
    render();
  });

  // List actions
  document.getElementById('mistakeList')?.addEventListener('click', async (e) => {
  const delBtn = e.target.closest('[data-delete]');
  if (delBtn) {
    const ok = await confirmAction('Delete karna hai?', 'Delete Mistake');
    if (ok) {
      deleteMistake(delBtn.dataset.delete);
      showToast('Deleted', 'info');
      render();
    }
    return;
  }

    // Toggle review
    const reviewBtn = e.target.closest('[data-toggle-review]');
    if (reviewBtn) {
      const id = reviewBtn.dataset.toggleReview;
      const m = getMistakes().find(x => x.id === id);
      if (!m) return;
      updateMistake(id, { reviewed: !m.reviewed });
      render();
      return;
    }
  });
}

// ---------- SAVE ----------
function saveMistake() {
  const subject = document.getElementById('mSubject').value;
  const topicId = document.getElementById('mTopic').value;
  const topicName = topicId ? (getTopic(topicId)?.name || '') : '';
  const question = document.getElementById('mQuestion').value.trim();
  const wrongAnswer = document.getElementById('mWrong').value.trim();
  const correctAnswer = document.getElementById('mCorrect').value.trim();
  const note = document.getElementById('mNote').value.trim();

  if (!subject || !question) {
    showToast('Subject aur question required ❌', 'danger');
    return;
  }

  // Get types
  const types = [];
  document.querySelectorAll('.checkbox-chip input:checked').forEach(inp => {
    types.push(inp.value);
  });

  const mistake = {
    id: generateId('mis'),
    subject,
    topicId,
    topicName,
    question,
    wrongAnswer,
    correctAnswer,
    types,
    note,
    reviewed: false,
    createdAt: todayStr()
  };

  saveMistakeToStorage(mistake);

  // Reset
  document.getElementById('mSubject').value = '';
  document.getElementById('mTopic').innerHTML = '<option value="">Select topic</option>';
  document.getElementById('mQuestion').value = '';
  document.getElementById('mWrong').value = '';
  document.getElementById('mCorrect').value = '';
  document.getElementById('mNote').value = '';
  document.querySelectorAll('.checkbox-chip').forEach(c => {
    c.classList.remove('checked');
    c.querySelector('input').checked = false;
  });

  document.getElementById('formCard').classList.add('hidden');

  showToast('Mistake saved 📝', 'success');
  render();
}

// ---------- STORAGE WRAPPER ----------
// Humne storage.js mein `saveMistake` already hai. Avoid name clash.
function saveMistakeToStorage(mistake) {
  const mistakes = getMistakes();
  mistakes.push(mistake);
  saveData('rrb_mistakes', mistakes);
}

// ---------- HELPERS ----------
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}