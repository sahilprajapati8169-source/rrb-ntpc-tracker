/* ============================
   REVISION.JS — Revision Center (Phase 2)
   ============================ */

let currentFilter = 'all';
let currentSort = 'priority';
let currentSearch = '';

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('revisionCardsContainer')) return;
  renderAll();
  attachEvents();
});

// ---------- RENDER ALL ----------
function renderAll() {
  renderStats();
  renderSubjectSummary();    // ← NAYA
  renderStreak();            // ← NAYA
  renderCards();
}

// ---------- RENDER STATS ----------
function renderStats() {
  const stats = getRevisionStats();
  const cards = document.querySelectorAll('.revision-stat-card');
  
  if (cards.length >= 6) {
    cards[0].querySelector('.revision-stat-value').textContent = stats.total;
    cards[1].querySelector('.revision-stat-value').textContent = stats.dueToday;
    cards[2].querySelector('.revision-stat-value').textContent = stats.overdue;
    cards[3].querySelector('.revision-stat-value').textContent = stats.confident;
    cards[4].querySelector('.revision-stat-value').textContent = stats.doubtful;
    cards[5].querySelector('.revision-stat-value').textContent = stats.confused;
  }
}

// ---------- FILTER LOGIC ----------
function matchesFilter(item) {
  // Search check
  if (currentSearch) {
    const s = currentSearch.toLowerCase();
    const match = item.topicName.toLowerCase().includes(s) ||
                  item.subtopicName.toLowerCase().includes(s) ||
                  item.subject.toLowerCase().includes(s);
    if (!match) return false;
  }

  // Filter check
  switch (currentFilter) {
    case 'all':
      return item.hasRevision || !item.hasRevision; // all
    case 'overdue':
      return item.isOverdue;
    case 'today':
      return item.isDueToday;
    case 'upcoming':
      return item.isUpcoming && !item.isDueToday;
    case 'mastered':
      return item.isMastered;
    case 'confused':
      return item.revision.status === 'confused';
    case 'not-revised':
      return !item.hasRevision;
    default:
      return true;
  }
}

// ---------- SORT LOGIC ----------
function sortItems(items) {
  const sorted = [...items];
  
  switch (currentSort) {
    case 'priority':
      sorted.sort((a, b) => getRevisionPriorityScore(b) - getRevisionPriorityScore(a));
      break;
    case 'lastDate':
      sorted.sort((a, b) => {
        if (!a.revision.lastDate) return -1;
        if (!b.revision.lastDate) return 1;
        return a.revision.lastDate.localeCompare(b.revision.lastDate);
      });
      break;
    case 'count':
      sorted.sort((a, b) => (a.revision.count || 0) - (b.revision.count || 0));
      break;
    case 'name':
      sorted.sort((a, b) => a.topicName.localeCompare(b.topicName));
      break;
  }
  
  return sorted;
}

// ---------- RENDER CARDS ----------
function renderCards() {
  const container = document.getElementById('revisionCardsContainer');
  if (!container) return;

  let items = getAllSubtopicsWithRevision();
  items = items.filter(matchesFilter);
  items = sortItems(items);

  if (items.length === 0) {
    container.innerHTML = `
      <div class="syllabus-empty">
        <div class="syllabus-empty-icon">🎉</div>
        <h3 class="mb-2">Kuch nahi mila</h3>
        <p>Filter change karo ya search clear karo</p>
      </div>
    `;
    return;
  }

  // Group by priority
  const overdue = items.filter(i => i.isOverdue);
  const today = items.filter(i => i.isDueToday);
  const upcoming = items.filter(i => i.isUpcoming && !i.isDueToday && !i.isOverdue);
  const others = items.filter(i => !i.isOverdue && !i.isDueToday && !i.isUpcoming);

  let html = '';

  if (overdue.length > 0) {
    html += `
      <div class="revision-group">
        <div class="revision-group-header overdue">
          <span class="revision-group-icon">🔴</span>
          <span class="revision-group-title">Overdue</span>
          <span class="revision-group-count">${overdue.length}</span>
        </div>
        ${overdue.map(i => renderRevisionCard(i)).join('')}
      </div>
    `;
  }

  if (today.length > 0) {
    html += `
      <div class="revision-group">
        <div class="revision-group-header today">
          <span class="revision-group-icon">🟡</span>
          <span class="revision-group-title">Due Today</span>
          <span class="revision-group-count">${today.length}</span>
        </div>
        ${today.map(i => renderRevisionCard(i)).join('')}
      </div>
    `;
  }

  if (upcoming.length > 0) {
    html += `
      <div class="revision-group">
        <div class="revision-group-header upcoming">
          <span class="revision-group-icon">🟢</span>
          <span class="revision-group-title">Upcoming</span>
          <span class="revision-group-count">${upcoming.length}</span>
        </div>
        ${upcoming.slice(0, 10).map(i => renderRevisionCard(i)).join('')}
        ${upcoming.length > 10 ? `<p class="text-xs text-muted text-center mt-3">+${upcoming.length - 10} more</p>` : ''}
      </div>
    `;
  }

  if (others.length > 0) {
    html += `
      <div class="revision-group">
        <div class="revision-group-header others">
          <span class="revision-group-icon">📋</span>
          <span class="revision-group-title">Others</span>
          <span class="revision-group-count">${others.length}</span>
        </div>
        ${others.slice(0, 10).map(i => renderRevisionCard(i)).join('')}
        ${others.length > 10 ? `<p class="text-xs text-muted text-center mt-3">+${others.length - 10} more</p>` : ''}
      </div>
    `;
  }

  container.innerHTML = html;
}

// ---------- RENDER SINGLE CARD ----------
// ---------- RENDER SINGLE CARD (Phase 3 Updated) ----------
function renderRevisionCard(item) {
  const rev = item.revision;
  const statusClass = rev.status || 'none';

  let lastText = 'Never revised';
  if (rev.lastDate) {
    const days = item.daysSinceLast;
    if (days === 0) lastText = 'Aaj revise kiya';
    else if (days === 1) lastText = 'Kal revise kiya';
    else lastText = `${days} din pehle`;
  }

  let nextText = '';
  if (rev.nextDate) {
    if (item.isOverdue) {
      const days = daysBetween(rev.nextDate, todayStr());
      nextText = `🔴 ${days} din overdue`;
    } else if (item.isDueToday) {
      nextText = '🟡 Aaj due';
    } else {
      const days = daysBetween(todayStr(), rev.nextDate);
      nextText = `🟢 ${days} din mein`;
    }
  } else if (!item.hasRevision) {
    nextText = '⚪ Kabhi revise nahi kiya';
  }

  return `
    <div class="revision-item-card ${statusClass}" data-revision-item="${item.topicId}::${item.subtopicId}">
      
      <!-- Header -->
      <div class="revision-item-header">
        <div class="revision-item-title">
          <input type="checkbox" class="revision-checkbox" data-select-checkbox="${item.topicId}::${item.subtopicId}" />
          <span class="revision-item-subject">${escapeHtml(item.subject)}</span>
          <span class="revision-item-topic">${escapeHtml(item.topicName)}</span>
          <span class="revision-item-sep">→</span>
          <span class="revision-item-subtopic">${escapeHtml(item.subtopicName)}</span>
        </div>
        ${rev.count > 0 ? `<span class="badge badge-neutral">🔁 ${rev.count}x</span>` : ''}
      </div>

      <!-- Meta -->
      <div class="revision-item-meta">
        <span class="revision-meta-item">📅 ${lastText}</span>
        ${nextText ? `<span class="revision-meta-item">${nextText}</span>` : ''}
        ${rev.count > 0 ? `<button type="button" class="revision-history-btn" data-view-history title="View History">📊 History</button>` : ''}
      </div>

      <!-- Status Chips -->
      <div class="revision-status-row" data-revision-statuses>
        <button type="button" class="revision-status-chip confident ${rev.status === 'confident' ? 'active' : ''}" data-set-status="confident" title="Confident">
          🟢
        </button>
        <button type="button" class="revision-status-chip doubtful ${rev.status === 'doubtful' ? 'active' : ''}" data-set-status="doubtful" title="Doubtful">
          🟡
        </button>
        <button type="button" class="revision-status-chip confused ${rev.status === 'confused' ? 'active' : ''}" data-set-status="confused" title="Confused">
          🔴
        </button>
      </div>

      <!-- Actions -->
      <div class="revision-item-actions">
        <button type="button" class="btn btn-success btn-sm" data-revise-now-item>
          ✅ Revise Now
        </button>
        <a href="topic.html?id=${item.topicId}" class="btn btn-ghost btn-sm">
          📖 View Topic
        </a>
      </div>

    </div>
  `;
}

// ---------- ATTACH EVENTS ----------
function attachEvents() {
  // Filter pills
  document.getElementById('revisionFilters')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    document.querySelectorAll('#revisionFilters .filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter;
    renderCards();
  });

  // Stats cards clickable
  document.getElementById('statsBar')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-stat-filter]');
    if (!card) return;

    const filter = card.dataset.statFilter;
    // Map "all" → "all", others → same
    document.querySelectorAll('#revisionFilters .filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.filter === filter);
    });
    currentFilter = filter;
    renderCards();
  });

  // Sort
  document.getElementById('revisionSortSelect')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderCards();
  });

  // Search
  document.getElementById('revisionSearch')?.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    renderCards();
  });

  // Cards container — event delegation
  const container = document.getElementById('revisionCardsContainer');
  if (container) {
    container.addEventListener('click', async (e) => {
      const card = e.target.closest('[data-revision-item]');
      if (!card) return;

      const [topicId, subtopicId] = card.dataset.revisionItem.split('::');

      // Change status
      const statusBtn = e.target.closest('[data-set-status]');
      if (statusBtn) {
        e.preventDefault();
        e.stopPropagation();
        const status = statusBtn.dataset.setStatus;
        updateSubtopicRevisionStatus(topicId, subtopicId, status);
        renderAll();
        showToast(`Status: ${status}`, 'success');
        return;
      }

      // Revise Now
            // Revise Now
      if (e.target.closest('[data-revise-now-item]')) {
        e.preventDefault();
        e.stopPropagation();
        const newRev = markSubtopicRevised(topicId, subtopicId);
        renderAll();
        if (newRev) {
          showToast(`✅ Revised! Total: ${newRev.count}`, 'success');
        }
        return;
      }

      // ⚡ NAYA: View History
      if (e.target.closest('[data-view-history]')) {
        e.preventDefault();
        e.stopPropagation();
        showHistoryModal(topicId, subtopicId);
        return;
      }
    });
  }

  // ⚡ NAYA: Initialize bulk actions
  initBulkActions();
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

// ---------- SUBJECT SUMMARY (Phase 3) ----------
function renderSubjectSummary() {
  const container = document.getElementById('subjectSummaryList');
  if (!container) return;

  const subjects = getRevisionBySubject();
  const keys = Object.keys(subjects);

  if (keys.length === 0) {
    container.innerHTML = `
      <p class="text-xs text-muted text-center" style="padding: 16px;">
        Abhi koi data nahi
      </p>
    `;
    return;
  }

  container.innerHTML = keys.map(key => {
    const s = subjects[key];
    const confEmoji = {
      'confident': '🟢',
      'doubtful': '🟡',
      'confused': '🔴',
      'none': '⚪'
    }[s.avgConfidence];

    return `
      <div class="subject-summary-item">
        <div class="subject-summary-header">
          <div class="subject-summary-name">
            ${s.icon} ${escapeHtml(s.name)}
          </div>
          <div class="subject-summary-pct">${s.completionPct}%</div>
        </div>
        <div class="progress progress-sm">
          <div class="progress-bar ${s.completionPct >= 75 ? 'success' : s.completionPct >= 40 ? 'warning' : 'danger'}" 
               style="width: ${s.completionPct}%;"></div>
        </div>
        <div class="subject-summary-meta">
          <span>${s.revisedSubtopics}/${s.totalSubtopics} revised</span>
          <span>•</span>
          <span>${s.dueSubtopics + s.overdueSubtopics} due</span>
          <span>•</span>
          <span>${confEmoji} ${s.avgConfidence}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- STREAK ----------
function renderStreak() {
  const streakEl = document.getElementById('streakValue');
  const subEl = document.getElementById('streakSub');
  if (!streakEl) return;

  const streak = getRevisionStreak();
  streakEl.textContent = streak;

  // Color coding
  if (streak >= 7) {
    streakEl.style.color = 'var(--danger)';
    if (subEl) subEl.textContent = '🔥 On fire! Shabaash!';
  } else if (streak >= 3) {
    streakEl.style.color = 'var(--warning)';
    if (subEl) subEl.textContent = 'Keep going! 7 tak pahuncho';
  } else if (streak >= 1) {
    streakEl.style.color = 'var(--primary)';
    if (subEl) subEl.textContent = 'Shuruat ho gayi. Kal bhi karo!';
  } else {
    streakEl.style.color = 'var(--text-muted)';
    if (subEl) subEl.textContent = 'Aaj se shuru karo!';
  }
}

// ---------- BULK ACTIONS ----------
function initBulkActions() {
  const bulkBar = document.getElementById('bulkBar');
  if (!bulkBar) return;

  // Show bulk bar always (with default state)
  bulkBar.classList.remove('hidden');

  const selectAll = document.getElementById('bulkSelectAll');
  const bulkCount = document.getElementById('bulkCount');
  const reviseBtn = document.getElementById('bulkReviseBtn');
  const clearBtn = document.getElementById('bulkClearBtn');

  function updateBulkUI() {
    const selected = document.querySelectorAll('[data-select-checkbox]:checked');
    const count = selected.length;
    if (bulkCount) bulkCount.textContent = `(${count})`;
    if (reviseBtn) reviseBtn.disabled = count === 0;
  }

  // Select all
  selectAll?.addEventListener('change', (e) => {
    document.querySelectorAll('[data-select-checkbox]').forEach(cb => {
      cb.checked = e.target.checked;
    });
    updateBulkUI();
  });

  // Individual checkbox change
  document.getElementById('revisionCardsContainer')?.addEventListener('change', (e) => {
    if (e.target.matches('[data-select-checkbox]')) {
      updateBulkUI();
      // Update select-all state
      const all = document.querySelectorAll('[data-select-checkbox]');
      const checked = document.querySelectorAll('[data-select-checkbox]:checked');
      if (selectAll) {
        selectAll.checked = all.length > 0 && all.length === checked.length;
        selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
      }
    }
  });

  // Revise selected
  reviseBtn?.addEventListener('click', () => {
    const selected = document.querySelectorAll('[data-select-checkbox]:checked');
    if (selected.length === 0) return;

    const items = Array.from(selected).map(cb => {
      const [topicId, subtopicId] = cb.dataset.selectCheckbox.split('::');
      return { topicId, subtopicId };
    });

    const count = bulkMarkRevised(items);
    renderAll();
    showToast(`✅ ${count} subtopics revised!`, 'success');

    // Reset
    if (selectAll) selectAll.checked = false;
    updateBulkUI();
  });

  // Clear selection
  clearBtn?.addEventListener('click', () => {
    document.querySelectorAll('[data-select-checkbox]').forEach(cb => cb.checked = false);
    if (selectAll) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    }
    updateBulkUI();
  });

  updateBulkUI();
}

// ---------- HISTORY MODAL ----------
function showHistoryModal(topicId, subtopicId) {
  const history = getRevisionHistory(topicId, subtopicId);
  const topic = getTopic(topicId);
  const sub = (topic?.subtopics || []).find(s => s.id === subtopicId);

  if (!sub) return;

  // Create modal dynamically
  const modal = document.createElement('div');
  modal.className = 'summary-modal show';
  modal.id = 'historyModal';

  modal.innerHTML = `
    <div class="summary-box" style="max-width: 500px;">
      <div class="summary-header">
        <div class="summary-header-icon">📅</div>
        <h2>Revision History</h2>
        <p>${escapeHtml(topic.name)} → ${escapeHtml(sub.name)}</p>
      </div>

      <div class="history-list">
        ${history.length === 0 
          ? '<p class="text-muted text-center" style="padding: 20px;">Abhi koi revision nahi hui</p>'
          : history.map((h, i) => `
              <div class="history-item">
                <div class="history-num">R${i + 1}</div>
                <div class="history-date">${formatDate(h.date)}</div>
                <div class="history-gap">${i === 0 ? 'First' : h.gap + 'd gap'}</div>
              </div>
            `).reverse().join('')
        }
      </div>

      <div class="summary-actions">
        <button class="btn btn-secondary" id="closeHistoryBtn">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('closeHistoryBtn')?.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}