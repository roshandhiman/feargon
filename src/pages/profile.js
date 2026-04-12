import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { icons } from '../utils/helpers.js';
import { supabase } from '../utils/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../components/toast.js';

export function renderProfile(container) {
  container.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  const sidebar = createSidebar();
  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'main-content';
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  
  // Safe extraction of profile data
  const user = store.user;
  const profileName = store.profile?.name || user?.user_metadata?.name || 'User';
  const email = user?.email || 'Not logged in';
  const currentCurrency = store.getGlobalCurrency();

  main.innerHTML = `
    <div class="top-navbar">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div id="mobile-menu-slot"></div>
        <h1 class="top-navbar-title">Profile</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn">
          ${icons.bell}
        </button>
        <div class="user-profile">
          <div class="user-avatar">${profileName.charAt(0).toUpperCase()}</div>
        </div>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="glass" style="max-width: 600px; margin: 0 auto; padding: var(--space-8); border-radius: var(--radius-xl);">
        <div style="text-align: center; margin-bottom: var(--space-8);">
          <div class="user-avatar" style="width: 80px; height: 80px; font-size: var(--text-3xl); margin: 0 auto var(--space-4);">
            ${profileName.charAt(0).toUpperCase()}
          </div>
          <h2>${profileName}</h2>
          <p style="color: var(--text-tertiary); margin-top: var(--space-1);">${email}</p>
        </div>
        
        <div class="divider"></div>
        
        <div style="margin-bottom: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">Preferences</h3>
          
          <div class="form-group">
            <label class="form-label" style="position: static; margin-bottom: var(--space-2); display: block; opacity: 1;">Base Currency</label>
            <select id="currency-select" class="form-input" style="padding: var(--space-3); border-radius: var(--radius-md); background: rgba(0,0,0,0.05); cursor: pointer;">
              <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
              <option value="INR" ${currentCurrency === 'INR' ? 'selected' : ''}>INR (₹) - Indian Rupee</option>
              <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
            </select>
          </div>
        </div>
        
        <div style="margin-top: var(--space-8);">
          <button id="logout-btn" class="btn btn-secondary w-full" style="width: 100%; border-color: var(--accent-red); color: var(--accent-red);">
            Log Out
          </button>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu handling
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  if (mobileSlot) {
    mobileSlot.appendChild(createMobileMenuBtn());
  }

  // Currency Selection Logic
  const currencySelect = main.querySelector('#currency-select');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      const newCurr = e.target.value;
      store.setGlobalCurrency(newCurr);
      showToast(`Currency updated to ${newCurr}`, { type: 'success' });
    });
  }

  // Logout Logic
  const logoutBtn = main.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      store.user = null;
      store.profile = null;
      window.location.hash = '/auth';
    });
  }
}
