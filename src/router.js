/* ====================================
   SPA Router — Hash-based
   ==================================== */

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
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  }

  async _onHashChange() {
    const path = this._getPath();

    if (path === this.currentRoute) return;
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

      // Page enter animation
      requestAnimationFrame(() => {
        this.appEl.classList.remove('page-enter');
        this.appEl.classList.add('page-active');
      });

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }
}

export const router = new Router();
