/* ============================
   LOADING.JS — Compact Train Loader
   ============================ */

const MOTIVATIONAL_QUOTES = [
  { icon: '💡', text: 'Consistency beats intensity. Roz padho.' },
  { icon: '🔥', text: 'Aaj ki mehnat, kal ki selection.' },
  { icon: '🚄', text: 'Vande Bharat ki speed se padho!' },
  { icon: '🎯', text: 'Focus on progress, not perfection.' },
  { icon: '📚', text: 'Ek topic roz — 82 din mein syllabus khatam.' },
  { icon: '⚡', text: 'Toppers revise karte hain, sirf padhte nahi.' },
  { icon: '🧠', text: 'Weak topics pehle, strong baad mein.' },
  { icon: '🏆', text: 'Selection unka hota hai jo daily consistent hai.' },
  { icon: '⏱', text: 'Smart work + Hard work = Success.' },
  { icon: '🌟', text: 'Chhoti jeet, badi success ki taraf.' },
  { icon: '🚀', text: 'Aaj ka ek revision, kal ka selection.' },
  { icon: '📝', text: 'Mistakes se seekho, unse daro mat.' },
  { icon: '🎓', text: 'RRB NTPC — consistency + revision.' },
  { icon: '🌅', text: 'Subah uthke padhne wale hi select hote hain.' },
  { icon: '🛤️', text: 'Track pe chalo, distraction se door.' }
];

let loaderInterval = null;
let quoteInterval = null;
let currentQuoteIndex = 0;

// ---------- INIT LOADER ----------
function initLoader() {
  const loader = document.getElementById('loaderScreen');
  if (!loader) return;

  updateQuote();

  // Fake progress
  let progress = 0;
  loaderInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 5 + 2;
      if (progress > 90) progress = 90;
      updateProgress(progress);
    }
  }, 120);

  // Rotate quotes
  quoteInterval = setInterval(rotateQuote, 1800);

  window.addEventListener('load', finishLoader);
  setTimeout(finishLoader, 4000);
}

function updateProgress(pct) {
  const bar = document.getElementById('loaderBar');
  const pctEl = document.getElementById('loaderPercent');
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = 'Loading ' + Math.round(pct) + '%';
}

function updateQuote() {
  const quoteEl = document.getElementById('loaderQuote');
  if (!quoteEl) return;
  const q = MOTIVATIONAL_QUOTES[currentQuoteIndex];
  quoteEl.innerHTML = `<span style="margin-right: 6px;">${q.icon}</span> ${q.text}`;
}

function rotateQuote() {
  const quoteEl = document.getElementById('loaderQuote');
  if (!quoteEl) return;
  quoteEl.classList.add('fade-out');
  setTimeout(() => {
    currentQuoteIndex = (currentQuoteIndex + 1) % MOTIVATIONAL_QUOTES.length;
    updateQuote();
    quoteEl.classList.remove('fade-out');
  }, 350);
}

let loaderFinished = false;

function finishLoader() {
  if (loaderFinished) return;
  loaderFinished = true;

  const loader = document.getElementById('loaderScreen');
  if (!loader) return;

  if (loaderInterval) clearInterval(loaderInterval);
  if (quoteInterval) clearInterval(quoteInterval);

  updateProgress(100);

  setTimeout(() => {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 600);
  }, 400);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoader);
} else {
  initLoader();
}