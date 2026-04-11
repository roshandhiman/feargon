/* ====================================
   Fearless Invest — Main Entry
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

// Clean up default Vite files
document.querySelector('#app').innerHTML = '';

// Register routes
router
  .addRoute('/', renderLanding)
  .addRoute('/auth', renderAuth)
  .addRoute('/dashboard', renderDashboard)
  .addRoute('/market', renderMarket)
  .addRoute('/simulator', renderSimulator)
  .addRoute('/advisor', renderAdvisor)
  .addRoute('/automode', renderAutoMode);

// Start router
router.start();

// Handle resize for charts
window.addEventListener('resize', () => {
  // Redraw charts on resize - pages handle their own canvas redraw
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    const event = new Event('resize');
    canvas.dispatchEvent(event);
  });
});
