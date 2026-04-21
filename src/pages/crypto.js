import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawCandlestickChart } from '../components/chart.js';
import { icons } from '../utils/helpers.js';
import { getStockTimeSeries } from '../services/finnhub.js';
import { getCoinPrice, COIN_ID_MAP } from '../services/crypto.js';

export async function renderCryptoDetail(container) {
  try {
    container.innerHTML = '';
    
    // Extract symbol from hash e.g. #/crypto?symbol=BTC
    const urlParts = window.location.hash.split('?');
    const queryString = urlParts.length > 1 ? urlParts[1] : '';
    const hashObj = new URLSearchParams(queryString);
    const symbol = hashObj.get('symbol') || 'BTC';

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
          <h1 class="top-navbar-title">${symbol} Detail (v2)</h1>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="glass" style="padding:var(--space-4); margin-bottom:var(--space-4); border-radius:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h2 style="font-size:1.5rem;margin:0;color:var(--text-primary);">${symbol} <span style="font-size: 0.9rem; opacity: 0.6; font-weight: 400;">(Crypto)</span></h2>
              <div id="crypto-detail-price" style="font-size:2rem;font-weight:700;margin-top:8px;">Loading...</div>
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
          <canvas id="crypto-detail-chart" style="width: 100%; height: 100%;"></canvas>
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
    if (mobileSlot) mobileSlot.appendChild(createMobileMenuBtn());

    // Logic
    const priceEl = main.querySelector('#crypto-detail-price');
    const canvas = main.querySelector('#crypto-detail-chart');
    const loader = main.querySelector('#chart-loader');
    const tabs = main.querySelectorAll('.market-tab');

    // Load current price
    let currentPrice = null;
    async function loadPrice() {
      try {
        const coinId = COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
        const data = await getCoinPrice(coinId);
        
        if (data && data.price) {
          currentPrice = data.price;
          const isUp = (data.change24h || 0) >= 0;
          priceEl.innerHTML = `
            $${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} 
            <span style="font-size:1rem;color:${isUp ? 'var(--success)' : 'var(--danger)'};">
              ${isUp ? '+' : ''}${data.change24h != null ? data.change24h.toFixed(2) : 0}%
            </span>`;
        } else {
          priceEl.textContent = 'Price data unavailable';
        }
      } catch (err) {
        console.error("loadPrice error:", err);
        priceEl.textContent = 'Error loading price';
      }
    }

    await loadPrice();

    // Load chart
    async function loadChart(range) {
      try {
        loader.style.display = 'block';
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const series = await getStockTimeSeries(symbol, range, currentPrice);
        loader.style.display = 'none';

        if (series && series.length > 0) {
          const ohlc = series.map(d => ({
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close
          }));
          const volumes = series.map(d => d.volume);
          
          const dates = series.map((d) => {
             if (range === 'intraday') {
                const time = d.date.split(' ')[1]; 
                return time ? time.slice(0, 5) : d.date; 
             } else if (range === 'daily') {
                const parts = d.date.split('-');
                if (parts.length === 3) {
                  const dateObj = new Date(d.date);
                  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
             } else if (range === 'weekly') {
                const parts = d.date.split('-');
                if (parts.length === 3) {
                  const dateObj = new Date(d.date);
                  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
             } else if (range === 'monthly') {
                const parts = d.date.split('-');
                if (parts.length === 3) {
                  const dateObj = new Date(d.date);
                  return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
             }
             return d.date;
          });

          let stepsToDraw = 6;
          if (range === 'intraday') stepsToDraw = 8;
          else if (range === 'daily') stepsToDraw = Math.floor(series.length / 14); 
          else if (range === 'weekly') stepsToDraw = series.length; 
          else if (range === 'monthly') stepsToDraw = series.length; 

          drawCandlestickChart(canvas, {
            data: ohlc,
            volume: volumes,
            labels: dates,
            xSteps: stepsToDraw,
            upColor: '#26a69a',
            downColor: '#ef5350',
            animate: true,
          });
        } else {
          loader.textContent = 'Data Unavailable';
          loader.style.display = 'block';
        }
      } catch (err) {
        console.error("loadChart error:", err);
        loader.textContent = 'Chart Render Error';
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
  } catch (globalErr) {
    console.error("Global renderCryptoDetail error:", globalErr);
    container.innerHTML = `
      <div style="padding:3rem; text-align:center; color:var(--text-primary);">
        <h2 style="color:var(--danger);">Something went wrong</h2>
        <p style="margin-top:1rem; opacity:0.7;">${globalErr.message}</p>
        <button onclick="window.location.hash='#/market'" class="btn btn-primary" style="margin-top:2rem;">Return to Market</button>
      </div>
    `;
  }
}
