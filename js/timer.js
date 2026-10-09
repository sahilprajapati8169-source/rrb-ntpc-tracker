/* ============================
   TIMER.JS — Smart Timer
   ============================ */

// ---------- STATE ----------
const TIMER_STATE = {
  IDLE: 'idle',
  STUDYING: 'studying',
  BREAK: 'break'
};

let state = TIMER_STATE.IDLE;
let session = null;
// ---------- TASK INTEGRATION (Phase A) ----------
let linkedTaskId = null;
let linkedTaskType = null;
let linkedTaskTargetMin = 0;
let intervalId = null;
let currentSegmentStart = null;
let focusStreakCount = 0;

const FOCUS_STREAK_THRESHOLD = 45; // minutes

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('startBtn')) return;

  populateSubjects();
  checkUrlTopic();
  attachEvents();
  warnOnClose();
  loadLinkedTaskFromURL();   // ← YE NAYA
});

// ---------- POPULATE SUBJECTS ----------
function populateSubjects() {
  const subjectSelect = document.getElementById('subjectSelect');
  if (!subjectSelect) return;

  subjectSelect.innerHTML = '<option value="">Select subject</option>';
  Object.keys(SYLLABUS_DATA).forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    subjectSelect.appendChild(opt);
  });
}

// ---------- URL TOPIC AUTO-SELECT ----------
// ---------- URL TOPIC AUTO-SELECT (Phase A) ----------
function checkUrlTopic() {
  const params = new URLSearchParams(window.location.search);
  
  // Support both 'id' (topic page se) and 'topicId' (task se)
  const topicId = params.get('id') || params.get('topicId');
  
  if (!topicId) {
    console.log('No topicId in URL');
    return;
  }

  const topic = getTopic(topicId);
  if (!topic) {
    console.warn('Topic not found:', topicId);
    return;
  }

  const subjectSelect = document.getElementById('subjectSelect');
  const topicSelect = document.getElementById('topicSelect');

  if (!subjectSelect || !topicSelect) {
    console.warn('Select elements not found');
    return;
  }

  // Set subject first
  subjectSelect.value = topic.subject;
  console.log('Subject set:', topic.subject);

  // Populate topics for this subject
  populateTopics(topic.subject);

  // Set topic value (small delay to ensure options are rendered)
  setTimeout(() => {
    topicSelect.value = topic.id;
    console.log('Topic set:', topic.id, '→', topic.name);
  }, 50);
}

// ---------- POPULATE TOPICS ----------
function populateTopics(subject) {
  const topicSelect = document.getElementById('topicSelect');
  if (!topicSelect) return;

  topicSelect.innerHTML = '<option value="">Select topic</option>';
  if (!subject) return;

  const topics = getTopicsBySubject(subject);
  topics.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    topicSelect.appendChild(opt);
  });
}

// ---------- EVENTS ----------
function attachEvents() {
  const subjectSelect = document.getElementById('subjectSelect');
  const startBtn = document.getElementById('startBtn');
  const takeBreakBtn = document.getElementById('takeBreakBtn');
  const endBtn = document.getElementById('endBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const endFromBreakBtn = document.getElementById('endFromBreakBtn');
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  const discardBtn = document.getElementById('discardBtn');

  // Subject change → populate topics
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      populateTopics(e.target.value);
    });
  }

  // Start
  if (startBtn) startBtn.addEventListener('click', startSession);

  // Take Break
  if (takeBreakBtn) takeBreakBtn.addEventListener('click', showBreakOptions);

  // Break type select
  const breakOptions = document.getElementById('breakOptions');
  if (breakOptions) {
    breakOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-break]');
      if (!btn) return;
      takeBreak(parseInt(btn.dataset.break));
    });
  }

  // End
  if (endBtn) endBtn.addEventListener('click', endSession);
  if (endFromBreakBtn) endFromBreakBtn.addEventListener('click', endSession);

  // Resume
  if (resumeBtn) resumeBtn.addEventListener('click', resumeStudy);

  // Save Session
  if (saveSessionBtn) saveSessionBtn.addEventListener('click', saveCurrentSession);

  // Discard
  if (discardBtn) discardBtn.addEventListener('click', async () => {
  const ok = await confirmAction('Session discard karna hai? Data save nahi hoga.', 'Discard Session');
  if (ok) {
    hideSummary();
    resetToIdle();
    showToast('Session discarded', 'info');
  }
});
  // Close task banner
  document.getElementById('closeTaskBanner')?.addEventListener('click', closeTaskBanner);
}

// ---------- START SESSION ----------
function startSession() {
  const subject = document.getElementById('subjectSelect').value;
  const topicId = document.getElementById('topicSelect').value;

  if (!subject || !topicId) {
    showToast('Subject aur topic select karo ❌', 'danger');
    return;
  }

  const topic = getTopic(topicId);

  session = {
    id: generateId('s'),
    subject: subject,
    topicId: topicId,
    topic: topic ? topic.name : '',
    startTime: new Date().toISOString(),
    endTime: null,
    segments: [],
    totalStudy: 0,
    totalBreak: 0,
    breakCount: 0,
    longestFocus: 0,
    focusStreaks: 0,
    taskId: linkedTaskId || null,          // ← YE NAYA
    taskType: linkedTaskType || 'study'     // ← YE NAYA
  };

  focusStreakCount = 0;

  // Switch to timer card
  document.getElementById('setupCard').classList.add('hidden');
  document.getElementById('timerCard').classList.remove('hidden');

  // Set labels
  document.getElementById('activeSubject').textContent = subject;
  document.getElementById('activeTopic').textContent = session.topic;

  // Start first study segment
  startSegment('study');
  setState(TIMER_STATE.STUDYING);
  showToast('Session started! Focus karo 🔥', 'success');
}

// ---------- START SEGMENT ----------
function startSegment(type) {
  currentSegmentStart = Date.now();
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(tick, 1000);
  tick();
}

// ---------- TICK ----------
function tick() {
  if (!currentSegmentStart) return;

  const elapsedMs = Date.now() - currentSegmentStart;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  document.getElementById('timerDisplay').textContent = formatTimer(elapsedSec);
  updateMiniStats(elapsedSec);
  updateTaskBannerLive(elapsedSec);   // ← YE NAYA
}

// ---------- UPDATE MINI STATS ----------
function updateMiniStats(currentSegmentSec) {
  if (!session) return;

  const completedStudy = session.segments
    .filter(s => s.type === 'study')
    .reduce((a, s) => a + s.duration, 0);
  const completedBreak = session.segments
    .filter(s => s.type === 'break')
    .reduce((a, s) => a + s.duration, 0);

  // Current segment
  const currentMin = Math.floor(currentSegmentSec / 60);
  const currentType = state === TIMER_STATE.STUDYING ? 'study' : 'break';

  const totalStudy = completedStudy + (currentType === 'study' ? currentMin : 0);
  const totalBreak = completedBreak + (currentType === 'break' ? currentMin : 0);

  document.getElementById('miniStudy').textContent = totalStudy + 'm';
  document.getElementById('miniBreak').textContent = totalBreak + 'm';
  document.getElementById('miniBreaks').textContent = session.breakCount;
}

// ---------- SET STATE ----------
function setState(newState) {
  state = newState;

  const badge = document.getElementById('stateBadge');
  const stateText = document.getElementById('stateText');
  const display = document.getElementById('timerDisplay');
  const studyingControls = document.getElementById('studyingControls');
  const breakControls = document.getElementById('breakControls');
  const breakOptions = document.getElementById('breakOptions');

  // Reset classes
  badge.className = 'timer-state-badge';
  display.className = 'timer-display';

  if (newState === TIMER_STATE.STUDYING) {
    badge.classList.add('studying');
    display.classList.add('studying');
    stateText.textContent = 'Studying';
    studyingControls.classList.remove('hidden');
    breakControls.classList.add('hidden');
    breakOptions.classList.add('hidden');
  } else if (newState === TIMER_STATE.BREAK) {
    badge.classList.add('break');
    display.classList.add('break');
    stateText.textContent = 'On Break';
    studyingControls.classList.add('hidden');
    breakControls.classList.remove('hidden');
    breakOptions.classList.add('hidden');
  }
}

// ---------- SHOW BREAK OPTIONS ----------
function showBreakOptions() {
  document.getElementById('breakOptions').classList.remove('hidden');
  document.getElementById('studyingControls').classList.add('hidden');
}

// ---------- TAKE BREAK ----------
function takeBreak(minutes) {
  if (!session) return;

  // End current study segment
  endCurrentSegment();

  // Check focus streak
  const lastSegment = session.segments[session.segments.length - 1];
  if (lastSegment && lastSegment.type === 'study') {
    if (lastSegment.duration >= FOCUS_STREAK_THRESHOLD) {
      focusStreakCount++;
      session.focusStreaks = focusStreakCount;
      showToast(`🔥 Focus Streak! ${lastSegment.duration} min continuous`, 'success');
    }
    if (lastSegment.duration > session.longestFocus) {
      session.longestFocus = lastSegment.duration;
    }
  }

  session.breakCount++;

  // Start break segment
  startSegment('break');
  setState(TIMER_STATE.BREAK);
  showToast(`☕ ${minutes} min break started`, 'info');

  // Auto-resume after break (optional) — currently manual
}

// ---------- RESUME STUDY ----------
function resumeStudy() {
  if (!session) return;

  endCurrentSegment();
  startSegment('study');
  setState(TIMER_STATE.STUDYING);
  showToast('▶️ Back to study!', 'success');
}

// ---------- END CURRENT SEGMENT ----------
function endCurrentSegment() {
  if (!currentSegmentStart || !session) return;

  const elapsedMs = Date.now() - currentSegmentStart;
  const durationMin = Math.round(elapsedMs / 1000 / 60);

  // Only save if > 0 min
  if (durationMin > 0) {
    const type = state === TIMER_STATE.STUDYING ? 'study' : 'break';
    session.segments.push({
      type: type,
      duration: durationMin
    });

    if (type === 'study') {
      session.totalStudy += durationMin;
    } else {
      session.totalBreak += durationMin;
    }
  }

  currentSegmentStart = null;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// ---------- END SESSION ----------
async function endSession() {
  if (!session) return;

  // Confirm
  if (session.segments.length > 0) {
    const ok = await confirmAction('Session end karna hai?', 'End Session');
    if (!ok) return;
  }

  endCurrentSegment();
  session.endTime = new Date().toISOString();

  // Check final focus streak
  const lastStudy = session.segments.filter(s => s.type === 'study').slice(-1)[0];
  if (lastStudy && lastStudy.duration >= FOCUS_STREAK_THRESHOLD && lastStudy.duration > session.longestFocus) {
    session.longestFocus = lastStudy.duration;
  }

  showSummary();
}

// ---------- SHOW SUMMARY ----------
function showSummary() {
  if (!session) return;

  const s = session;
  const totalTime = s.totalStudy + s.totalBreak;
  const focusRatio = totalTime > 0 ? Math.round((s.totalStudy / totalTime) * 100) : 0;

  // Break breakdown
  let shortBreaks = 0, mediumBreaks = 0, longBreaks = 0;
  s.segments.filter(seg => seg.type === 'break').forEach(seg => {
    if (seg.duration <= 5) shortBreaks++;
    else if (seg.duration <= 15) mediumBreaks++;
    else longBreaks++;
  });

  // Fill summary
  document.getElementById('sumStudy').textContent = formatTime(s.totalStudy);
  document.getElementById('sumBreak').textContent = formatTime(s.totalBreak);
  document.getElementById('sumBreaks').textContent = s.breakCount;
  document.getElementById('sumFocus').textContent = formatTime(s.longestFocus);

  document.getElementById('sumFocusBar').style.width = focusRatio + '%';
  document.getElementById('sumFocusRatio').textContent = `${focusRatio}% focus ratio`;

  document.getElementById('sumShortBreaks').textContent = shortBreaks;
  document.getElementById('sumMediumBreaks').textContent = mediumBreaks;
  document.getElementById('sumLongBreaks').textContent = longBreaks;

  // Focus streak section
  const streakSection = document.getElementById('focusStreakSection');
  if (focusStreakCount > 0) {
    streakSection.style.display = 'block';
    document.getElementById('sumFocusStreaks').textContent = focusStreakCount;
  } else {
    streakSection.style.display = 'none';
  }

  // Subtitle based on focus ratio
  let subtitle = 'Great work today';
  if (focusRatio >= 85) subtitle = '🔥 Excellent focus!';
  else if (focusRatio >= 70) subtitle = '✅ Good session';
  else if (focusRatio < 50) subtitle = '⚠️ Too many breaks';

  document.getElementById('summarySubtitle').textContent = subtitle;

  // Show modal
  document.getElementById('summaryModal').classList.add('show');
}

// ---------- HIDE SUMMARY ----------
function hideSummary() {
  document.getElementById('summaryModal').classList.remove('show');
}

// ---------- SAVE SESSION ----------
function saveCurrentSession() {
  if (!session) return;

  // Save to storage
  saveSession(session);

  // Update topic's studyTime
  if (session.topicId) {
    const topic = getTopic(session.topicId);
    if (topic) {
      topic.studyTime = (topic.studyTime || 0) + session.totalStudy;
      topic.lastStudied = todayStr();
      if (topic.status === 'not_started' && session.totalStudy >= 5) {
        topic.status = 'in_progress';
      }
      saveTopic(topic);
    }
  }

  // ⚡ Update linked task
  if (linkedTaskId && session.totalStudy > 0) {
    addTimeToTask(linkedTaskId, session.totalStudy);
    const progress = getTaskProgress(linkedTaskId);
    if (progress && progress.isComplete) {
      showToast(`🎉 Task complete! (${progress.doneMinutes} min)`, 'success');
    }
  }

  updateStreak();
  showToast('Session saved! 💾', 'success');
  hideSummary();
  resetToIdle();

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 800);
}

// ---------- RESET TO IDLE ----------
function resetToIdle() {
  state = TIMER_STATE.IDLE;
  session = null;
  currentSegmentStart = null;
  focusStreakCount = 0;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  // Show setup, hide timer
  document.getElementById('setupCard').classList.remove('hidden');
  document.getElementById('timerCard').classList.add('hidden');

  // Reset display
  document.getElementById('timerDisplay').textContent = '00:00:00';
  document.getElementById('segmentsList').innerHTML = '';

  // Reset selects
  document.getElementById('subjectSelect').value = '';
  document.getElementById('topicSelect').innerHTML = '<option value="">Select topic</option>';
}

// ---------- WARN ON CLOSE ----------
function warnOnClose() {
  window.addEventListener('beforeunload', (e) => {
    if (state !== TIMER_STATE.IDLE && session && session.totalStudy > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ---------- UPDATE SEGMENTS LIST (LIVE) ----------
// Called from tick — refresh live segments display
setInterval(() => {
  const list = document.getElementById('segmentsList');
  if (!list || !session || state === TIMER_STATE.IDLE) return;

  const segs = [...session.segments];
  // Add current live segment
  if (currentSegmentStart) {
    const currentMin = Math.round((Date.now() - currentSegmentStart) / 1000 / 60);
    if (currentMin > 0) {
      segs.push({
        type: state === TIMER_STATE.STUDYING ? 'study' : 'break',
        duration: currentMin,
        live: true
      });
    }
  }

  list.innerHTML = segs.map(s => `
    <div class="segment-row ${s.type}">
      <span>${s.type === 'study' ? '📖 Study' : '☕ Break'}${s.live ? ' (live)' : ''}</span>
      <span class="segment-row-duration">${formatTime(s.duration)}</span>
    </div>
  `).join('');
}, 3000);


// ---------- TASK INTEGRATION FUNCTIONS (Phase A) ----------
function loadLinkedTaskFromURL() {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('taskId');
  
  if (!taskId) return;
  
  const task = getTaskById(taskId);
  if (!task) return;

  // Save linked task info
  linkedTaskId = task.id;
  linkedTaskType = task.type || 'study';
  linkedTaskTargetMin = task.duration || 0;

  // Update UI
  renderTaskBanner(task);
}

function renderTaskBanner(task) {
  const banner = document.getElementById('taskBanner');
  if (!banner) return;

  banner.classList.remove('hidden');

  // Name
  const nameEl = document.getElementById('taskBannerName');
  if (nameEl) nameEl.textContent = task.name || 'Task';

  // Type badge
  const typeEl = document.getElementById('taskBannerType');
  if (typeEl) {
    typeEl.textContent = (task.type || 'study').charAt(0).toUpperCase() + (task.type || 'study').slice(1);
    typeEl.className = `badge badge-${getTypeBadgeClass(task.type)}`;
  }

  // Target
  const targetEl = document.getElementById('taskBannerTarget');
  if (targetEl) {
    targetEl.textContent = task.duration > 0 ? `Target: ${task.duration} min` : 'No target';
  }

  // Progress
  updateTaskBannerProgress();
}

function getTypeBadgeClass(type) {
  const map = {
    'study': 'info',
    'revision': 'success',
    'practice': 'warning',
    'custom': 'neutral'
  };
  return map[type] || 'info';
}

function updateTaskBannerProgress() {
  if (!linkedTaskId) return;

  const progress = getTaskProgress(linkedTaskId);
  if (!progress) return;

  const doneMin = progress.doneMinutes;
  const targetMin = progress.targetMinutes;
  const pct = progress.pct;

  // Progress text
  const textEl = document.getElementById('taskBannerProgressText');
  if (textEl) {
    textEl.textContent = targetMin > 0 
      ? `${doneMin} / ${targetMin} min` 
      : `${doneMin} min done`;
  }

  // Progress percentage
  const pctEl = document.getElementById('taskBannerProgressPct');
  if (pctEl) {
    pctEl.textContent = pct + '%';
    pctEl.className = '';
    if (pct >= 100) pctEl.style.color = 'var(--success)';
    else if (pct >= 50) pctEl.style.color = 'var(--warning)';
    else pctEl.style.color = 'var(--primary)';
  }

  // Progress bar
  const barEl = document.getElementById('taskBannerProgressBar');
  if (barEl) {
    barEl.style.width = pct + '%';
    barEl.className = 'progress-bar';
    if (pct >= 100) barEl.classList.add('success');
    else if (pct >= 50) barEl.classList.add('warning');
  }
}

// Called during tick to update live progress
function updateTaskBannerLive(currentSegmentSec) {
  if (!linkedTaskId) return;

  const progress = getTaskProgress(linkedTaskId);
  if (!progress) return;

  // Current session's accumulated time
  const currentSegmentMin = Math.floor(currentSegmentSec / 60);
  const currentTaskDone = progress.doneMinutes + currentSegmentMin;
  const targetMin = progress.targetMinutes;
  const pct = targetMin > 0 ? Math.min(100, Math.round((currentTaskDone / targetMin) * 100)) : 0;

  // Update text
  const textEl = document.getElementById('taskBannerProgressText');
  if (textEl) {
    textEl.textContent = targetMin > 0 
      ? `${currentTaskDone} / ${targetMin} min` 
      : `${currentTaskDone} min done`;
  }

  // Update percentage
  const pctEl = document.getElementById('taskBannerProgressPct');
  if (pctEl) {
    pctEl.textContent = pct + '%';
  }

  // Update bar
  const barEl = document.getElementById('taskBannerProgressBar');
  if (barEl) {
    barEl.style.width = pct + '%';
  }
}

// Close task banner (unlink)
function closeTaskBanner() {
  linkedTaskId = null;
  linkedTaskType = null;
  linkedTaskTargetMin = 0;

  const banner = document.getElementById('taskBanner');
  if (banner) banner.classList.add('hidden');

  showToast('Task connection removed', 'info');
}