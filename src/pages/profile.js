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
  const age = localStorage.getItem('fearless_profile_age') || '';
  const work = localStorage.getItem('fearless_profile_work') || '';
  const avatarUrl = localStorage.getItem('fearless_profile_avatar') || '';
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
          
          <style>
            .profile-field-group {
              margin-bottom: var(--space-6);
            }
            .profile-field-label {
              display: block;
              font-size: var(--text-sm);
              font-weight: 600;
              color: var(--text-secondary);
              margin-bottom: 8px;
            }
            .profile-input {
              width: 100%;
              padding: 14px 16px;
              background: #f7f9fc;
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-md);
              font-size: var(--text-base);
              color: var(--text-primary);
              transition: all var(--transition-fast);
            }
            .profile-input:focus {
              background: #ffffff;
              border-color: var(--accent-cyan);
              box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
              outline: none;
            }
          </style>

          <div class="profile-field-group">
            <label class="profile-field-label">Full Name</label>
            <input type="text" id="profile-name" class="profile-input" value="${profileName}" />
          </div>

          <div class="profile-field-group">
            <label class="profile-field-label">Age</label>
            <input type="number" id="profile-age" class="profile-input" value="${age}" placeholder="e.g. 28" />
          </div>

          <div class="profile-field-group">
            <label class="profile-field-label">Work / Job Title</label>
            <input type="text" id="profile-work" class="profile-input" value="${work}" placeholder="e.g. Software Engineer" />
          </div>

          <div class="profile-field-group">
            <label class="profile-field-label">Avatar Image (Select File)</label>
            <input type="file" id="profile-avatar-file" class="profile-input" accept="image/*" style="padding: 10px 16px;" />
            <p style="font-size:12px; color:var(--text-tertiary); margin-top:6px;">Select an image to set your profile picture. Will scale automatically.</p>
          </div>

          <button id="save-profile-btn" class="btn btn-primary" style="width: 100%; margin-top: var(--space-2); padding: 14px; font-size: var(--text-base);">Save Profile</button>
        </div>

        <div class="divider"></div>

        <div style="margin-bottom: var(--space-6);">
          <h3 style="margin-bottom: var(--space-5);">Preferences</h3>
          
          <div class="profile-field-group">
            <label class="profile-field-label">Base Currency</label>
            <select id="currency-select" class="profile-input" style="cursor: pointer; appearance: auto;">
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
      const ageVal = main.querySelector('#profile-age').value;
      const workVal = main.querySelector('#profile-work').value;
      const currencyVal = main.querySelector('#currency-select').value;

      try {
        saveProfileBtn.textContent = 'Saving...';
        
        // Save name to Supabase
        const { error } = await supabase.from('profiles').update({ name }).eq('id', user.id);
        if (error) throw error;
        
        // Save extra fields to localStorage to bypass missing Supabase columns
        localStorage.setItem('fearless_profile_age', ageVal);
        localStorage.setItem('fearless_profile_work', workVal);
        if (newAvatarUrl) {
           localStorage.setItem('fearless_profile_avatar', newAvatarUrl);
        }
        
        store.setGlobalCurrency(currencyVal);
        store.profile = { ...store.profile, name };
        
        const globalAvatarHtml = newAvatarUrl ? `<img src="${newAvatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />` : name.charAt(0).toUpperCase();
        document.querySelectorAll('.user-avatar').forEach(el => {
           el.innerHTML = globalAvatarHtml;
           el.style.overflow = 'hidden';
        });
        
        showToast('Profile & Preferences saved!', { type: 'success' });
        renderProfile(container); // Refresh UI
      } catch (e) {
        console.error(e);
        showToast('Error saving basic profile info.', { type: 'error' });
        saveProfileBtn.textContent = 'Save Profile';
      }
    });
  }

  // Currency Selection Logic
  // (Handled entirely by the unified 'Save Profile' button above now)

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
