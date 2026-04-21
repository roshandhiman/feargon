/* ====================================
   Feargon Invest — Main Entry
   ==================================== */

// Styles
import './styles/index.css';
import './styles/animations.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/market.css';
import './styles/simulator.css';
import './styles/advisor.css';
import './styles/automode.css';
import './styles/fearbreaker.css';

// Router
import { router } from './router.js';

// Pages
import { renderLanding } from './pages/landing.js';
import { renderAuth } from './pages/auth.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderMarket } from './pages/market.js';
import { renderSimulator } from './pages/simulator.js';
import { renderAdvisor } from './pages/advisor.js';
import { renderAutoMode } from './pages/automode.js';
import { renderStockDetail } from './pages/stock.js';
import { renderProfile } from './pages/profile.js';
import { renderFearBreaker } from './pages/fearbreaker.js';
import { renderTradeAnalysis } from './pages/tradeAnalysis.js';
import { renderCredits } from './pages/credits.js';
import { store } from './utils/store.js';

// Apply Theme dynamically on load
document.documentElement.setAttribute('data-theme', localStorage.getItem('feargon_theme') || 'light');

// Clean up default Vite files
document.querySelector('#app').innerHTML = '';

async function initApp() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      once: false, // whether animation should happen only once - while scrolling down
      mirror: true, // whether elements should animate out while scrolling past them
    });
  }
  
  // Connect robust store synchronization
  await store.initializeAuth();
  
  router.start();
}

// Register routes
router
  .addRoute('/', renderLanding)
  .addRoute('/auth', renderAuth)
  .addRoute('/dashboard', renderDashboard)
  .addRoute('/market', renderMarket)
  .addRoute('/simulator', renderSimulator)
  .addRoute('/advisor', renderAdvisor)
  .addRoute('/automode', renderAutoMode)
  .addRoute('/stock', renderStockDetail)
  .addRoute('/profile', renderProfile)
  .addRoute('/fearbreaker', renderFearBreaker)
  .addRoute('/trade', renderTradeAnalysis)
  .addRoute('/credits', renderCredits);

// Start router
initApp();

// Handle resize for charts
window.addEventListener('resize', () => {
  // Redraw charts on resize - pages handle their own canvas redraw
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    const event = new Event('resize');
    canvas.dispatchEvent(event);
  });
});

// Generic binding for profile menus universally mapping to new Profile Page
document.addEventListener('click', (e) => {
  if (e.target.closest('.user-profile')) {
    window.location.hash = '/profile';
  }
  
  if (e.target.closest('.notification-btn') && !e.target.closest('#mobile-menu-btn')) {
    import('./components/toast.js').then(({ showToast }) => {
      showToast('You have no new notifications right now.', { type: 'info' });
    });
  }
});
