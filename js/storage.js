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