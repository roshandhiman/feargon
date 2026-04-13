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
    let hash = window.location.hash.slice(1) || '/';
    return hash.split('?')[0]; // Strip query params for routing
  }

  async _onHashChange() {
    const path = this._getPath();

    if (path === this.currentRoute) return;

    // Optional Auth redirection protecting non-public paths
    const publicPaths = ['/', '/auth'];
    if (!publicPaths.includes(path) && !store.user) {
      window.location.hash = '/auth';
      return;
    }

    // Redirect to dashboard if logged in and trying to access auth page
    if (path === '/auth' && store.user) {
      window.location.hash = '/dashboard';
      return;
    }

    this.currentRoute = path;

    const handler = this.routes[path] || this.routes['/'];

    if (handler) {
      // Page exit animation
      this.appEl.classList.remove('page-active');
      this.appEl.classList.add('page-enter');

      await new Promise(r => setTimeout(r, 150));

      // Clear and render
      this.appEl.innerHTML = '';
      await handler(this.appEl);
      
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
