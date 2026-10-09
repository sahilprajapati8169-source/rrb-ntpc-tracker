/* ============================
   STORAGE.JS — LocalStorage Data Layer
   ============================ */

// ---------- CONSTANTS ----------
const STORAGE_KEYS = {
  USER:      'rrb_user',
  TOPICS:    'rrb_topics',
  SESSIONS:  'rrb_sessions',
  MISTAKES:  'rrb_mistakes',
  MOCKS:     'rrb_mocks',
  STREAK:    'rrb_streak',
  SETTINGS:  'rrb_settings',
  INIT:      'rrb_initialized'
};

// ---------- CORE FUNCTIONS ----------
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Save error:', e);
    return false;
  }
}

function getData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Get error:', e);
    return fallback;
  }
}

function removeData(key) {
  localStorage.removeItem(key);
}

function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}

// ---------- USER ----------
function getUser() {
  return getData(STORAGE_KEYS.USER, null);
}

function saveUser(user) {
  return saveData(STORAGE_KEYS.USER, user);
}

function isLoggedIn() {
  return getUser() !== null;
}

function logout() {
  removeData(STORAGE_KEYS.USER);
}

// ---------- SETTINGS ----------
function getSettings() {
  return getData(STORAGE_KEYS.SETTINGS, {
    dailyGoal: 3,           // hours
    focusTarget: 45,        // minutes
    breakShort: 5,
    breakMedium: 10,
    breakLong: 20
  });
}

function saveSettings(settings) {
  return saveData(STORAGE_KEYS.SETTINGS, settings);
}

// ---------- TOPICS ----------
function getTopics() {
  return getData(STORAGE_KEYS.TOPICS, []);
}

function getTopic(id) {
  const topics = getTopics();
  return topics.find(t => t.id === id) || null;
}

function saveTopic(topic) {
  let topics = getTopics();
  const index = topics.findIndex(t => t.id === topic.id);
  if (index >= 0) {
    topics[index] = { ...topics[index], ...topic };
  } else {
    topics.push(topic);
  }
  return saveData(STORAGE_KEYS.TOPICS, topics);
}

function saveAllTopics(topics) {
  return saveData(STORAGE_KEYS.TOPICS, topics);
}

function deleteTopic(id) {
  const topics = getTopics().filter(t => t.id !== id);
  return saveData(STORAGE_KEYS.TOPICS, topics);
}

function getTopicsBySubject(subject) {
  return getTopics().filter(t => t.subject === subject);
}

function getTopicsByStatus(status) {
  return getTopics().filter(t => t.status === status);
}

// ---------- SESSIONS (Timer) ----------
function getSessions() {
  return getData(STORAGE_KEYS.SESSIONS, []);
}

function getSession(id) {
  return getSessions().find(s => s.id === id) || null;
}

function saveSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  return saveData(STORAGE_KEYS.SESSIONS, sessions);
}

function updateSession(id, updates) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index >= 0) {
    sessions[index] = { ...sessions[index], ...updates };
    return saveData(STORAGE_KEYS.SESSIONS, sessions);
  }
  return false;
}

function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  return saveData(STORAGE_KEYS.SESSIONS, sessions);
}

function getSessionsByDate(dateStr) {
  return getSessions().filter(s => {
    if (!s.startTime) return false;
    return s.startTime.split('T')[0] === dateStr;
  });
}

function getTodaySessions() {
  return getSessionsByDate(todayStr());
}

function getTotalStudyMinutes(sessions) {
  return sessions.reduce((acc, s) => acc + (s.totalStudy || 0), 0);
}

function getTotalBreakMinutes(sessions) {
  return sessions.reduce((acc, s) => acc + (s.totalBreak || 0), 0);
}

// ---------- STREAK ----------
function getStreak() {
  return getData(STORAGE_KEYS.STREAK, {
    current: 0,
    longest: 0,
    lastDate: null,
    history: []
  });
}

function saveStreak(streak) {
  return saveData(STORAGE_KEYS.STREAK, streak);
}

function updateStreak() {
  const today = todayStr();
  const streak = getStreak();

  if (streak.lastDate === today) {
    return streak; // already counted today
  }

  const yesterday = addDays(today, -1);

  if (streak.lastDate === yesterday) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }

  if (streak.current > streak.longest) {
    streak.longest = streak.current;
  }

  streak.lastDate = today;
  if (!streak.history.includes(today)) {
    streak.history.push(today);
  }

  saveStreak(streak);
  return streak;
}

// ---------- MISTAKES ----------
function getMistakes() {
  return getData(STORAGE_KEYS.MISTAKES, []);
}

function saveMistake(mistake) {
  const mistakes = getMistakes();
  if (!mistake.id) mistake.id = generateId('mis');
  mistakes.push(mistake);
  return saveData(STORAGE_KEYS.MISTAKES, mistakes);
}

function updateMistake(id, updates) {
  const mistakes = getMistakes();
  const index = mistakes.findIndex(m => m.id === id);
  if (index >= 0) {
    mistakes[index] = { ...mistakes[index], ...updates };
    return saveData(STORAGE_KEYS.MISTAKES, mistakes);
  }
  return false;
}

function deleteMistake(id) {
  const mistakes = getMistakes().filter(m => m.id !== id);
  return saveData(STORAGE_KEYS.MISTAKES, mistakes);
}

// ---------- MOCKS ----------
function getMocks() {
  return getData(STORAGE_KEYS.MOCKS, []);
}

function saveMock(mock) {
  const mocks = getMocks();
  if (!mock.id) mock.id = generateId('mock');
  mocks.push(mock);
  return saveData(STORAGE_KEYS.MOCKS, mocks);
}

function updateMock(id, updates) {
  const mocks = getMocks();
  const index = mocks.findIndex(m => m.id === id);
  if (index >= 0) {
    mocks[index] = { ...mocks[index], ...updates };
    return saveData(STORAGE_KEYS.MOCKS, mocks);
  }
  return false;
}

function deleteMock(id) {
  const mocks = getMocks().filter(m => m.id !== id);
  return saveData(STORAGE_KEYS.MOCKS, mocks);
}

// ---------- COMPUTED ----------
function getSyllabusProgress() {
  const topics = getTopics();
  if (!topics.length) return 0;
  const completed = topics.filter(t => t.status === 'completed').length;
  return percent(completed, topics.length);
}

function getAverageAccuracy() {
  const topics = getTopics().filter(t => t.questions && t.questions.attempted > 0);
  if (!topics.length) return 0;
  const totalAttempted = sum(topics, 'questions');
  return 0; // Will compute properly in later phase
}

// ---------- INIT ----------
function initStorage() {
  const isInit = getData(STORAGE_KEYS.INIT, false);

  if (!isInit) {
    // First time — set default values
    if (!getStreak().lastDate) {
      saveStreak({ current: 0, longest: 0, lastDate: null, history: [] });
    }
    if (!getData(STORAGE_KEYS.SETTINGS)) {
      saveSettings({
        dailyGoal: 3,
        focusTarget: 45,
        breakShort: 5,
        breakMedium: 10,
        breakLong: 20
      });
    }
    saveData(STORAGE_KEYS.INIT, true);
    console.log('✅ Storage initialized');
  }
}

// Auto-init on load
initStorage();

// ---------- FLASHCARDS ----------
function getFlashcards() {
  return getData('rrb_flashcards', []);
}

function saveFlashcard(card) {
  const cards = getFlashcards();
  if (!card.id) card.id = generateId('fc');
  cards.push(card);
  return saveData('rrb_flashcards', cards);
}

function updateFlashcard(id, updates) {
  const cards = getFlashcards();
  const idx = cards.findIndex(c => c.id === id);
  if (idx >= 0) {
    cards[idx] = { ...cards[idx], ...updates };
    return saveData('rrb_flashcards', cards);
  }
  return false;
}

function deleteFlashcard(id) {
  const cards = getFlashcards().filter(c => c.id !== id);
  return saveData('rrb_flashcards', cards);
}

function getDueFlashcards() {
  const today = todayStr();
  return getFlashcards().filter(c => !c.nextReview || c.nextReview <= today);
}

// Auto-generate flashcards from topic notes
function generateFlashcardsFromTopics() {
  const topics = getTopics();
  const existing = getFlashcards();
  const existingQuestions = new Set(existing.map(c => c.question));
  let created = 0;

  topics.forEach(topic => {
    (topic.notes || []).forEach(note => {
      // Skip if already exists
      if (existingQuestions.has(note)) return;

      // Simple heuristic: if note has ':' split into Q/A
      let question = `Topic: ${topic.name}`;
      let answer = note;

      if (note.includes(':')) {
        const parts = note.split(':');
        question = parts[0].trim() + '?';
        answer = parts.slice(1).join(':').trim();
      } else if (note.includes('=')) {
        const parts = note.split('=');
        question = parts[0].trim() + ' = ?';
        answer = parts.slice(1).join('=').trim();
      } else {
        question = `What is this from ${topic.name}?`;
        answer = note;
      }

      saveFlashcard({
        id: generateId('fc'),
        topicId: topic.id,
        topicName: topic.name,
        subject: topic.subject,
        question,
        answer,
        ease: 2.5,
        interval: 1,
        nextReview: todayStr(),
        reviews: 0,
        lastReviewed: null,
        createdAt: todayStr(),
        autoGenerated: true
      });
      created++;
    });
  });

  return created;
}

// ---------- ACHIEVEMENTS ----------
function getAchievementsData() {
  return getData('rrb_achievements', {
    unlocked: [],
    unlockedDates: {},
    bonusXP: 0
  });
}

function saveAchievementsData(data) {
  return saveData('rrb_achievements', data);
}

function unlockAchievement(id) {
  const data = getAchievementsData();
  if (data.unlocked.includes(id)) return false;

  data.unlocked.push(id);
  data.unlockedDates[id] = todayStr();
  data.bonusXP = (data.bonusXP || 0) + 100; // 100 XP bonus per unlock
  saveAchievementsData(data);
  return true;
}

function isAchievementUnlocked(id) {
  return getAchievementsData().unlocked.includes(id);
}

// ---------- EXAM DATE ----------
function getExamDate() {
  return getData('rrb_exam_date', null);
}

function setExamDate(dateStr) {
  return saveData('rrb_exam_date', dateStr);
}

// ---------- DAILY PLAN ----------
function getTodayPlanData() {
  const today = todayStr();
  const plans = getData('rrb_daily_plans', {});
  return plans[today] || { tasks: [], date: today };
}

function saveTodayPlanData(planData) {
  const today = todayStr();
  const plans = getData('rrb_daily_plans', {});
  plans[today] = { ...planData, date: today };
  return saveData('rrb_daily_plans', plans);
}

function addPlanTask(task) {
  const plan = getTodayPlanData();
  if (!task.id) task.id = generateId('task');
  task.done = false;
  task.createdAt = new Date().toISOString();
  plan.tasks.push(task);
  return saveTodayPlanData(plan);
}

function updatePlanTask(taskId, updates) {
  const plan = getTodayPlanData();
  const idx = plan.tasks.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    plan.tasks[idx] = { ...plan.tasks[idx], ...updates };
    return saveTodayPlanData(plan);
  }
  return false;
}

function deletePlanTask(taskId) {
  const plan = getTodayPlanData();
  plan.tasks = plan.tasks.filter(t => t.id !== taskId);
  return saveTodayPlanData(plan);
}

function clearTodayPlan() {
  const today = todayStr();
  const plans = getData('rrb_daily_plans', {});
  delete plans[today];
  return saveData('rrb_daily_plans', plans);
}

// Copy yesterday's unfinished tasks to today
function copyUnfinishedFromYesterday() {
  const today = todayStr();
  const yesterday = addDays(today, -1);
  const plans = getData('rrb_daily_plans', {});

  const yPlan = plans[yesterday];
  if (!yPlan || !yPlan.tasks) return 0;

  const unfinished = yPlan.tasks.filter(t => !t.done);
  if (unfinished.length === 0) return 0;

  const todayPlan = plans[today] || { tasks: [], date: today };
  unfinished.forEach(t => {
    todayPlan.tasks.push({
      ...t,
      id: generateId('task'),
      done: false,
      copiedFrom: yesterday
    });
  });
  plans[today] = todayPlan;
  saveData('rrb_daily_plans', plans);
  return unfinished.length;
}

// Get history stats
function getPlanHistory(days = 7) {
  const plans = getData('rrb_daily_plans', {});
  const history = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayStr(), -i);
    const plan = plans[date];
    if (plan && plan.tasks) {
      const total = plan.tasks.length;
      const done = plan.tasks.filter(t => t.done).length;
      const plannedMin = plan.tasks.reduce((a, t) => a + (t.duration || 0), 0);
      const doneMin = plan.tasks.filter(t => t.done).reduce((a, t) => a + (t.duration || 0), 0);
      history.push({ date, total, done, plannedMin, doneMin });
    }
  }
  return history;
}

// ---------- PLAN TEMPLATES ----------
function getPlanTemplates() {
  return getData('rrb_plan_templates', []);
}

function savePlanTemplate(template) {
  const templates = getPlanTemplates();
  if (!template.id) template.id = generateId('tpl');
  template.createdAt = new Date().toISOString();
  templates.push(template);
  return saveData('rrb_plan_templates', templates);
}

function deletePlanTemplate(id) {
  const templates = getPlanTemplates().filter(t => t.id !== id);
  return saveData('rrb_plan_templates', templates);
}

function applyPlanTemplate(templateId) {
  const templates = getPlanTemplates();
  const tpl = templates.find(t => t.id === templateId);
  if (!tpl) return 0;

  const plan = getTodayPlanData();
  let added = 0;

  tpl.tasks.forEach(t => {
    plan.tasks.push({
      ...t,
      id: generateId('task'),
      done: false,
      createdAt: new Date().toISOString()
    });
    added++;
  });

  saveTodayPlanData(plan);
  return added;
}

// ---------- SUBTOPICS (Phase 1: Basic) ----------
function getSubtopics(topicId) {
  const topic = getTopic(topicId);
  if (!topic) return [];
  return topic.subtopics || [];
}

function addSubtopic(topicId, name) {
  const topic = getTopic(topicId);
  if (!topic) return null;

  if (!topic.subtopics) topic.subtopics = [];

  const subtopic = {
    id: generateId('sub'),
    name: name.trim(),
    notes: [],
    formulas: [],
    questions: { attempted: 0, correct: 0 },
    createdAt: todayStr()
  };

  topic.subtopics.push(subtopic);
  saveTopic(topic);
  return subtopic;
}

function updateSubtopic(topicId, subtopicId, updates) {
  const topic = getTopic(topicId);
  if (!topic || !topic.subtopics) return false;

  const idx = topic.subtopics.findIndex(s => s.id === subtopicId);
  if (idx < 0) return false;

  topic.subtopics[idx] = { ...topic.subtopics[idx], ...updates };
  saveTopic(topic);
  return true;
}

function deleteSubtopic(topicId, subtopicId) {
  const topic = getTopic(topicId);
  if (!topic || !topic.subtopics) return false;

  topic.subtopics = topic.subtopics.filter(s => s.id !== subtopicId);
  saveTopic(topic);
  return true;
}

// ---------- SUBTOPIC NOTES (Phase 2) ----------
function addSubtopicNote(topicId, subtopicId, note) {
  const topic = getTopic(topicId);
  if (!topic) return false;

  const sub = (topic.subtopics || []).find(s => s.id === subtopicId);
  if (!sub) return false;

  if (!sub.notes) sub.notes = [];
  sub.notes.push(note.trim());
  saveTopic(topic);
  return true;
}

function deleteSubtopicNote(topicId, subtopicId, noteIdx) {
  const topic = getTopic(topicId);
  if (!topic) return false;

  const sub = (topic.subtopics || []).find(s => s.id === subtopicId);
  if (!sub || !sub.notes) return false;

  sub.notes.splice(noteIdx, 1);
  saveTopic(topic);
  return true;
}

// ---------- SUBTOPIC FORMULAS (Phase 3) ----------
function addSubtopicFormula(topicId, subtopicId, formula) {
  const topic = getTopic(topicId);
  if (!topic) return false;

  const sub = (topic.subtopics || []).find(s => s.id === subtopicId);
  if (!sub) return false;

  if (!sub.formulas) sub.formulas = [];
  sub.formulas.push(formula.trim());
  saveTopic(topic);
  return true;
}

function deleteSubtopicFormula(topicId, subtopicId, formulaIdx) {
  const topic = getTopic(topicId);
  if (!topic) return false;

  const sub = (topic.subtopics || []).find(s => s.id === subtopicId);
  if (!sub || !sub.formulas) return false;

  sub.formulas.splice(formulaIdx, 1);
  saveTopic(topic);
  return true;
}

// ---------- SUBTOPIC QUESTIONS (Phase 4) ----------
function updateSubtopicQuestions(topicId, subtopicId, attempted, correct) {
  const topic = getTopic(topicId);
  if (!topic) return false;

  const sub = (topic.subtopics || []).find(s => s.id === subtopicId);
  if (!sub) return false;

  sub.questions = { attempted, correct };
  saveTopic(topic);
  return true;
}

function updateTopicQuestionsFromSubtopics(topicId) {
  const topic = getTopic(topicId);
  if (!topic) return false;

  const subtopics = topic.subtopics || [];
  if (subtopics.length === 0) return false;

  let totalAttempted = 0;
  let totalCorrect = 0;

  subtopics.forEach(s => {
    totalAttempted += s.questions?.attempted || 0;
    totalCorrect += s.questions?.correct || 0;
  });

  topic.questions = { attempted: totalAttempted, correct: totalCorrect };
  saveTopic(topic);
  return true;
}

// ---------- PHASE 5: MISTAKES + TEMPLATES ----------

// Get mistakes for specific subtopic
function getSubtopicMistakes(topicId, subtopicId) {
  const mistakes = getMistakes();
  return mistakes.filter(m => 
    m.topicId === topicId && m.subtopicId === subtopicId
  );
}

// Count mistakes per subtopic (for badge)
function getSubtopicMistakeCount(topicId, subtopicId) {
  return getSubtopicMistakes(topicId, subtopicId).length;
}

// Apply template to a topic
function applyTemplateToTopic(topicId, template) {
  const topic = getTopic(topicId);
  if (!topic) return 0;

  if (!topic.subtopics) topic.subtopics = [];

  let added = 0;
  const existingNames = topic.subtopics.map(s => s.name.toLowerCase());

  template.subtopics.forEach(name => {
    // Skip duplicates
    if (existingNames.includes(name.toLowerCase())) return;

    topic.subtopics.push({
      id: generateId('sub'),
      name: name,
      notes: [],
      formulas: [],
      questions: { attempted: 0, correct: 0 },
      createdAt: todayStr()
    });
    added++;
  });

  saveTopic(topic);
  return added;
}

// Detect weak subtopics across all topics
function getWeakSubtopics(threshold = 60) {
  const topics = getTopics();
  const weak = [];

  topics.forEach(topic => {
    (topic.subtopics || []).forEach(sub => {
      const q = sub.questions || { attempted: 0, correct: 0 };
      if (q.attempted >= 5) {
        const acc = Math.round((q.correct / q.attempted) * 100);
        if (acc < threshold) {
          weak.push({
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

  return weak.sort((a, b) => a.accuracy - b.accuracy);
}

// ---------- TASK PROGRESS (Phase A) ----------
function addTimeToTask(taskId, minutes) {
  const plan = getTodayPlanData();
  const task = (plan.tasks || []).find(t => t.id === taskId);
  if (!task) return false;

  task.doneMinutes = (task.doneMinutes || 0) + minutes;

  // Auto-mark done if target reached
  if (task.duration > 0 && task.doneMinutes >= task.duration) {
    task.done = true;
  }

  return saveTodayPlanData(plan);
}

function getTaskById(taskId) {
  const plan = getTodayPlanData();
  return (plan.tasks || []).find(t => t.id === taskId) || null;
}

function getTaskProgress(taskId) {
  const task = getTaskById(taskId);
  if (!task) return null;

  const done = task.doneMinutes || 0;
  const target = task.duration || 0;
  const remaining = Math.max(0, target - done);
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

  return {
    task,
    doneMinutes: done,
    targetMinutes: target,
    remainingMinutes: remaining,
    pct,
    isComplete: target > 0 && done >= target,
    isOverrun: target > 0 && done > target
  };
}

// ---------- SESSION HISTORY (Phase B) ----------
function getRecentSessions(limit = 5) {
  const sessions = getSessions();
  // Sort by startTime descending (latest first)
  return sessions
    .slice()
    .sort((a, b) => {
      const aTime = a.startTime || '';
      const bTime = b.startTime || '';
      return bTime.localeCompare(aTime);
    })
    .slice(0, limit);
}

function getSessionsByTaskType(type) {
  return getSessions().filter(s => s.taskType === type);
}

// Session ko task type ke saath save karo
function saveSessionWithTask(session, taskId, taskType) {
  session.taskId = taskId || null;
  session.taskType = taskType || 'study';
  return saveSession(session);
}

// ---------- ANALYTICS (Phase C) ----------
function getTimeByTaskType(days = 7) {
  const cutoff = addDays(todayStr(), -days);
  const sessions = getSessions().filter(s => {
    const d = s.startTime?.split('T')[0];
    return d && d >= cutoff;
  });

  const result = {
    study: 0,
    revision: 0,
    practice: 0,
    custom: 0
  };

  sessions.forEach(s => {
    const type = s.taskType || 'study';
    if (result[type] !== undefined) {
      result[type] += s.totalStudy || 0;
    } else {
      result.custom += s.totalStudy || 0;
    }
  });

  return result;
}

function getTopTasksByTime(days = 7, limit = 5) {
  const cutoff = addDays(todayStr(), -days);
  const sessions = getSessions().filter(s => {
    const d = s.startTime?.split('T')[0];
    return d && d >= cutoff;
  });

  const byTopic = {};

  sessions.forEach(s => {
    const key = s.topic || s.subject || 'Other';
    if (!byTopic[key]) byTopic[key] = 0;
    byTopic[key] += s.totalStudy || 0;
  });

  // Convert to array, sort, slice
  return Object.keys(byTopic)
    .map(name => ({ name, minutes: byTopic[name] }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit);
}