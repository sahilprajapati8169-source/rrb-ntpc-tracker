/* ============================
   TOPIC.JS — Topic Detail Page
   ============================ */

let currentTopicId = null;

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('topicContent')) return;

  const params = new URLSearchParams(window.location.search);
  currentTopicId = params.get('id');

  if (!currentTopicId) {
    showNotFound();
    return;
  }

  const topic = getTopic(currentTopicId);
  if (!topic) {
    showNotFound();
    return;
  }

  document.getElementById('notFound').classList.add('hidden');
  document.getElementById('topicContent').classList.remove('hidden');

  renderTopic(topic);
  attachEvents();
});

// ---------- NOT FOUND ----------
function showNotFound() {
  document.getElementById('notFound').classList.remove('hidden');
  document.getElementById('topicContent').classList.add('hidden');
}

// ---------- RENDER TOPIC ----------
function renderTopic(topic) {
  // Header
  setText('topicName', topic.name);
  setText('topicSubject', topic.subject);

  // Start Study button
  const startBtn = document.getElementById('startStudyBtn');
  if (startBtn) startBtn.href = `timer.html?id=${topic.id}`;

  renderStats(topic);
  renderStatus(topic);
  renderConfidence(topic);
  renderRevisions(topic);
  renderQuestions(topic);
  renderNotes(topic);
  renderMistakes(topic);
}

// ---------- STATS ----------
function renderStats(topic) {
  const statusLabels = {
    'not_started': '⏳ Not Started',
    'in_progress': '🟡 In Progress',
    'completed': '✅ Completed'
  };

  setText('statStatus', statusLabels[topic.status] || '⏳ Not Started');

  // Confidence
  setText('statConfidence', topic.confidence > 0 ? '⭐'.repeat(topic.confidence) : '—');

  // Study Time
  setText('statTime', formatTime(topic.studyTime || 0));

  // Accuracy
  const q = topic.questions || { attempted: 0, correct: 0 };
  if (q.attempted > 0) {
    const acc = percent(q.correct, q.attempted);
    setText('statAccuracy', acc + '%');
  } else {
    setText('statAccuracy', '—');
  }
}

// ---------- STATUS ----------
function renderStatus(topic) {
  const selector = document.getElementById('statusSelector');
  if (!selector) return;

  selector.querySelectorAll('.status-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.status === topic.status);
  });
}

// ---------- CONFIDENCE ----------
function renderConfidence(topic) {
  const container = document.getElementById('confidenceStars');
  if (!container) return;

  const conf = topic.confidence || 0;
  container.querySelectorAll('.confidence-star').forEach(star => {
    const val = parseInt(star.dataset.value);
    star.classList.toggle('active', val <= conf);
  });

  const textEl = document.getElementById('confidenceText');
  if (textEl) {
    const labels = {
      0: 'Not set',
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Good',
      5: 'Strong'
    };
    textEl.textContent = labels[conf] || 'Not set';
  }
}

// ---------- REVISIONS ----------
function renderRevisions(topic) {
  const container = document.getElementById('revisionContainer');
  if (!container) return;

  const revisions = topic.revisions || [];

  if (revisions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔁</div>
        <p class="mb-3">Abhi koi revision schedule nahi hai</p>
        <p class="text-xs text-muted">"Generate Schedule" button dabao</p>
      </div>
    `;
    return;
  }

  const today = todayStr();

  const steps = revisions.map(rev => {
    let state = 'upcoming';
    let statusText = formatDate(rev.dueDate);

    if (rev.done) {
      state = 'done';
      statusText = '✅ Done';
    } else if (rev.dueDate < today) {
      state = 'due';
      const days = daysBetween(rev.dueDate, today);
      statusText = `⚠️ ${days}d overdue`;
    } else if (rev.dueDate === today) {
      state = 'due';
      statusText = '🔴 Due today';
    } else {
      const days = daysBetween(today, rev.dueDate);
      statusText = `In ${days}d`;
    }

    return `
      <div class="revision-step ${state}">
        <div class="revision-step-label">R${rev.num}</div>
        <div class="revision-step-date">${formatDate(rev.dueDate)}</div>
        <div class="revision-step-status">${statusText}</div>
        ${!rev.done ? `<button class="btn btn-ghost btn-sm mt-2" data-rev="${rev.num}" data-markdone>Mark Done</button>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="revision-timeline">${steps}</div>
  `;
}

// ---------- QUESTIONS ----------
function renderQuestions(topic) {
  const q = topic.questions || { attempted: 0, correct: 0 };

  setText('qAttempted', q.attempted);
  setText('qCorrect', q.correct);

  if (q.attempted > 0) {
    const acc = percent(q.correct, q.attempted);
    setText('qAccuracy', acc + '%');
  } else {
    setText('qAccuracy', '—');
  }

  const inputA = document.getElementById('inputAttempted');
  const inputC = document.getElementById('inputCorrect');
  if (inputA) inputA.value = q.attempted || '';
  if (inputC) inputC.value = q.correct || '';
}

// ---------- NOTES ----------
function renderNotes(topic) {
  const container = document.getElementById('notesList');
  if (!container) return;

  const notes = topic.notes || [];

  if (notes.length === 0) {
    container.innerHTML = `
      <p class="text-sm text-muted" style="padding: 8px 0;">Abhi koi note nahi hai</p>
    `;
    return;
  }

  container.innerHTML = notes.map((note, idx) => `
    <div class="note-item">
      <div class="note-item-text">${escapeHtml(note)}</div>
      <button class="note-item-delete" data-note-idx="${idx}" title="Delete">✕</button>
    </div>
  `).join('');
}

// ---------- MISTAKES ----------
function renderMistakes(topic) {
  const container = document.getElementById('mistakesContainer');
  if (!container) return;

  const allMistakes = getMistakes();
  const topicMistakes = allMistakes
    .filter(m => m.topicId === topic.id || m.topic === topic.name)
    .slice(-3)
    .reverse();

  if (topicMistakes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <p>Is topic mein koi mistake nahi. Shabaash!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = topicMistakes.map(m => `
    <div class="mistake-mini">
      <div class="mistake-mini-q">${escapeHtml(m.question || 'Question')}</div>
      <div class="mistake-mini-a">
        Your answer: <strong>${escapeHtml(m.wrongAnswer || '—')}</strong> • 
        Correct: <strong>${escapeHtml(m.correctAnswer || '—')}</strong>
      </div>
    </div>
  `).join('');
}

// ---------- EVENTS ----------
function attachEvents() {
  // Status chips
  const statusSelector = document.getElementById('statusSelector');
  if (statusSelector) {
    statusSelector.addEventListener('click', (e) => {
      const chip = e.target.closest('.status-chip');
      if (!chip) return;

      const topic = getTopic(currentTopicId);
      if (!topic) return;

      topic.status = chip.dataset.status;

      // Auto-set confidence 3 if just completed
      if (topic.status === 'completed' && !topic.confidence) {
        topic.confidence = 3;
      }

      saveTopic(topic);
      renderTopic(topic);
      showToast('Status updated ✅', 'success');
    });
  }

  // Confidence stars
  const confStars = document.getElementById('confidenceStars');
  if (confStars) {
    confStars.addEventListener('click', (e) => {
      const star = e.target.closest('.confidence-star');
      if (!star) return;

      const value = parseInt(star.dataset.value);
      const topic = getTopic(currentTopicId);
      if (!topic) return;

      topic.confidence = value;
      saveTopic(topic);
      renderTopic(topic);
      showToast(`Confidence: ${value}/5 ⭐`, 'success');
    });
  }

  // Generate revisions
  const genBtn = document.getElementById('generateRevisionsBtn');
  if (genBtn) {
    genBtn.addEventListener('click', async () => {
  const topic = getTopic(currentTopicId);
  if (!topic) return;
  if (topic.revisions && topic.revisions.length > 0) {
    const ok = await confirmAction('Purani revisions replace ho jayengi. Continue?', 'Regenerate');
    if (!ok) return;
  }
  const studyDate = topic.lastStudied || todayStr();
  topic.revisions = generateRevisionSchedule(studyDate);
  saveTopic(topic);
  renderTopic(topic);
  showToast('Revision schedule ban gaya! 🔁', 'success');
});
  }

  // Mark revision done
  const revisionContainer = document.getElementById('revisionContainer');
  if (revisionContainer) {
    revisionContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-markdone]');
      if (!btn) return;

      const revNum = parseInt(btn.dataset.rev);
      const topic = getTopic(currentTopicId);
      if (!topic) return;

      const rev = (topic.revisions || []).find(r => r.num === revNum);
      if (!rev) return;

      rev.done = true;
      rev.doneDate = todayStr();
      saveTopic(topic);
      renderTopic(topic);
      showToast(`Revision ${revNum} done! ✅`, 'success');
    });
  }

  // Save questions
  const saveQBtn = document.getElementById('saveQuestionsBtn');
  if (saveQBtn) {
    saveQBtn.addEventListener('click', () => {
      const attempted = parseInt(document.getElementById('inputAttempted').value) || 0;
      const correct = parseInt(document.getElementById('inputCorrect').value) || 0;

      if (correct > attempted) {
        showToast('Correct > Attempted nahi ho sakta ❌', 'danger');
        return;
      }

      const topic = getTopic(currentTopicId);
      if (!topic) return;

      topic.questions = { attempted, correct };
      saveTopic(topic);
      renderTopic(topic);
      showToast('Questions saved 📝', 'success');
    });
  }

  // Add note
  const addNoteBtn = document.getElementById('addNoteBtn');
  if (addNoteBtn) {
    addNoteBtn.addEventListener('click', () => {
      const input = document.getElementById('noteInput');
      const note = input.value.trim();
      if (!note) return;

      const topic = getTopic(currentTopicId);
      if (!topic) return;

      if (!topic.notes) topic.notes = [];
      topic.notes.push(note);
      saveTopic(topic);
      input.value = '';
      renderTopic(topic);
      showToast('Note added 📌', 'success');
    });
  }

  // Enter key for note input
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('addNoteBtn').click();
      }
    });
  }

  // Delete note
  const notesList = document.getElementById('notesList');
  if (notesList) {
    notesList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-note-idx]');
      if (!delBtn) return;

      const idx = parseInt(delBtn.dataset.noteIdx);
      const topic = getTopic(currentTopicId);
      if (!topic || !topic.notes) return;

      topic.notes.splice(idx, 1);
      saveTopic(topic);
      renderTopic(topic);
      showToast('Note deleted', 'info');
    });
  }

  // Mark complete (top button)
  const markCompleteBtn = document.getElementById('markCompleteBtn');
  if (markCompleteBtn) {
    markCompleteBtn.addEventListener('click', () => {
      const topic = getTopic(currentTopicId);
      if (!topic) return;

      if (topic.status === 'completed') {
        showToast('Already completed ✅', 'info');
        return;
      }

      topic.status = 'completed';
      topic.lastStudied = todayStr();
      if (!topic.confidence) topic.confidence = 3;

      // Auto-generate revisions
      if (!topic.revisions || topic.revisions.length === 0) {
        topic.revisions = generateRevisionSchedule(topic.lastStudied);
      }

      saveTopic(topic);
      updateStreak();
      renderTopic(topic);
      showToast('Topic completed! 🎉 Revision schedule ban gaya', 'success');
    });
  }
}

// ---------- REVISION SCHEDULE GENERATOR ----------
function generateRevisionSchedule(studyDate) {
  const gaps = [2, 7, 15, 30];
  return gaps.map((gap, idx) => ({
    num: idx + 1,
    dueDate: addDays(studyDate, gap),
    done: false,
    doneDate: null
  }));
}

// ---------- ESCAPE HTML ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- HELPER ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}