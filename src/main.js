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

// Clean up default Vite files
document.querySelector('#app').innerHTML = '';

function initApp() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      once: false, // whether animation should happen only once - while scrolling down
      mirror: true, // whether elements should animate out while scrolling past them
    });
  }
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
  .addRoute('/stock', renderStockDetail);

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
