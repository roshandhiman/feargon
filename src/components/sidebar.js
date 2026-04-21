/* ====================================
   Sidebar Component
   ==================================== */

import { icons } from '../utils/helpers.js';
import { router } from '../router.js';
import { i18n } from '../utils/i18n.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { id: 'market', label: 'Market Explorer', icon: 'market', path: '/market' },
  { id: 'fearbreaker', label: 'Fear Profiler', icon: 'target', path: '/fearbreaker' },
  { id: 'simulator', label: 'Simulator', icon: 'simulator', path: '/simulator' },
  { id: 'trade', label: 'Trade Vision', icon: 'chart', path: '/trade' },
  { id: 'advisor', label: 'AI Advisor', icon: 'advisor', path: '/advisor' },
  { id: 'automode', label: 'Full Access', icon: 'autoInvest', path: '/automode' },
  { id: 'credits', label: 'Credits Hub', icon: 'target', path: '/credits' },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/profile' },
];

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  const currentPath = window.location.hash.slice(1) || '/dashboard';

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <a href="#/" class="sidebar-logo">
        <img src="/logo.jpeg" alt="Fearless Invest Logo" class="sidebar-logo-icon" style="border-radius: 8px; object-fit: cover;" />
        <span class="sidebar-logo-text">Feargon</span>
      </a>
      <button class="sidebar-toggle" id="sidebar-toggle">
        ${icons.chevronLeft}
      </button>
    </div>

    <nav class="sidebar-nav">
      <span class="sidebar-section-label">Main</span>
      ${navItems.map(item => `
        <a href="#${item.path}" class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}" id="nav-${item.id}" data-i18n="nav.${item.id}">
          ${icons[item.icon] || icons.settings}
          <span class="nav-item-text i18n-text">${item.label}</span>
        </a>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      ${bottomItems.map(item => `
        <a href="#${item.path}" class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}" id="nav-${item.id}" data-i18n="nav.${item.id}">
          ${icons[item.icon]}
          <span class="nav-item-text i18n-text">${item.label}</span>
        </a>
      `).join('')}
      
      <!-- Utility Toggles -->
      <div style="display: flex; gap: 8px; margin-top: 16px; padding: 0 16px;">
        <button id="theme-toggle" class="btn btn-secondary btn-icon" style="flex:1;" title="Toggle Dark/Light Mode">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
        </button>
        <button id="lang-toggle" class="btn btn-secondary" style="flex:1; font-weight:700; font-size:12px;" title="Toggle Language">
          ${i18n.lang === 'en' ? 'EN' : 'HI'}
        </button>
      </div>

      <div style="padding: 16px;">
        <button id="connect-wallet" class="btn btn-primary" style="width:100%; justify-content:center; gap:8px;">
          ${icons.autoInvest}
          Connect Wallet
        </button>
      </div>
    </div>
  `;

  // Toggle collapse
  const toggleBtn = sidebar.querySelector('#sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.toggle('sidebar-collapsed');
    }
  });

  // Toggles handlers
  const themeBtn = sidebar.querySelector('#theme-toggle');
  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('feargon_theme', newTheme);
  });

  const langBtn = sidebar.querySelector('#lang-toggle');
  langBtn.addEventListener('click', () => {
    i18n.lang = i18n.lang === 'en' ? 'hi' : 'en';
    langBtn.textContent = i18n.lang === 'en' ? 'EN' : 'HI';
    // Re-render current page immediately safely
    window.location.reload(); 
  });

  const walletBtn = sidebar.querySelector('#connect-wallet');
  walletBtn.addEventListener('click', () => {
    alert("🔒 Blockchain connectivity is coming soon in the production release! Stay tuned for full portfolio management.");
  });

  // Update active state on navigation
  function updateActive() {
    const path = window.location.hash.slice(1) || '/dashboard';
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.path === path);
    });
  }

  window.addEventListener('hashchange', updateActive);

  return sidebar;
}

/**
 * Create mobile sidebar overlay
 */
export function createMobileMenuBtn() {
  const btn = document.createElement('button');
  btn.className = 'btn-icon notification-btn';
  btn.id = 'mobile-menu-btn';
  btn.innerHTML = icons.menu;
  btn.style.display = 'none';

  // Show on mobile
  if (window.innerWidth <= 768) {
    btn.style.display = 'flex';
  }

  window.addEventListener('resize', () => {
    btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  });

  btn.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  });

  return btn;
}
