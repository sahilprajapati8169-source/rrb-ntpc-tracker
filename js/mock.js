/* ============================
   MOCK.JS — Mock Tracker
   ============================ */

let mockChart = null;

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('mockList')) return;
  render();
  attachEvents();
});

// ---------- RENDER ----------
function render() {
  const mocks = getMocks().slice().sort((a, b) => (a.num || 0) - (b.num || 0));

  // Stats
  const total = mocks.length;
  const scores = mocks.map(m => m.score || 0);
  const best = total ? Math.max(...scores) : 0;
  const avg = total ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;

  setText('statTotalMocks', total);
  setText('statBest', best);
  setText('statAvg', avg);

  // Trend
  if (total >= 2) {
    const diff = scores[scores.length - 1] - scores[scores.length - 2];
    const trendEl = document.getElementById('statTrend');
    trendEl.textContent = diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : '—';
    trendEl.style.color = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text)';
  }

  // Chart
  const chartCard = document.getElementById('chartCard');
  if (total >= 2) {
    chartCard.style.display = 'block';
    renderChart(mocks);
  } else {
    chartCard.style.display = 'none';
  }

  // List
  renderList(mocks.slice().reverse());
}

// ---------- CHART ----------
function renderChart(mocks) {
  const canvas = document.getElementById('mockChart');
  if (!canvas) return;

  if (mockChart) mockChart.destroy();

  mockChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: mocks.map(m => `Mock ${m.num || '?'}`),
      datasets: [{
        label: 'Score',
        data: mocks.map(m => m.score || 0),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#4F46E5',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#6B7280' },
          grid: { color: '#F3F4F6' }
        },
        x: {
          ticks: { color: '#6B7280' },
          grid: { display: false }
        }
      }
    }
  });
}

// ---------- RENDER LIST ----------
function renderList(list) {
  const container = document.getElementById('mockList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="syllabus-empty">
        <div class="syllabus-empty-icon">📝</div>
        <h3>Abhi koi mock nahi diya</h3>
        <p>Pehla mock add karo aur apna score track karo</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(m => {
    const sections = [];
    if (m.sections?.maths) sections.push({ name: 'Maths', val: m.sections.maths });
    if (m.sections?.reasoning) sections.push({ name: 'Reasoning', val: m.sections.reasoning });
    if (m.sections?.ga) sections.push({ name: 'GA', val: m.sections.ga });

    const weakList = (m.weakAreas || []).filter(Boolean);

    return `
      <div class="mock-card">
        <div class="mock-card-top">
          <div>
            <div class="mock-number">Mock #${m.num || '?'}</div>
            <div class="text-xs text-muted">${formatDate(m.createdAt)}</div>
          </div>
          <div style="text-align: right;">
            <div class="mock-score">${m.score}<span class="mock-score-total">/${m.total}</span></div>
          </div>
          <button class="btn btn-ghost btn-sm" data-delete="${m.id}" title="Delete">🗑️</button>
        </div>

        ${sections.length ? `
          <div class="mock-sections">
            ${sections.map(s => `
              <div class="mock-section">
                <div class="mock-section-subject">${s.name}</div>
                <div class="mock-section-score">${s.val}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${m.time ? `<p class="text-xs text-muted mt-3">⏱ Time: ${m.time} min</p>` : ''}

        ${weakList.length ? `
          <div class="mock-weak">
            ⚠️ Weak: <strong>${weakList.join(', ')}</strong>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ---------- EVENTS ----------
function attachEvents() {
  document.getElementById('toggleMockFormBtn')?.addEventListener('click', () => {
    document.getElementById('mockFormCard').classList.toggle('hidden');
  });
  document.getElementById('closeMockFormBtn')?.addEventListener('click', () => {
    document.getElementById('mockFormCard').classList.add('hidden');
  });
  document.getElementById('cancelMockBtn')?.addEventListener('click', () => {
    document.getElementById('mockFormCard').classList.add('hidden');
  });

  document.getElementById('saveMockBtn')?.addEventListener('click', saveMock);

  document.getElementById('mockList')?.addEventListener('click', async (e) => {
  const delBtn = e.target.closest('[data-delete]');
  if (delBtn) {
    const ok = await confirmAction('Mock delete karna hai?', 'Delete Mock');
    if (ok) {
      deleteMock(delBtn.dataset.delete);
      showToast('Deleted', 'info');
      render();
    }
  }
});
}

// ---------- SAVE ----------
function saveMock() {
  const num = parseInt(document.getElementById('mockNum').value) || 0;
  const score = parseInt(document.getElementById('mockScore').value) || 0;
  const total = parseInt(document.getElementById('mockTotal').value) || 100;
  const maths = document.getElementById('mockMaths').value.trim();
  const reasoning = document.getElementById('mockReasoning').value.trim();
  const ga = document.getElementById('mockGA').value.trim();
  const time = parseInt(document.getElementById('mockTime').value) || 0;
  const weakAreas = document.getElementById('mockWeak').value
    .split(',').map(s => s.trim()).filter(Boolean);

  if (!num || !score) {
    showToast('Mock # aur score required ❌', 'danger');
    return;
  }

  const mock = {
    id: generateId('mock'),
    num,
    score,
    total,
    sections: { maths, reasoning, ga },
    time,
    weakAreas,
    createdAt: todayStr()
  };

  saveMockToStorage(mock);

  // Reset
  ['mockNum','mockScore','mockMaths','mockReasoning','mockGA','mockTime','mockWeak']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('mockTotal').value = 100;

  document.getElementById('mockFormCard').classList.add('hidden');

  showToast('Mock saved 📝', 'success');
  render();
}

// ---------- STORAGE WRAPPER ----------
function saveMockToStorage(mock) {
  const mocks = getMocks();
  mocks.push(mock);
  saveData('rrb_mocks', mocks);
}

// ---------- HELPERS ----------
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }