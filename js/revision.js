/* ============================
   REVISION.JS — Revision Center
   ============================ */

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('listOverdue')) return;
  render();
  attachEvents();
});

// ---------- RENDER ----------
function render() {
  const allRevs = getAllRevisions();
  const today = todayStr();

  const overdue = allRevs.filter(r => r.dueDate < today);
  const todayList = allRevs.filter(r => r.dueDate === today);
  const upcoming = allRevs.filter(r => r.dueDate > today);
  const done = getAllRevisionsDone();

  // Stats
  setText('statOverdue', overdue.length);
  setText('statToday', todayList.length);
  setText('statUpcoming', upcoming.length);
  setText('statDone', done.length);

  // Counts
  setText('countOverdue', overdue.length);
  setText('countToday', todayList.length);
  setText('countUpcoming', upcoming.length);

  // Lists
  renderList('listOverdue', overdue, 'overdue');
  renderList('listToday', todayList, 'today');
  renderList('listUpcoming', upcoming.slice(0, 20), 'upcoming');
}

// ---------- GET ALL REVISIONS (flat) ----------
function getAllRevisions() {
  const topics = getTopics();
  const today = todayStr();
  const flat = [];

  topics.forEach(topic => {
    (topic.revisions || []).forEach(rev => {
      if (!rev.done) {
        flat.push({
          topicId: topic.id,
          topicName: topic.name,
          subject: topic.subject,
          num: rev.num,
          dueDate: rev.dueDate
        });
      }
    });
  });

  return flat.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function getAllRevisionsDone() {
  const topics = getTopics();
  const done = [];
  topics.forEach(topic => {
    (topic.revisions || []).forEach(rev => {
      if (rev.done) done.push(rev);
    });
  });
  return done;
}

// ---------- RENDER LIST ----------
function renderList(elementId, list, type) {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="revision-empty-mini">
        ${type === 'overdue' ? '✅ Sab clear!' : type === 'today' ? '😎 Aaj kuch nahi' : '📅 Kuch nahi'}
      </div>
    `;
    return;
  }

  const today = todayStr();

  container.innerHTML = list.map(r => {
    let metaText = '';
    if (type === 'overdue') {
      const days = daysBetween(r.dueDate, today);
      metaText = `⚠️ ${days}d late`;
    } else if (type === 'today') {
      metaText = '🔴 Due today';
    } else {
      const days = daysBetween(today, r.dueDate);
      metaText = `In ${days}d`;
    }

    return `
      <div class="revision-card ${type}">
        <div class="revision-card-top">
          <div>
            <div class="revision-card-name">${r.topicName}</div>
            <div class="revision-card-subject">${r.subject}</div>
          </div>
          <span class="badge badge-info">R${r.num}</span>
        </div>
        <div class="revision-card-meta">
          <span>📅 ${formatDate(r.dueDate)}</span>
          <span>•</span>
          <span>${metaText}</span>
        </div>
        <div class="revision-card-actions">
          <button class="btn btn-success btn-sm" data-mark-done data-topic="${r.topicId}" data-rev="${r.num}">
            ✅ Done
          </button>
          <a href="topic.html?id=${r.topicId}" class="btn btn-ghost btn-sm">View →</a>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- EVENTS ----------
function attachEvents() {
  const main = document.getElementById('main');
  if (!main) return;

  main.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mark-done]');
    if (!btn) return;

    const topicId = btn.dataset.topic;
    const revNum = parseInt(btn.dataset.rev);

    const topic = getTopic(topicId);
    if (!topic) return;

    const rev = (topic.revisions || []).find(r => r.num === revNum);
    if (!rev) return;

    rev.done = true;
    rev.doneDate = todayStr();
    saveTopic(topic);

    showToast(`R${revNum} done! ✅`, 'success');
    render();
  });
}

// ---------- HELPER ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}