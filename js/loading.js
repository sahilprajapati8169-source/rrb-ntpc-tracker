/* ============================
   LOADING.JS — Professional Loader
   ============================ */

const MOTIVATIONAL_QUOTES = [
  { icon: '💡', text: 'Consistency beats intensity. Roz padho.' },
  { icon: '🔥', text: 'Aaj ki mehnat, kal ki selection.' },
  { icon: '🎯', text: 'Focus on progress, not perfection.' },
  { icon: '📚', text: 'Ek topic roz complete karo — 72 din mein syllabus khatam.' },
  { icon: '⚡', text: 'Toppers wo nahi hote jo padhte hain, jo revise karte hain.' },
  { icon: '🧠', text: 'Weak topics pehle, strong topics baad mein.' },
  { icon: '🏆', text: 'Selection unka hota hai jo daily consistent hai.' },
  { icon: '⏱', text: 'Smart work + Hard work = Success.' },
  { icon: '🌟', text: 'Chhoti chhoti jeet, badi success ki taraf le jaati hai.' },
  { icon: '🚀', text: 'Aaj ka ek revision, kal ka selection.' },
  { icon: '📝', text: 'Mistakes se seekho, unse daro mat.' },
  { icon: '🎓', text: 'RRB NTPC crack karna hai toh — consistency + revision.' }
];

let loaderProgress = 0;
let loaderInterval = null;
let quoteInterval = null;
let currentQuoteIndex = 0;

// ---------- INIT LOADER ----------
function initLoader() {
  const loader = document.getElementById('loaderScreen');
  if (!loader) return;

  // Initial quote
  updateQuote();

  // Fake progress bar (0 to 90% in 2 sec)
  let progress = 0;
  loaderInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 8 + 3; // 3-11% jump
      if (progress > 90) progress = 90;
      updateProgress(progress);
    }
  }, 120);

  // Rotate quotes every 2 sec
  quoteInterval = setInterval(() => {
    rotateQuote();
  }, 2000);

  // When page fully loaded
  window.addEventListener('load', finishLoader);
  
  // Fallback: force finish after 4 sec (max)
  setTimeout(finishLoader, 4000);
}

// ---------- UPDATE PROGRESS ----------
function updateProgress(pct) {
  const bar = document.getElementById('loaderBar');
  const pctEl = document.getElementById('loaderPercent');
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
}

// ---------- UPDATE QUOTE ----------
function updateQuote() {
  const quoteEl = document.getElementById('loaderQuote');
  if (!quoteEl) return;

  const q = MOTIVATIONAL_QUOTES[currentQuoteIndex];
  quoteEl.innerHTML = `<span style="margin-right: 6px;">${q.icon}</span> ${q.text}`;
}

// ---------- ROTATE QUOTE ----------
function rotateQuote() {
  const quoteEl = document.getElementById('loaderQuote');
  if (!quoteEl) return;

  // Fade out
  quoteEl.classList.add('fade-out');

  setTimeout(() => {
    currentQuoteIndex = (currentQuoteIndex + 1) % MOTIVATIONAL_QUOTES.length;
    updateQuote();
    quoteEl.classList.remove('fade-out');
  }, 400);
}

// ---------- FINISH LOADER ----------
let loaderFinished = false;

function finishLoader() {
  if (loaderFinished) return;
  loaderFinished = true;

  const loader = document.getElementById('loaderScreen');
  if (!loader) return;

  // Clear intervals
  if (loaderInterval) clearInterval(loaderInterval);
  if (quoteInterval) clearInterval(quoteInterval);

  // Jump to 100%
  updateProgress(100);

  // Fade out after short delay
  setTimeout(() => {
    loader.classList.add('hide');

    // Remove from DOM after fade animation
    setTimeout(() => {
      loader.remove();
    }, 600);
  }, 300);
}

// ---------- AUTO INIT ----------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoader);
} else {
  initLoader();
}