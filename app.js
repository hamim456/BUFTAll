/**
 * BUFT Student Dashboard — app.js
 * Vanilla JS only. No frameworks.
 */

'use strict';

/* ============================================================
   CONSTANTS & STATE
   ============================================================ */
const STORAGE_KEY_THEME = 'buft_theme';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS = [
  'Sunday','Monday','Tuesday','Wednesday',
  'Thursday','Friday','Saturday'
];

/* ============================================================
   LOADER
   ============================================================ */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Hide after CSS animation (~1.4s bar) + small buffer
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 1800);
}

/* ============================================================
   LIVE CLOCK
   ============================================================ */
function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTime(date) {
  let h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)}:${pad(s)} ${ampm}`;
}

function formatDate(date) {
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function initClock() {
  const dayEl  = document.getElementById('clockDay');
  const dateEl = document.getElementById('clockDate');
  const timeEl = document.getElementById('clockTime');

  if (!dayEl || !dateEl || !timeEl) return;

  function tick() {
    const now = new Date();
    dayEl.textContent  = DAYS[now.getDay()];
    dateEl.textContent = formatDate(now);
    timeEl.textContent = formatTime(now);
  }

  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   DARK MODE
   ============================================================ */
function initTheme() {
  const btn  = document.getElementById('themeToggle');
  const html = document.documentElement;

  // Load saved preference; respect system preference as fallback
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;

  applyTheme(isDark, html, btn);

  if (!btn) return;

  btn.addEventListener('click', () => {
    const currentlyDark = html.dataset.theme === 'dark';
    applyTheme(!currentlyDark, html, btn);
    localStorage.setItem(STORAGE_KEY_THEME, !currentlyDark ? 'dark' : 'light');
  });
}

function applyTheme(dark, html, btn) {
  html.dataset.theme = dark ? 'dark' : 'light';
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

/* ============================================================
   SCROLL TO TOP
   ============================================================ */
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   SEARCH / FILTER
   ============================================================ */
function initSearch() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  const hint     = document.getElementById('searchHint');
  const noRes    = document.getElementById('noResults');
  const noQuery  = document.getElementById('noResultsQuery');
  const grid     = document.getElementById('cardsGrid');

  if (!input || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.card'));

  function filterCards(query) {
    const q = query.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const desc  = (card.dataset.desc  || '').toLowerCase();
      const match = !q || title.includes(q) || desc.includes(q);

      card.classList.toggle('hidden', !match);
      if (match) visible++;
    });

    // Show/hide no-results message
    if (noRes) {
      noRes.hidden = visible > 0 || !q;
      if (noQuery) noQuery.textContent = `"${query.trim()}"`;
    }

    // Update hint
    if (hint) {
      if (!q) {
        hint.textContent = '';
      } else if (visible === 0) {
        hint.textContent = 'No results found.';
      } else {
        hint.textContent = `Showing ${visible} of ${cards.length} portal${cards.length !== 1 ? 's' : ''}`;
      }
    }

    // Show/hide clear button
    if (clearBtn) {
      clearBtn.hidden = !q;
    }
  }

  input.addEventListener('input', () => filterCards(input.value));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      filterCards('');
      input.focus();
    });
  }
}

/* ============================================================
   RIPPLE EFFECT
   ============================================================ */
function initRipple() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function (e) {
      const container = this.querySelector('.ripple-container');
      if (!container) return;

      // Remove old ripples
      container.querySelectorAll('.ripple').forEach(r => r.remove());

      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.cssText = `
        width:  ${size}px;
        height: ${size}px;
        left:   ${x}px;
        top:    ${y}px;
      `;

      container.appendChild(ripple);

      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

/* ============================================================
   KEYBOARD NAVIGATION FOR CARDS
   ============================================================ */
function initKeyboardNav() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/* ============================================================
   STATS — update total portals count dynamically
   ============================================================ */
function initStats() {
  const totalEl = document.getElementById('totalPortals');
  if (!totalEl) return;

  const cards = document.querySelectorAll('#cardsGrid .card');
  totalEl.textContent = cards.length;

  // Last updated — current month/year
  const lastEl = document.getElementById('lastUpdated');
  if (lastEl) {
    const now = new Date();
    lastEl.textContent = `${MONTHS[now.getMonth()].slice(0,3)} ${now.getFullYear()}`;
  }
}

/* ============================================================
   CARD STAGGERED ENTRANCE ANIMATION
   ============================================================ */
function initCardAnimations() {
  const cards = document.querySelectorAll('.card');

  // Add initial hidden state via JS so CSS-only fallback still works
  cards.forEach((card, i) => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(24px)';
    card.style.transition = `opacity 0.35s ease ${i * 45}ms, transform 0.35s ease ${i * 45}ms`;
  });

  // Use IntersectionObserver for performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Delay start until after loader
  setTimeout(() => {
    cards.forEach(card => observer.observe(card));
  }, 1600);
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  initLoader();
  initTheme();
  initClock();
  initScrollTop();
  initSearch();
  initRipple();
  initKeyboardNav();
  initStats();
  initCardAnimations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
