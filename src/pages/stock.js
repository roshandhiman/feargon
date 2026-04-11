import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawLineChart } from '../components/chart.js';
import { icons } from '../utils/helpers.js';
import { getStockTimeSeries, getMarketStockPrice } from '../services/finnhub.js';

export async function renderStockDetail(container) {
  container.innerHTML = '';
  
  // Extract symbol from hash e.g. #/stock?symbol=AAPL
  const hashObj = new URLSearchParams(window.location.hash.split('?')[1]);
  const symbol = hashObj.get('symbol') || 'IBM';

  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  const sidebar = createSidebar();
  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'main-content';

  main.innerHTML = `
    <div class="top-navbar">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div id="mobile-menu-slot"></div>
        <a href="#/market" class="back-btn" style="color:var(--text-secondary);text-decoration:none;display:flex;align-items:center;gap:4px;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </a>
        <h1 class="top-navbar-title">${symbol} Detail</h1>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="glass" style="padding:var(--space-4); margin-bottom:var(--space-4); border-radius:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 style="font-size:1.5rem;margin:0;color:var(--text-primary);">${symbol}</h2>
            <div id="stock-detail-price" style="font-size:2rem;font-weight:700;margin-top:8px;">Loading...</div>
          </div>
          <div class="chart-tabs">
            <button class="market-tab active" data-range="intraday">Intraday</button>
            <button class="market-tab" data-range="daily">Daily</button>
            <button class="market-tab" data-range="weekly">Weekly</button>
            <button class="market-tab" data-range="monthly">Monthly</button>
          </div>
        </div>
      </div>

      <div class="glass" style="padding:var(--space-4); border-radius:16px; height: 400px; position:relative;">
        <canvas id="stock-detail-chart" style="width: 100%; height: 100%;"></canvas>
        <div id="chart-loader" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--text-tertiary);">
          Loading chart data...
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // Logic
  const priceEl = main.querySelector('#stock-detail-price');
  const canvas = main.querySelector('#stock-detail-chart');
  const loader = main.querySelector('#chart-loader');
  const tabs = main.querySelectorAll('.market-tab');

  // Load current price
  getMarketStockPrice(symbol).then(data => {
    if (data && data.price) {
      const isUp = data.change >= 0;
      priceEl.innerHTML = `
        $${data.price.toFixed(2)} 
        <span style="font-size:1rem;color:${isUp ? 'var(--success)' : 'var(--danger)'};">
          ${isUp ? '+' : ''}${data.change.toFixed(2)}%
        </span>`;
    } else {
      priceEl.textContent = 'Price data unavailable';
    }
  });

  // Load chart
  async function loadChart(range) {
    loader.style.display = 'block';
    
    // Clear canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const series = await getStockTimeSeries(symbol, range);
    loader.style.display = 'none';

    if (series && series.length > 0) {
      const prices = series.map(d => d.price);
      
      const dates = series.map((d) => {
         if (range === 'intraday') {
            const time = d.date.split(' ')[1]; // "YYYY-MM-DD HH:MM:SS" -> "HH:MM:SS"
            return time ? time.slice(0, 5) : d.date; // "HH:MM"
         } else if (range === 'daily') {
            // "YYYY-MM-DD" -> "MMM DD, YYYY"
            const parts = d.date.split('-');
            if (parts.length === 3) {
              const dateObj = new Date(d.date);
              return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
         } else if (range === 'weekly') {
            // "YYYY-MM-DD" -> "MMM DD" (omit year to fit everything cleanly)
            const parts = d.date.split('-');
            if (parts.length === 3) {
              const dateObj = new Date(d.date);
              return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
         } else if (range === 'monthly') {
            // "YYYY-MM-DD" -> "MMM YYYY"
            const parts = d.date.split('-');
            if (parts.length === 3) {
              const dateObj = new Date(d.date);
              return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }
         }
         return d.date;
      });

      // Calculate perfect steps alignment requested
      let stepsToDraw = 6;
      if (range === 'intraday') {
         stepsToDraw = 8;
      } else if (range === 'daily') {
         // Gap of ~14 days (10 to 15 requested)
         stepsToDraw = Math.floor(prices.length / 14); 
      } else if (range === 'weekly') {
         stepsToDraw = prices.length; // precisely every week
      } else if (range === 'monthly') {
         stepsToDraw = prices.length; // precisely every month
      }

      drawLineChart(canvas, {
        data: prices,
        labels: dates,
        xSteps: stepsToDraw,
        lineColor: prices[prices.length - 1] > prices[0] ? '#10b981' : '#ef4444',
        gradientStart: prices[prices.length - 1] > prices[0] ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        gradientEnd: 'rgba(0,0,0,0)',
        animate: true,
      });
    } else {
      loader.textContent = 'AlphaVantage Rate Limit / No Data';
      loader.style.display = 'block';
    }
  }

  // Bind tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const range = e.target.dataset.range;
      loadChart(range);
    });
  });

  // Initial load
  loadChart('intraday');
}
