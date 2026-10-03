/* ============================
   AUTH.JS — Demo Login System
   ============================ */

// ---------- LOGIN WITH FORM ----------
function loginWithForm(name, email, password) {
  // Basic validation
  if (!name || name.trim().length < 2) {
    return { success: false, message: 'Naam kam se kam 2 letters ka hona chahiye' };
  }
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Sahi email daalo' };
  }
  if (!password || password.length < 3) {
    return { success: false, message: 'Password kam se kam 3 characters ka hona chahiye' };
  }

  const user = {
    name: name.trim(),
    email: email.trim(),
    loginDate: todayStr(),
    loginTime: new Date().toISOString(),
    type: 'form'
  };

  saveUser(user);
  return { success: true, user };
}

// ---------- LOGIN AS GOOGLE (Demo) ----------
function loginAsGoogle() {
  const user = {
    name: 'Google User',
    email: 'google@demo.com',
    loginDate: todayStr(),
    loginTime: new Date().toISOString(),
    type: 'google'
  };
  saveUser(user);
  return { success: true, user };
}

// ---------- LOGIN AS GUEST ----------
function loginAsGuest() {
  const user = {
    name: 'Guest',
    email: 'guest@demo.com',
    loginDate: todayStr(),
    loginTime: new Date().toISOString(),
    type: 'guest'
  };
  saveUser(user);
  return { success: true, user };
}

// ---------- INIT LOGIN PAGE ----------
function initLoginPage() {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const googleBtn = document.getElementById('googleBtn');
  const skipBtn = document.getElementById('skipBtn');

  // Agar user already logged in hai → direct dashboard
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('nameInput').value;
      const email = document.getElementById('emailInput').value;
      const password = document.getElementById('passwordInput').value;

      const result = loginWithForm(name, email, password);

      if (result.success) {
        showToast('Login successful! 🎉', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 500);
      } else {
        errorEl.textContent = '❌ ' + result.message;
        errorEl.classList.add('show');
      }
    });
  }

  // Google button
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      loginAsGoogle();
      showToast('Google login (demo) ✅', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    });
  }

  // Skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      loginAsGuest();
      showToast('Welcome, Guest! 👋', 'info');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    });
  }
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  // Only run on login page
  if (document.getElementById('loginForm')) {
    initLoginPage();
  }
});