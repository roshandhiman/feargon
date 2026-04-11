/* ====================================
   Sidebar Component
   ==================================== */

import { icons } from '../utils/helpers.js';
import { router } from '../router.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { id: 'market', label: 'Market Explorer', icon: 'market', path: '/market' },
  { id: 'simulator', label: 'Simulator', icon: 'simulator', path: '/simulator' },
  { id: 'advisor', label: 'AI Advisor', icon: 'advisor', path: '/advisor' },
  { id: 'automode', label: 'Full Access', icon: 'autoInvest', path: '/automode' },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
];

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  const currentPath = window.location.hash.slice(1) || '/dashboard';

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <a href="#/" class="sidebar-logo">
        <svg class="sidebar-logo-icon" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="100%" stop-color="#7b61ff"/>
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="rgba(0,212,255,0.1)"/>
          <path d="M8 22V10l8 6-8 6zm8-6l8-6v12l-8-6z" fill="url(#sg)"/>
        </svg>
        <span class="sidebar-logo-text">Fearless</span>
      </a>
      <button class="sidebar-toggle" id="sidebar-toggle">
        ${icons.chevronLeft}
      </button>
    </div>

    <nav class="sidebar-nav">
      <span class="sidebar-section-label">Main</span>
      ${navItems.map(item => `
        <a href="#${item.path}" class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}" id="nav-${item.id}">
          ${icons[item.icon]}
          <span class="nav-item-text">${item.label}</span>
        </a>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      ${bottomItems.map(item => `
        <a href="#${item.path}" class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}" id="nav-${item.id}">
          ${icons[item.icon]}
          <span class="nav-item-text">${item.label}</span>
        </a>
      `).join('')}
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
