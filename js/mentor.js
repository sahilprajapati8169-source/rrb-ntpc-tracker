/* ============================
   MENTOR.JS — AI Study Mentor
   ============================ */

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('planList')) return;
  renderAll();
  document.getElementById('refreshPlanBtn')?.addEventListener('click', () => {
    renderAll();
    showToast('Plan refreshed 🔄', 'info');
  });
});

function renderAll() {
  renderPlan();
  renderInsights();
  renderWeakTopics();
  renderStrongTopics();
  updateSubtitle();
}

// ---------- SUBTITLE ----------
function updateSubtitle() {
  const hour = new Date().getHours();
  let part = 'Aaj';
  if (hour < 12) part = 'Subah ka';
  else if (hour < 17) part = 'Dopahar ka';
  else part = 'Shaam ka';

  setText('mentorSubtitle', `${part} plan — AI ne tumhare data se banaya`);
}

// ---------- RENDER PLAN ----------
function renderPlan() {
  const plan = generateTodayPlan();
  const container = document.getElementById('planList');
  if (!container) return;

  setText('planCount', `${plan.length} topics suggested`);

  if (plan.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <h3>Sab kaam ho gaya!</h3>
        <p>Aaj kuch pending nahi. Rest karo ya naya topic start karo.</p>
        <a href="syllabus.html" class="btn btn-primary mt-4">📚 Explore Syllabus</a>
      </div>
    `;
    return;
  }

  container.innerHTML = plan.map((item, idx) => {
    const t = item.topic;
    const priorityLabel = {
      high: '🔴 High',
      medium: '🟡 Medium',
      normal: '🟢 Normal'
    }[item.priority];

    const meta = [];
    if (t.studyTime) meta.push(`⏱ ${formatTime(t.studyTime)}`);
    if (t.questions?.attempted > 0) {
      const acc = percent(t.questions.correct, t.questions.attempted);
      meta.push(`📝 ${acc}% accuracy`);
    }
    if (t.confidence) meta.push(`⭐ ${t.confidence}/5`);

    return `
      <div class="mentor-plan-card priority-${item.priority}">
        <div class="mentor-plan-num">${idx + 1}</div>
        <div class="mentor-plan-content">
          <div class="mentor-plan-title">${t.name}</div>
          <div class="mentor-plan-subject">${t.subject} • ${priorityLabel}</div>
          <div class="mentor-plan-reason">${item.reason}</div>
          <div class="mentor-plan-meta">
            ${meta.map(m => `<span>${m}</span>`).join('')}
          </div>
        </div>
        <div class="mentor-plan-actions">
          <a href="topic.html?id=${t.id}" class="btn btn-primary btn-sm">View Topic</a>
          <a href="timer.html?id=${t.id}" class="btn btn-secondary btn-sm">⏱ Study</a>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- GENERATE PLAN (SCORING) ----------
function generateTodayPlan() {
  const topics = getTopics();
  const today = todayStr();
  const scored = [];

  topics.forEach(topic => {
    let score = 0;
    let reason = '';
    let priority = 'normal';

    // 1. Overdue revision (highest)
    const overdueRevs = (topic.revisions || []).filter(r => !r.done && r.dueDate < today);
    if (overdueRevs.length > 0) {
      const oldest = overdueRevs[0];
      const days = daysBetween(oldest.dueDate, today);
      score += 60;
      reason = `Revision ${oldest.num} overdue by ${days} day${days > 1 ? 's' : ''}`;
      priority = 'high';
    }
    // 2. Due today
    else {
      const dueToday = (topic.revisions || []).filter(r => !r.done && r.dueDate === today);
      if (dueToday.length > 0) {
        score += 40;
        reason = `Revision ${dueToday[0].num} due today`;
        priority = 'medium';
      }
    }

    // 3. Weak accuracy
    if (topic.questions?.attempted >= 10) {
      const acc = percent(topic.questions.correct, topic.questions.attempted);
      if (acc < 65) {
        score += 35;
        if (!reason) reason = `Low accuracy (${acc}%)`;
        priority = 'high';
      } else if (acc < 75) {
        score += 15;
        if (!reason) reason = `Improve accuracy (${acc}%)`;
        if (priority !== 'high') priority = 'medium';
      }
    }

    // 4. Low confidence
    if (topic.confidence > 0 && topic.confidence <= 2) {
      score += 25;
      if (!reason) reason = `Low confidence (${topic.confidence}/5)`;
      if (priority === 'normal') priority = 'medium';
    }

    // 5. Not started (lowest priority but still useful)
    if (topic.status === 'not_started') {
      score += 8;
      if (!reason) reason = 'Not started yet — shuru karo';
    }

    // 6. In progress but no study in 5+ days
    if (topic.status === 'in_progress' && topic.lastStudied) {
      const days = daysSince(topic.lastStudied);
      if (days >= 5) {
        score += 20;
        if (!reason) reason = `${days} din se touch nahi kiya`;
        if (priority === 'normal') priority = 'medium';
      }
    }

    // Only include if scored
    if (score > 0) {
      scored.push({ topic, score, reason, priority });
    }
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Return top 5
  return scored.slice(0, 5);
}

// ---------- INSIGHTS ----------
function renderInsights() {
  const container = document.getElementById('insightsContainer');
  if (!container) return;

  const insights = [];

  const topics = getTopics();
  const sessions = getTodaySessions();
  const streak = getStreak();

  // 1. Study time insight
  const todayMin = getTotalStudyMinutes(sessions);
  const goal = getSettings().dailyGoal * 60;
  if (todayMin < goal) {
    insights.push({
      icon: '⏱️',
      text: `Aaj tak ${formatTime(todayMin)} padha. Goal hai ${formatTime(goal)}. Thoda aur!`
    });
  } else {
    insights.push({
      icon: '🎉',
      text: `Aaj ka goal complete! ${formatTime(todayMin)} padha. Shabaash!`
    });
  }

  // 2. Weak subject
  const subjectStats = {};
  topics.forEach(t => {
    if (!subjectStats[t.subject]) subjectStats[t.subject] = { completed: 0, total: 0 };
    subjectStats[t.subject].total++;
    if (t.status === 'completed') subjectStats[t.subject].completed++;
  });

  let weakest = null;
  let lowestPct = 100;
  Object.keys(subjectStats).forEach(sub => {
    const s = subjectStats[sub];
    const pct = percent(s.completed, s.total);
    if (pct < lowestPct) {
      lowestPct = pct;
      weakest = sub;
    }
  });

  if (weakest && lowestPct < 50) {
    insights.push({
      icon: '⚠️',
      text: `${weakest} sirf ${lowestPct}% complete hai. Isko priority do.`
    });
  }

  // 3. Streak insight
  if (streak.current >= 7) {
    insights.push({
      icon: '🔥',
      text: `${streak.current} din ka streak chal raha hai. Tode mat dena!`
    });
  } else if (streak.current > 0) {
    insights.push({
      icon: '🔥',
      text: `${streak.current} din ka streak. Consistency maintain karo.`
    });
  } else {
    insights.push({
      icon: '💪',
      text: 'Aaj se streak start karo — roz padhne ki aadat banao.'
    });
  }

  // 4. Revision insight
  const dueRevs = getAllDueRevisions();
  if (dueRevs.length > 0) {
    insights.push({
      icon: '🔁',
      text: `${dueRevs.length} revisions pending hain. Revision page check karo.`
    });
  }

  container.innerHTML = insights.map(i => `
    <div class="insight-box">
      <div class="insight-box-title">${i.icon} Insight</div>
      <p>${i.text}</p>
    </div>
  `).join('');
}

// ---------- WEAK TOPICS ----------
function renderWeakTopics() {
  const container = document.getElementById('weakGrid');
  if (!container) return;

  const weak = getWeakTopics();

  if (weak.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">💪</div>
        <p>Abhi koi weak topic nahi</p>
      </div>
    `;
    return;
  }

  container.innerHTML = weak.slice(0, 6).map(t => `
    <a href="topic.html?id=${t.id}" class="weak-item" style="text-decoration: none; color: inherit; display: block;">
      <div class="weak-item-name">${t.name}</div>
      <div class="weak-item-reason">${t.reason}</div>
    </a>
  `).join('');
}

function getWeakTopics() {
  const topics = getTopics();
  const weak = [];

  topics.forEach(t => {
    let reason = null;

    // Low confidence
    if (t.confidence > 0 && t.confidence <= 2) {
      reason = `Confidence ${t.confidence}/5`;
    }

    // Low accuracy
    if (t.questions?.attempted >= 15) {
      const acc = percent(t.questions.correct, t.questions.attempted);
      if (acc < 65) {
        reason = `Accuracy ${acc}%`;
      }
    }

    if (reason) {
      weak.push({ id: t.id, name: t.name, reason });
    }
  });

  return weak;
}

// ---------- STRONG TOPICS ----------
function renderStrongTopics() {
  const container = document.getElementById('strongGrid');
  if (!container) return;

  const topics = getTopics();
  const strong = topics.filter(t => {
    return t.status === 'completed'
      && t.confidence >= 4
      && (!t.questions || t.questions.attempted === 0 || percent(t.questions.correct, t.questions.attempted) >= 75);
  });

  if (strong.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📚</div>
        <p>Abhi koi strong topic nahi — practice karo</p>
      </div>
    `;
    return;
  }

  container.innerHTML = strong.slice(0, 6).map(t => `
    <a href="topic.html?id=${t.id}" class="strong-item" style="text-decoration: none; color: inherit; display: block;">
      <div class="weak-item-name">${t.name}</div>
      <div class="weak-item-reason" style="color: #065F46;">
        ⭐ ${t.confidence}/5
        ${t.questions?.attempted ? ' • ' + percent(t.questions.correct, t.questions.attempted) + '% acc' : ''}
      </div>
    </a>
  `).join('');
}

// ---------- HELPER: DUE REVISIONS ----------
function getAllDueRevisions() {
  const topics = getTopics();
  const today = todayStr();
  const due = [];

  topics.forEach(topic => {
    (topic.revisions || []).forEach(rev => {
      if (!rev.done && rev.dueDate <= today) {
        due.push({ topicId: topic.id, num: rev.num, dueDate: rev.dueDate });
      }
    });
  });

  return due;
}

// ---------- HELPER ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}