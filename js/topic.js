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
  renderSubtopics(topic);     // ← Ye naya
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

    // ---------- Subtopics Section Events ----------
  // Add Subtopic button
  document.getElementById('addSubtopicBtn')?.addEventListener('click', () => {
    document.getElementById('addSubtopicForm').classList.remove('hidden');
    document.getElementById('subtopicNameInput').focus();
  });

  // Cancel
  document.getElementById('cancelSubtopicBtn')?.addEventListener('click', () => {
    document.getElementById('addSubtopicForm').classList.add('hidden');
    document.getElementById('subtopicNameInput').value = '';
  });

  // Save subtopic
  document.getElementById('saveSubtopicBtn')?.addEventListener('click', () => {
    const input = document.getElementById('subtopicNameInput');
    const name = input.value.trim();

    if (!name) {
      showToast('Subtopic name daalo ❌', 'danger');
      input.focus();
      return;
    }

    // Duplicate check
    const existing = getSubtopics(currentTopicId);
    if (existing.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      showToast('Ye subtopic pehle se hai ❌', 'warning');
      return;
    }

    addSubtopic(currentTopicId, name);
    input.value = '';
    document.getElementById('addSubtopicForm').classList.add('hidden');

    const topic = getTopic(currentTopicId);
    renderSubtopics(topic);
    showToast('Subtopic added ✅', 'success');
  });

  // Enter key support
  document.getElementById('subtopicNameInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('saveSubtopicBtn').click();
    }
  });

    // ---------- Quick Templates (Phase 5) ----------
  document.getElementById('quickTemplatesBtn')?.addEventListener('click', openTemplatesModal);
  document.getElementById('closeTemplatesBtn')?.addEventListener('click', closeTemplatesModal);
  document.getElementById('cancelTemplatesBtn')?.addEventListener('click', closeTemplatesModal);
  document.getElementById('applyTemplateBtn')?.addEventListener('click', applySelectedTemplates);

  // Close on backdrop click
  document.getElementById('templatesModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'templatesModal') closeTemplatesModal();
  });

  // Attach subtopic events
  attachSubtopicEvents();
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

// ---------- SUBTOPICS (Phase 1) ----------
function renderSubtopicCard(sub, index) {
  const notes = sub.notes || [];
  const formulas = sub.formulas || [];
  const q = sub.questions || { attempted: 0, correct: 0 };
  const acc = q.attempted > 0 ? percent(q.correct, q.attempted) : 0;
  const accClass = q.attempted === 0 ? '' : (acc >= 75 ? 'success' : acc >= 60 ? 'warning' : 'danger');

  // Mistakes for this subtopic
  const mistakes = getSubtopicMistakes(currentTopicId, sub.id);
  const mistakeCount = mistakes.length;

  return `
    <div class="subtopic-card" data-subtopic-id="${sub.id}">
      <div class="subtopic-header">
        <div class="subtopic-header-left" data-toggle-subtopic>
          <span class="subtopic-arrow">▶</span>
          <span class="subtopic-number">${index + 1}</span>
          <span class="subtopic-name">${escapeHtml(sub.name)}</span>
        </div>
        <div class="subtopic-header-right">
          ${notes.length > 0 ? `<span class="badge badge-info" title="${notes.length} notes">📝 ${notes.length}</span>` : ''}
          ${formulas.length > 0 ? `<span class="badge badge-warning" title="${formulas.length} formulas">📐 ${formulas.length}</span>` : ''}
          ${q.attempted > 0 ? `<span class="badge badge-${accClass}" title="${q.correct}/${q.attempted} correct">📊 ${acc}%</span>` : ''}
          ${mistakeCount > 0 ? `<span class="badge badge-danger" title="${mistakeCount} mistakes">❌ ${mistakeCount}</span>` : ''}
          <button 
            type="button"
            class="subtopic-delete" 
            data-delete-subtopic 
            title="Delete subtopic"
          >🗑️</button>
        </div>
      </div>
      <div class="subtopic-body">

        <!-- Notes Section -->
        <div class="subtopic-section">
          <div class="subtopic-section-title">📝 Notes</div>
          <div class="subtopic-notes-list" data-notes-list>
            ${notes.length === 0 
              ? '<p class="text-xs text-muted" style="padding: 8px 0;">Koi note nahi hai</p>'
              : notes.map((n, ni) => `
                  <div class="note-item">
                    <div class="note-item-text">${escapeHtml(n)}</div>
                    <button 
                      type="button"
                      class="note-item-delete" 
                      data-delete-note="${ni}" 
                      title="Delete note"
                    >✕</button>
                  </div>
                `).join('')
            }
          </div>
          <div class="flex gap-2 mt-2">
            <input type="text" class="form-input form-input-sm" placeholder="Add note..." data-note-input />
            <button type="button" class="btn btn-primary btn-sm" data-add-note>+</button>
          </div>
        </div>

        <!-- Formulas Section -->
        <div class="subtopic-section">
          <div class="subtopic-section-title">📐 Formulas / Reminders</div>
          <div class="subtopic-formulas-list" data-formulas-list>
            ${formulas.length === 0 
              ? '<p class="text-xs text-muted" style="padding: 8px 0;">Koi formula nahi hai</p>'
              : formulas.map((f, fi) => `
                  <div class="formula-item">
                    <div class="formula-item-text">${escapeHtml(f)}</div>
                    <button type="button" class="formula-item-delete" data-delete-formula="${fi}">✕</button>
                  </div>
                `).join('')
            }
          </div>
          <div class="flex gap-2 mt-2">
            <input type="text" class="form-input form-input-sm" placeholder="Add formula..." data-formula-input />
            <button type="button" class="btn btn-primary btn-sm" data-add-formula>+</button>
          </div>
        </div>

        <!-- Questions Section -->
        <div class="subtopic-section">
          <div class="subtopic-section-title">📊 Question Practice</div>

          <div class="subtopic-practice-grid">
            <div class="practice-stat-mini">
              <div class="practice-stat-mini-value">${q.attempted}</div>
              <div class="practice-stat-mini-label">Attempted</div>
            </div>
            <div class="practice-stat-mini">
              <div class="practice-stat-mini-value">${q.correct}</div>
              <div class="practice-stat-mini-label">Correct</div>
            </div>
            <div class="practice-stat-mini">
              <div class="practice-stat-mini-value">${q.attempted > 0 ? acc + '%' : '—'}</div>
              <div class="practice-stat-mini-label">Accuracy</div>
            </div>
          </div>

          ${q.attempted > 0 ? `
            <div class="progress" style="margin-top: 8px;">
              <div class="progress-bar ${accClass}" style="width: ${acc}%;"></div>
            </div>
          ` : ''}

          <div class="flex gap-2 mt-3">
            <input type="number" class="form-input form-input-sm" placeholder="Attempted" min="0" value="${q.attempted || ''}" data-input-attempted />
            <input type="number" class="form-input form-input-sm" placeholder="Correct" min="0" value="${q.correct || ''}" data-input-correct />
            <button type="button" class="btn btn-primary btn-sm" data-save-questions>Save</button>
          </div>
        </div>

        <!-- Mistakes Section (Phase 5) -->
        ${mistakeCount > 0 ? `
          <div class="subtopic-section">
            <div class="subtopic-section-title">❌ Recent Mistakes (${mistakeCount})</div>
            ${mistakes.slice(-3).reverse().map(m => `
              <div class="subtopic-mistake-item">
                <div class="subtopic-mistake-q">${escapeHtml(m.question || 'Question')}</div>
                <div class="subtopic-mistake-a">
                  Your: <strong>${escapeHtml(m.wrongAnswer || '—')}</strong> • 
                  Correct: <strong>${escapeHtml(m.correctAnswer || '—')}</strong>
                </div>
              </div>
            `).join('')}
            ${mistakeCount > 3 ? `<p class="text-xs text-muted text-center mt-2">+${mistakeCount - 3} aur mistakes</p>` : ''}
          </div>
        ` : ''}

      </div>
    </div>
  `;
}
// ---------- SUBTOPIC EVENTS (Fixed) ----------
// ---------- SUBTOPIC EVENTS (Phase 2) ----------
// ---------- SUBTOPIC EVENTS (Phase 3) ----------
let subtopicEventsAttached = false;

function attachSubtopicEvents() {
  const container = document.getElementById('subtopicsList');
  if (!container) return;

  if (subtopicEventsAttached) return;
  subtopicEventsAttached = true;

  // Click handler
  container.addEventListener('click', async (e) => {
    const card = e.target.closest('[data-subtopic-id]');
    if (!card) return;

    const subtopicId = card.dataset.subtopicId;

    // ⚡ 1. DELETE SUBTOPIC
    if (e.target.closest('[data-delete-subtopic]')) {
      e.preventDefault();
      e.stopPropagation();

      const ok = await confirmAction('Subtopic delete karna hai? (Saare notes aur formulas bhi delete ho jayenge)', 'Delete Subtopic');
      if (ok) {
        deleteSubtopic(currentTopicId, subtopicId);
        const updatedTopic = getTopic(currentTopicId);
        renderSubtopics(updatedTopic);
        showToast('Subtopic deleted', 'info');
      }
      return;
    }

    // ⚡ 2. DELETE NOTE
    const delNoteBtn = e.target.closest('[data-delete-note]');
    if (delNoteBtn) {
      e.preventDefault();
      e.stopPropagation();

      const idx = parseInt(delNoteBtn.dataset.deleteNote);
      deleteSubtopicNote(currentTopicId, subtopicId, idx);
      
      const updatedTopic = getTopic(currentTopicId);
      renderSubtopics(updatedTopic);
      
      reopenSubtopicCard(subtopicId);
      showToast('Note deleted', 'info');
      return;
    }

    // ⚡ 3. ADD NOTE
    if (e.target.closest('[data-add-note]')) {
      e.preventDefault();
      e.stopPropagation();

      const input = card.querySelector('[data-note-input]');
      const note = input.value.trim();

      if (!note) {
        showToast('Note khaali hai ❌', 'warning');
        input.focus();
        return;
      }

      addSubtopicNote(currentTopicId, subtopicId, note);
      
      const updatedTopic = getTopic(currentTopicId);
      renderSubtopics(updatedTopic);
      
      reopenSubtopicCard(subtopicId, '[data-note-input]');
      showToast('Note added 📝', 'success');
      return;
    }

    // ⚡ 4. DELETE FORMULA
    const delFormulaBtn = e.target.closest('[data-delete-formula]');
    if (delFormulaBtn) {
      e.preventDefault();
      e.stopPropagation();

      const idx = parseInt(delFormulaBtn.dataset.deleteFormula);
      deleteSubtopicFormula(currentTopicId, subtopicId, idx);
      
      const updatedTopic = getTopic(currentTopicId);
      renderSubtopics(updatedTopic);
      
      reopenSubtopicCard(subtopicId);
      showToast('Formula deleted', 'info');
      return;
    }

    // ⚡ 5. ADD FORMULA
    if (e.target.closest('[data-add-formula]')) {
      e.preventDefault();
      e.stopPropagation();

      const input = card.querySelector('[data-formula-input]');
      const formula = input.value.trim();

      if (!formula) {
        showToast('Formula khaali hai ❌', 'warning');
        input.focus();
        return;
      }

      addSubtopicFormula(currentTopicId, subtopicId, formula);
      
      const updatedTopic = getTopic(currentTopicId);
      renderSubtopics(updatedTopic);
      
      reopenSubtopicCard(subtopicId, '[data-formula-input]');
      showToast('Formula added 📐', 'success');
      return;
    }

        // ⚡ 6. SAVE QUESTIONS
    if (e.target.closest('[data-save-questions]')) {
      e.preventDefault();
      e.stopPropagation();

      const inputA = card.querySelector('[data-input-attempted]');
      const inputC = card.querySelector('[data-input-correct]');
      const attempted = parseInt(inputA.value) || 0;
      const correct = parseInt(inputC.value) || 0;

      if (attempted < 0 || correct < 0) {
        showToast('Negative values nahi ❌', 'danger');
        return;
      }

      if (correct > attempted) {
        showToast('Correct > Attempted nahi ho sakta ❌', 'danger');
        return;
      }

      // Update subtopic
      updateSubtopicQuestions(currentTopicId, subtopicId, attempted, correct);

      // Auto-sum to topic
      updateTopicQuestionsFromSubtopics(currentTopicId);

      // Re-render
      const updatedTopic = getTopic(currentTopicId);
      renderTopic(updatedTopic);
      
      reopenSubtopicCard(subtopicId);
      showToast('Questions saved 📊', 'success');
      return;
    }

    // 6. TOGGLE ACCORDION
    if (e.target.closest('[data-toggle-subtopic]')) {
      card.classList.toggle('open');
      return;
    }
  });

  // Enter key support for note input
  container.addEventListener('keypress', (e) => {
    if (e.key !== 'Enter') return;

    const input = e.target;

    if (input.matches('[data-note-input]')) {
      e.preventDefault();
      const card = input.closest('[data-subtopic-id]');
      card?.querySelector('[data-add-note]')?.click();
      return;
    }

    if (input.matches('[data-formula-input]')) {
      e.preventDefault();
      const card = input.closest('[data-subtopic-id]');
      card?.querySelector('[data-add-formula]')?.click();
      return;
    }
  });
}

// ---------- RE-OPEN SUBTOPIC CARD AFTER RE-RENDER ----------
function reopenSubtopicCard(subtopicId, focusSelector) {
  setTimeout(() => {
    const newCard = document.querySelector(`[data-subtopic-id="${subtopicId}"]`);
    if (!newCard) return;
    newCard.classList.add('open');
    if (focusSelector) {
      newCard.querySelector(focusSelector)?.focus();
    }
  }, 50);
}

// ---------- RENDER SUBTOPICS LIST ----------
function renderSubtopics(topic) {
  const container = document.getElementById('subtopicsList');
  const subtext = document.getElementById('subtopicsSubtext');
  if (!container) return;

  const subtopics = topic.subtopics || [];

  // Update subtitle with count
  if (subtext) {
    subtext.textContent = subtopics.length === 0 
      ? 'Chapter ke chhote parts track karo'
      : `${subtopics.length} subtopic${subtopics.length > 1 ? 's' : ''} tracked`;
  }

  if (subtopics.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <p>Abhi koi subtopic nahi hai</p>
        <p class="text-xs mt-2">"+ Add Subtopic" click karke apne chapter ke types/parts add karo</p>
      </div>
    `;
    attachSubtopicEvents();
    return;
  }

  container.innerHTML = subtopics.map((sub, idx) => renderSubtopicCard(sub, idx)).join('');
  attachSubtopicEvents();
}

// ---------- QUICK TEMPLATES (Phase 5) ----------
let selectedTemplates = [];

function openTemplatesModal() {
  const modal = document.getElementById('templatesModal');
  if (!modal) return;

  // Get topic
  const topic = getTopic(currentTopicId);
  if (!topic) return;

  // Get templates for this topic's subject
  const templates = getTemplatesBySubject(topic.subject);

  // Find template matching this specific topic
  const exactTemplate = getTemplateForTopic(currentTopicId);

  const container = document.getElementById('templatesList');
  if (!container) return;

  if (templates.length === 0 && !exactTemplate) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>Is subject ke liye koi template nahi hai</p>
        <p class="text-xs mt-2">Manually subtopics add karo</p>
      </div>
    `;
  } else {
    // Show exact template first, then others
    const allTemplates = [];
    if (exactTemplate) {
      allTemplates.push({ topicId: currentTopicId, ...exactTemplate, isExact: true });
    }
    templates.forEach(t => {
      if (t.topicId !== currentTopicId) allTemplates.push(t);
    });

    container.innerHTML = allTemplates.map(t => `
      <div class="template-option" data-template-id="${t.topicId}">
        <div class="template-option-check">✓</div>
        <div class="template-option-content">
          <div class="template-option-name">${t.icon} ${t.name}${t.isExact ? ' <span style="color: var(--primary); font-size: 11px;">(Recommended)</span>' : ''}</div>
          <div class="template-option-desc">${t.subtopics.length} subtopics: ${t.subtopics.slice(0, 3).join(', ')}${t.subtopics.length > 3 ? '...' : ''}</div>
        </div>
      </div>
    `).join('');
  }

  selectedTemplates = [];

  // Add click handlers
  container.querySelectorAll('.template-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const id = opt.dataset.templateId;
      if (selectedTemplates.includes(id)) {
        selectedTemplates = selectedTemplates.filter(t => t !== id);
        opt.classList.remove('selected');
      } else {
        selectedTemplates.push(id);
        opt.classList.add('selected');
      }
    });
  });

  modal.classList.add('show');
}

function closeTemplatesModal() {
  document.getElementById('templatesModal')?.classList.remove('show');
  selectedTemplates = [];
}

function applySelectedTemplates() {
  if (selectedTemplates.length === 0) {
    showToast('Koi template select karo ❌', 'warning');
    return;
  }

  let totalAdded = 0;

  selectedTemplates.forEach(topicId => {
    const template = getTemplateForTopic(topicId);
    if (!template) return;

    const added = applyTemplateToTopic(currentTopicId, template);
    totalAdded += added;
  });

  closeTemplatesModal();

  // Re-render
  const topic = getTopic(currentTopicId);
  renderTopic(topic);

  if (totalAdded > 0) {
    showToast(`${totalAdded} subtopics added ⚡`, 'success');
  } else {
    showToast('Saare subtopics pehle se hain', 'info');
  }
}