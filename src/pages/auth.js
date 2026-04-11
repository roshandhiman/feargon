/* ====================================
   Auth Page — Login / Signup
   ==================================== */

import { showToast } from '../components/toast.js';
import { icons } from '../utils/helpers.js';

export function renderAuth(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="auth-blob-1"></div>
        <div class="auth-blob-2"></div>
      </div>

      <a href="#/" class="auth-back" id="auth-back">
        ${icons.arrowLeft}
        <span>Back</span>
      </a>

      <div class="auth-card glass-strong" id="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <span class="text-gradient">Feargon Invest</span>
          </div>
        </div>

        <div class="auth-tabs" id="auth-tabs">
          <button class="auth-tab active" data-tab="login" id="tab-login">Log In</button>
          <button class="auth-tab" data-tab="signup" id="tab-signup">Sign Up</button>
        </div>

        <!-- Login Form -->
        <form class="auth-form" id="login-form">
          <div class="form-group">
            <input type="email" id="login-email" class="form-input" placeholder=" " required autocomplete="email" />
            <label for="login-email" class="form-label">Email address</label>
          </div>
          <div class="form-group">
            <input type="password" id="login-password" class="form-input" placeholder=" " required autocomplete="current-password" />
            <label for="login-password" class="form-label">Password</label>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="login-submit">Log In</button>
        </form>

        <!-- Signup Form -->
        <form class="auth-form" id="signup-form" style="display:none;">
          <div class="form-group">
            <input type="text" id="signup-name" class="form-input" placeholder=" " required autocomplete="name" />
            <label for="signup-name" class="form-label">Full name</label>
          </div>
          <div class="form-group">
            <input type="email" id="signup-email" class="form-input" placeholder=" " required autocomplete="email" />
            <label for="signup-email" class="form-label">Email address</label>
          </div>
          <div class="form-group">
            <input type="password" id="signup-password" class="form-input" placeholder=" " required autocomplete="new-password" minlength="8" />
            <label for="signup-password" class="form-label">Password</label>
          </div>

          <div class="risk-selector">
            <span class="risk-selector-label">Risk Appetite</span>
            <div class="risk-options" id="risk-options">
              <button type="button" class="risk-option" data-risk="low">Low</button>
              <button type="button" class="risk-option active" data-risk="medium">Medium</button>
              <button type="button" class="risk-option" data-risk="high">High</button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="signup-submit">Create Account</button>
        </form>

        <div class="auth-divider">
          <span>or continue with</span>
        </div>

        <div class="social-buttons">
          <button class="social-btn" id="social-google">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button class="social-btn" id="social-apple">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Apple
          </button>
        </div>
      </div>
    </div>
  `;

  // === Tab switching ===
  const tabs = container.querySelectorAll('.auth-tab');
  const loginForm = container.querySelector('#login-form');
  const signupForm = container.querySelector('#signup-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (tab.dataset.tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
      }
    });
  });

  // === Risk selector ===
  const riskOptions = container.querySelectorAll('.risk-option');
  riskOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      riskOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  // === Form submission ===
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Welcome back!', { type: 'success' });
    setTimeout(() => {
      window.location.hash = '/dashboard';
    }, 500);
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Account created successfully!', { type: 'success' });
    setTimeout(() => {
      window.location.hash = '/dashboard';
    }, 500);
  });
}
