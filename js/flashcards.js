/* ============================
   FLASHCARDS.JS — Flashcard System
   ============================ */

// ---------- STATE ----------
let sessionQueue = [];
let sessionIndex = 0;
let sessionStats = { again: 0, hard: 0, good: 0, easy: 0 };
let cardFlipped = false;

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('startSessionBtn')) return;

  populateSubjects();
  renderStats();
  showAppropriateView();
  attachEvents();
});

// ---------- POPULATE SUBJECTS ----------
function populateSubjects() {
  const sel = document.getElementById('fcSubject');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select subject</option>';
  Object.keys(SYLLABUS_DATA).forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    sel.appendChild(opt);
  });
}

function populateFormTopics(subject) {
  const sel = document.getElementById('fcTopic');
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

// ---------- STATS ----------
function renderStats() {
  const cards = getFlashcards();
  const today = todayStr();

  const due = cards.filter(c => !c.nextReview || c.nextReview <= today);
  const mastered = cards.filter(c => c.reviews >= 3 && c.ease >= 2.5);
  const progress = cards.length - due.length - mastered.length;

  setText('statTotal', cards.length);
  setText('statDue', due.length);
  setText('statProgress', Math.max(0, progress));
  setText('statMastered', mastered.length);
}

// ---------- VIEW MANAGEMENT ----------
function showAppropriateView() {
  const cards = getFlashcards();

  hideAllViews();

  if (cards.length === 0) {
    show('emptyState');
  } else {
    // Just show stats + toolbar — session starts on click
  }
}

function hideAllViews() {
  ['sessionArea', 'summaryArea', 'emptyState', 'addFormCard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

// ---------- EVENTS ----------
function attachEvents() {
  // Start Session
  document.getElementById('startSessionBtn')?.addEventListener('click', startSession);

  // Auto-Generate
  document.getElementById('autoGenBtn')?.addEventListener('click', handleAutoGenerate);
  document.getElementById('emptyAutoBtn')?.addEventListener('click', handleAutoGenerate);

  // Add Manual
  document.getElementById('addManualBtn')?.addEventListener('click', () => {
    document.getElementById('addFormCard').classList.remove('hidden');
  });
  document.getElementById('emptyManualBtn')?.addEventListener('click', () => {
    document.getElementById('addFormCard').classList.remove('hidden');
  });

  // Close form
  document.getElementById('closeFormBtn')?.addEventListener('click', () => {
    document.getElementById('addFormCard').classList.add('hidden');
  });
  document.getElementById('cancelCardBtn')?.addEventListener('click', () => {
    document.getElementById('addFormCard').classList.add('hidden');
  });

  // Subject change
  document.getElementById('fcSubject')?.addEventListener('change', (e) => {
    populateFormTopics(e.target.value);
  });

  // Save Card
  document.getElementById('saveCardBtn')?.addEventListener('click', saveManualCard);

  // Card flip
  document.getElementById('flashcard')?.addEventListener('click', flipCard);

  // Quality buttons
  document.getElementById('cardActions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quality]');
    if (!btn) return;
    handleQuality(parseInt(btn.dataset.quality));
  });

  // Quit session
  document.getElementById('quitSessionBtn')?.addEventListener('click', async () => {
    const ok = await confirmAction('Session quit karna hai?', 'Quit');
    if (ok) {
      hideAllViews();
      showAppropriateView();
      renderStats();
    }
  });

  // Close summary
  document.getElementById('closeSummaryBtn')?.addEventListener('click', () => {
    hideAllViews();
    showAppropriateView();
    renderStats();
  });

  // Restart
  document.getElementById('restartBtn')?.addEventListener('click', startSession);
}

// ---------- AUTO-GENERATE ----------
function handleAutoGenerate() {
  const created = generateFlashcardsFromTopics();
  if (created > 0) {
    showToast(`${created} flashcards generate hue! ✨`, 'success');
  } else {
    showToast('Koi naya note nahi mila jisse flashcard bane', 'info');
  }
  renderStats();
  showAppropriateView();
}

// ---------- SAVE MANUAL CARD ----------
function saveManualCard() {
  const subject = document.getElementById('fcSubject').value;
  const topicId = document.getElementById('fcTopic').value;
  const question = document.getElementById('fcQuestion').value.trim();
  const answer = document.getElementById('fcAnswer').value.trim();

  if (!subject || !question || !answer) {
    showToast('Subject, question aur answer required ❌', 'danger');
    return;
  }

  const topic = topicId ? getTopic(topicId) : null;

  saveFlashcard({
    id: generateId('fc'),
    topicId: topicId || null,
    topicName: topic?.name || '',
    subject,
    question,
    answer,
    ease: 2.5,
    interval: 1,
    nextReview: todayStr(),
    reviews: 0,
    lastReviewed: null,
    createdAt: todayStr()
  });

  // Reset form
  document.getElementById('fcSubject').value = '';
  document.getElementById('fcTopic').innerHTML = '<option value="">Select topic</option>';
  document.getElementById('fcQuestion').value = '';
  document.getElementById('fcAnswer').value = '';
  document.getElementById('addFormCard').classList.add('hidden');

  showToast('Card added ✅', 'success');
  renderStats();
  showAppropriateView();
}

// ---------- START SESSION ----------
function startSession() {
  const due = getDueFlashcards();

  if (due.length === 0) {
    // Agar due nahi hai, toh saare cards se session karo
    const all = getFlashcards();
    if (all.length === 0) {
      showToast('Koi card nahi hai. Pehle add karo.', 'info');
      return;
    }
    sessionQueue = shuffle([...all]);
    showToast('Koi due card nahi tha. Sab cards practice karo.', 'info');
  } else {
    sessionQueue = shuffle([...due]);
  }

  sessionIndex = 0;
  sessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

  hideAllViews();
  show('sessionArea');

  loadCard();
}

// ---------- LOAD CARD ----------
function loadCard() {
  if (sessionIndex >= sessionQueue.length) {
    showSummary();
    return;
  }

  const card = sessionQueue[sessionIndex];
  cardFlipped = false;

  const flipEl = document.getElementById('flashcard');
  if (flipEl) flipEl.classList.remove('flipped');

  setText('cardQuestion', card.question || '—');
  setText('cardAnswer', card.answer || '—');

  // Progress
  const pct = (sessionIndex / sessionQueue.length) * 100;
  const progressEl = document.getElementById('sessionProgress');
  if (progressEl) progressEl.style.width = pct + '%';

  setText('sessionCounter', `${sessionIndex + 1} / ${sessionQueue.length}`);

  // Hide actions until flip
  const actions = document.getElementById('cardActions');
  if (actions) actions.style.display = 'none';
}

// ---------- FLIP CARD ----------
function flipCard() {
  if (cardFlipped) return;

  const el = document.getElementById('flashcard');
  if (!el) return;

  el.classList.add('flipped');
  cardFlipped = true;

  // Show actions
  const actions = document.getElementById('cardActions');
  if (actions) actions.style.display = 'grid';
}

// ---------- HANDLE QUALITY ----------
function handleQuality(quality) {
  const card = sessionQueue[sessionIndex];
  if (!card) return;

  // SM-2 inspired algorithm
  let newEase = card.ease || 2.5;
  let newInterval = card.interval || 1;

  switch (quality) {
    case 0: // Again
      newEase = Math.max(1.3, newEase - 0.2);
      newInterval = 1; // 1 day
      sessionStats.again++;
      // Push back into queue (repeat in same session)
      sessionQueue.push(card);
      break;
    case 1: // Hard
      newEase = Math.max(1.3, newEase - 0.15);
      newInterval = 1;
      sessionStats.hard++;
      break;
    case 2: // Good
      newInterval = Math.round(newInterval * newEase);
      sessionStats.good++;
      break;
    case 3: // Easy
      newEase = Math.min(3.0, newEase + 0.15);
      newInterval = Math.round(newInterval * newEase * 1.3);
      sessionStats.easy++;
      break;
  }

  // Calculate next review date
  const nextReview = addDays(todayStr(), newInterval);

  // Update card in storage
  updateFlashcard(card.id, {
    ease: newEase,
    interval: newInterval,
    nextReview,
    reviews: (card.reviews || 0) + 1,
    lastReviewed: todayStr()
  });

  sessionIndex++;
  loadCard();
}

// ---------- SUMMARY ----------
function showSummary() {
  hideAllViews();
  show('summaryArea');

  const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;

  setText('summaryText', `Tumne ${total} cards review kiye`);
  setText('sumAgain', sessionStats.again);
  setText('sumHard', sessionStats.hard);
  setText('sumGood', sessionStats.good);
  setText('sumEasy', sessionStats.easy);

  renderStats();
}

// ---------- UTILS ----------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}