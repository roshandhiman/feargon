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
  const age = store.profile?.age || '';
  const work = store.profile?.work || '';
  const avatarUrl = store.profile?.avatar_url || '';
  const currentCurrency = store.getGlobalCurrency();

  const displayAvatar = avatarUrl ? `<img src="${avatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />` : profileName.charAt(0).toUpperCase();

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
          <div class="user-avatar" style="width: 80px; height: 80px; font-size: var(--text-3xl); margin: 0 auto var(--space-4); overflow:hidden;">
            ${displayAvatar}
          </div>
          <h2>${profileName}</h2>
          <p style="color: var(--text-tertiary); margin-top: var(--space-1);">${email}</p>
        </div>
        
        <div class="divider"></div>
        
        <div style="margin-bottom: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">Personal Info</h3>
          
          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label" style="position: static; margin-bottom: var(--space-2); display: block; opacity: 1;">Full Name</label>
            <input type="text" id="profile-name" class="form-input" value="${profileName}" />
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label" style="position: static; margin-bottom: var(--space-2); display: block; opacity: 1;">Age</label>
            <input type="number" id="profile-age" class="form-input" value="${age}" placeholder="e.g. 28" />
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label" style="position: static; margin-bottom: var(--space-2); display: block; opacity: 1;">Work / Job Title</label>
            <input type="text" id="profile-work" class="form-input" value="${work}" placeholder="e.g. Software Engineer" />
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label" style="position: static; margin-bottom: var(--space-2); display: block; opacity: 1;">Avatar Image (Select File)</label>
            <input type="file" id="profile-avatar-file" class="form-input" accept="image/*" style="padding: 10px;" />
            <p style="font-size:12px; color:var(--text-tertiary); margin-top:4px;">Select an image to set your profile picture (will be converted to text).</p>
          </div>

          <button id="save-profile-btn" class="btn btn-primary" style="width: 100%;">Save Profile</button>
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

  // File Upload Logic (Base64 conversion)
  let newAvatarUrl = avatarUrl;
  const fileInput = main.querySelector('#profile-avatar-file');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
         if (file.size > 1048576) { // 1MB restriction to prevent huge database texts
             showToast('Image too large (max 1MB)', { type: 'error' });
             fileInput.value = "";
             return;
         }
         const reader = new FileReader();
         reader.onload = (event) => {
           newAvatarUrl = event.target.result;
         };
         reader.readAsDataURL(file);
      }
    });
  }

  // Save Profile Details
  const saveProfileBtn = main.querySelector('#save-profile-btn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      if (!user) return;
      const name = main.querySelector('#profile-name').value;
      const ageVal = parseInt(main.querySelector('#profile-age').value) || null;
      const workVal = main.querySelector('#profile-work').value;

      try {
        saveProfileBtn.textContent = 'Saving...';
        
        const updates = { 
            name, 
            age: ageVal, 
            work: workVal, 
            avatar_url: newAvatarUrl 
        };
        
        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) throw error;
        
        store.profile = { ...store.profile, ...updates };
        showToast('Profile saved successfully!', { type: 'success' });
        renderProfile(container); // Refresh UI
      } catch (e) {
        console.error(e);
        showToast('Error saving profile. Ensure DB columns exist!', { type: 'error' });
        saveProfileBtn.textContent = 'Save Profile';
      }
    });
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
