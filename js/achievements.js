/* ============================
   ACHIEVEMENTS.JS — Badges + XP
   ============================ */

// ---------- BADGE DEFINITIONS ----------
const BADGES = [
  {
    id: 'first_step',
    icon: '🌱',
    name: 'First Step',
    desc: 'Pehla topic start karo',
    check: (ctx) => ctx.topicsStarted >= 1,
    progress: (ctx) => ({ current: Math.min(ctx.topicsStarted, 1), max: 1 })
  },
  {
    id: 'streak_starter',
    icon: '🔥',
    name: 'Streak Starter',
    desc: '3 din ka streak',
    check: (ctx) => ctx.streak >= 3,
    progress: (ctx) => ({ current: Math.min(ctx.streak, 3), max: 3 })
  },
  {
    id: 'week_warrior',
    icon: '💪',
    name: 'Week Warrior',
    desc: '7 din ka streak',
    check: (ctx) => ctx.streak >= 7,
    progress: (ctx) => ({ current: Math.min(ctx.streak, 7), max: 7 })
  },
  {
    id: 'month_master',
    icon: '🏅',
    name: 'Month Master',
    desc: '30 din ka streak',
    check: (ctx) => ctx.streak >= 30,
    progress: (ctx) => ({ current: Math.min(ctx.streak, 30), max: 30 })
  },
  {
    id: 'century',
    icon: '📚',
    name: 'Century',
    desc: '10 topics complete karo',
    check: (ctx) => ctx.completedTopics >= 10,
    progress: (ctx) => ({ current: Math.min(ctx.completedTopics, 10), max: 10 })
  },
  {
    id: 'halfway_hero',
    icon: '⚡',
    name: 'Halfway Hero',
    desc: '50% syllabus complete',
    check: (ctx) => ctx.syllabusPct >= 50,
    progress: (ctx) => ({ current: Math.min(ctx.syllabusPct, 50), max: 50 })
  },
  {
    id: 'syllabus_slayer',
    icon: '🎯',
    name: 'Syllabus Slayer',
    desc: '100% syllabus complete',
    check: (ctx) => ctx.syllabusPct >= 100,
    progress: (ctx) => ({ current: Math.min(ctx.syllabusPct, 100), max: 100 })
  },
  {
    id: 'question_king',
    icon: '🧠',
    name: 'Question King',
    desc: '500 questions attempt karo',
    check: (ctx) => ctx.totalQuestions >= 500,
    progress: (ctx) => ({ current: Math.min(ctx.totalQuestions, 500), max: 500 })
  },
  {
    id: 'accuracy_ace',
    icon: '💯',
    name: 'Accuracy Ace',
    desc: '90%+ accuracy (100+ Qs)',
    check: (ctx) => ctx.totalQuestions >= 100 && ctx.accuracy >= 90,
    progress: (ctx) => ({ current: Math.min(ctx.accuracy, 90), max: 90 })
  },
  {
    id: 'mock_warrior',
    icon: '📝',
    name: 'Mock Warrior',
    desc: '5 mock tests do',
    check: (ctx) => ctx.mockCount >= 5,
    progress: (ctx) => ({ current: Math.min(ctx.mockCount, 5), max: 5 })
  },
  {
    id: 'mock_champion',
    icon: '🏆',
    name: 'Mock Champion',
    desc: 'Score 80+ in any mock',
    check: (ctx) => ctx.bestMockScore >= 80,
    progress: (ctx) => ({ current: Math.min(ctx.bestMockScore, 80), max: 80 })
  },
  {
    id: 'revision_master',
    icon: '🔁',
    name: 'Revision Master',
    desc: '50 revisions complete',
    check: (ctx) => ctx.revisionsDone >= 50,
    progress: (ctx) => ({ current: Math.min(ctx.revisionsDone, 50), max: 50 })
  }
];

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('badgesGrid')) return;

  const ctx = computeContext();
  checkAndUnlockBadges(ctx);
  renderAll(ctx);
});

// ---------- COMPUTE CONTEXT ----------
function computeContext() {
  const topics = getTopics();
  const streak = getStreak();
  const mocks = getMocks();
  const sessions = getSessions();

  // Topics
  const topicsStarted = topics.filter(t => t.status !== 'not_started').length;
  const completedTopics = topics.filter(t => t.status === 'completed').length;
  const syllabusPct = topics.length > 0 ? percent(completedTopics, topics.length) : 0;

  // Questions
  const totalQuestions = topics.reduce((a, t) => a + (t.questions?.attempted || 0), 0);
  const totalCorrect = topics.reduce((a, t) => a + (t.questions?.correct || 0), 0);
  const accuracy = totalQuestions > 0 ? percent(totalCorrect, totalQuestions) : 0;

  // Mocks
  const mockCount = mocks.length;
  const bestMockScore = mockCount > 0 ? Math.max(...mocks.map(m => m.score || 0)) : 0;

  // Revisions
  let revisionsDone = 0;
  topics.forEach(t => {
    (t.revisions || []).forEach(r => {
      if (r.done) revisionsDone++;
    });
  });

  // Study hours
  const totalStudyMinutes = sessions.reduce((a, s) => a + (s.totalStudy || 0), 0);

  return {
    topicsStarted,
    completedTopics,
    syllabusPct,
    totalQuestions,
    accuracy,
    mockCount,
    bestMockScore,
    revisionsDone,
    streak: streak.current || 0,
    totalStudyMinutes
  };
}

// ---------- CHECK & UNLOCK ----------
function checkAndUnlockBadges(ctx) {
  let newlyUnlocked = [];

  BADGES.forEach(badge => {
    if (!isAchievementUnlocked(badge.id)) {
      if (badge.check(ctx)) {
        unlockAchievement(badge.id);
        newlyUnlocked.push(badge);
      }
    }
  });

  // Show toasts for newly unlocked (max 3, warna spam)
  newlyUnlocked.slice(0, 3).forEach((badge, i) => {
    setTimeout(() => {
      showToast(`${badge.icon} Badge unlocked: ${badge.name}!`, 'success');
    }, i * 800);
  });
}

// ---------- CALCULATE XP ----------
function calculateXP(ctx) {
  let xp = 0;

  // 1 hour study = 50 XP
  xp += Math.floor(ctx.totalStudyMinutes / 60) * 50;

  // Revision done = 20 XP
  xp += ctx.revisionsDone * 20;

  // Mock test = 100 XP
  xp += ctx.mockCount * 100;

  // Topic complete = 30 XP
  xp += ctx.completedTopics * 30;

  // Mistake added = 5 XP (learning)
  xp += getMistakes().length * 5;

  // Bonus from unlocks
  const data = getAchievementsData();
  xp += data.bonusXP || 0;

  return xp;
}

// ---------- LEVEL ----------
function getLevelInfo(xp) {
  const XP_PER_LEVEL = 500;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const progress = (xpInLevel / XP_PER_LEVEL) * 100;

  const titles = {
    1: 'Beginner',
    2: 'Learner',
    3: 'Focused',
    4: 'Disciplined',
    5: 'Consistent',
    6: 'Hard Worker',
    7: 'Achiever',
    8: 'Expert',
    9: 'Master',
    10: 'Legend'
  };

  const title = titles[level] || (level > 10 ? 'Grandmaster' : 'Beginner');

  return { level, xpInLevel, xpPerLevel: XP_PER_LEVEL, progress, title };
}

// ---------- RENDER ----------
function renderAll(ctx) {
  const data = getAchievementsData();
  const unlockedCount = data.unlocked.length;
  const totalBadges = BADGES.length;

  const xp = calculateXP(ctx);
  const levelInfo = getLevelInfo(xp);

  // Level header
  setText('levelNum', levelInfo.level);
  setText('levelTitle', levelInfo.title);
  setText('levelSubtext', `Aur ${levelInfo.xpPerLevel - levelInfo.xpInLevel} XP chahiye next level ke liye!`);
  setText('xpText', `${levelInfo.xpInLevel} / ${levelInfo.xpPerLevel} XP`);
  setWidth('xpBar', levelInfo.progress);

  // Stats
  setText('statUnlocked', unlockedCount);
  setText('statLocked', totalBadges - unlockedCount);
  setText('statXP', xp);
  setText('statProgress', Math.round((unlockedCount / totalBadges) * 100) + '%');

  // Badges grid
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  grid.innerHTML = BADGES.map(badge => {
    const isUnlocked = data.unlocked.includes(badge.id);
    const { current, max } = badge.progress(ctx);
    const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;

    return `
      <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
        <div class="badge-progress">
          <div class="badge-progress-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="badge-progress-text">
          ${isUnlocked ? '✅ Unlocked' : `${current} / ${max}`}
        </div>
      </div>
    `;
  }).join('');
}

// ---------- HELPERS ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(Math.max(pct, 0), 100) + '%';
}