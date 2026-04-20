/* ====================================
   SPA Router — Hash-based
   ==================================== */

import { store } from './utils/store.js';
import { i18n } from './utils/i18n.js';

export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.appEl = document.getElementById('app');
    this._onHashChange = this._onHashChange.bind(this);
    this.lastUser = null;
    
    this.currentCleanup = null;
    
    // Auto-update routing when user session/store changes
    store.subscribe(() => {
      this._onHashChange();
    });
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);
    this._onHashChange();
  }

  destroy() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  navigate(path) {
    window.location.hash = path;
  }

  _getPath() {
    const hash = window.location.hash.slice(1) || '/';
    
    // Detect Supabase auth callback fragments
    const authKeys = ['access_token', 'id_token', 'error', 'provider_token', 'refresh_token'];
    if (authKeys.some(key => hash.startsWith(key))) {
      return '/';
    }

    // Strip query params and extra hash fragments
    let path = hash.split('?')[0].split('#')[0];
    return path;
  }

  async _onHashChange() {
    const path = this._getPath();
    const authStateChanged = (!!store.user !== !!this.lastUser);

    if (!authStateChanged && path === this.currentRoute) return;
    this.lastUser = store.user ? { ...store.user } : null;

    // Optional Auth redirection protecting non-public paths
    const publicPaths = ['/', '/auth'];
    if (!publicPaths.includes(path) && !store.user) {
      window.location.hash = '/auth';
      return;
    }

    // Redirect to dashboard if logged in and trying to access auth or landing page
    if ((path === '/auth' || path === '/') && store.user) {
      window.location.hash = '/dashboard';
      return;
    }

    this.currentRoute = path;

    const handler = this.routes[path] || this.routes['/'];

    if (handler) {
      // 1. Run cleanup from previous page
      if (typeof this.currentCleanup === 'function') {
        try {
          this.currentCleanup();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
        this.currentCleanup = null;
      }

      // Page exit animation
      this.appEl.classList.remove('page-active');
      this.appEl.classList.add('page-enter');

      await new Promise(r => setTimeout(r, 150));

      // Clear and render
      this.appEl.innerHTML = '';
      
      // 2. Render new page and capture its cleanup function
      const cleanup = await handler(this.appEl);
      if (typeof cleanup === 'function') {
        this.currentCleanup = cleanup;
      }
      
      // Parse translations for newly injected elements
      i18n.parse(this.appEl);
      
      // Global avatar syncing after layout load
      const avatarKey = localStorage.getItem('fearless_profile_avatar');
      const nameFallback = store.profile?.name || store.user?.user_metadata?.name || 'U';
      const globalAvatarHtml = avatarKey 
         ? `<img src="${avatarKey}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />` 
         : nameFallback.charAt(0).toUpperCase();
      
      document.querySelectorAll('.user-avatar').forEach(el => {
         el.innerHTML = globalAvatarHtml;
         el.style.overflow = 'hidden';
      });

      // Page enter animation
      requestAnimationFrame(() => {
        this.appEl.classList.remove('page-enter');
        this.appEl.classList.add('page-active');
        if (typeof AOS !== 'undefined') {
          setTimeout(() => {
             AOS.refreshHard();
          }, 50);
        }
      });

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }
}

export const router = new Router();
