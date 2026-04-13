/* ====================================
   Dashboard Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { createGauge } from '../components/gauge.js';
import { drawLineChart, generateSmoothData } from '../components/chart.js';
import { icons, formatCurrency } from '../utils/helpers.js';
import { getCoinPrice, getCryptoMarketData } from '../services/crypto.js';
import { getStockPrice } from '../services/yahoo.js';
import { registerInterval, clearPageIntervals, getCachedData, setCachedData, isCacheValid } from '../services/dataManager.js';

const PAGE_NAME = 'dashboard';

// Trending stocks to auto-load on dashboard
const TRENDING_STOCKS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'NVDA'];

export function renderDashboard(container) {
  // Clean up any previous intervals from this page
  clearPageIntervals(PAGE_NAME);

  container.innerHTML = '';

  // Create layout
  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  // Sidebar
  const sidebar = createSidebar();
  layout.appendChild(sidebar);

  // Main
  const main = document.createElement('div');
  main.className = 'main-content';

  main.innerHTML = `
    <!-- Top Navbar -->
    <div class="top-navbar">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div id="mobile-menu-slot"></div>
        <h1 class="top-navbar-title">Dashboard</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn" id="btn-notifications" style="
  background:#0f172a;
  color:white;
  padding:8px;
  border-radius:50%;
  border:none;
  display:flex;
  align-items:center;
  justify-content:center;
">
          ${icons.bell}
          <span class="notification-dot"></span>
        </button>
        <div class="user-profile" id="user-profile">
          <div class="user-avatar">R</div>
          <div>
            <div class="user-name">roshu</div>
            <div class="user-role">Investor</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- Main column -->
        <div>
          <!-- Portfolio Card -->
          <div class="portfolio-card glass hover-glow animate-fade-in" id="portfolio-card">
            <div class="portfolio-header">
              <div>
                <div class="portfolio-label" style="display:flex; align-items:center; gap:8px;">
                  Total Portfolio Value
                  <span style="font-size:10px; background:rgba(245, 158, 11, 0.1); color:var(--accent-yellow); padding:2px 6px; border-radius:var(--radius-full); border:1px solid rgba(245, 158, 11, 0.3);">Demo Mode — Real Portfolio Soon</span>
                </div>
                <div class="portfolio-value" id="portfolio-value">—</div>
              </div>
              <span class="portfolio-change positive" id="portfolio-change">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>
                <span>—</span>
              </span>
            </div>
            <canvas class="portfolio-chart" id="portfolio-chart"></canvas>
          </div>

          <!-- Quick Actions -->
          <div style="margin-top:var(--space-6);">
            <div class="quick-actions">
              <a href="#/simulator" class="quick-action-btn hover-lift" id="action-invest">
                ${icons.invest}
                Invest
              </a>
              <a href="#/simulator" class="quick-action-btn hover-lift" id="action-simulate">
                ${icons.simulator}
                Simulate
              </a>
              <a href="#/market" class="quick-action-btn hover-lift" id="action-explore">
                ${icons.market}
                Explore
              </a>
              <a href="#/advisor" class="quick-action-btn hover-lift" id="action-advisor">
                ${icons.advisor}
                AI Chat
              </a>
            </div>
          </div>

          <!-- Trending Stocks -->
          <div class="activity-card glass" style="margin-top:var(--space-6);">
            <h3>Trending Stocks</h3>
            <div id="trending-stocks" style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4);">
              <div class="loading-pulse" style="text-align:center;padding:var(--space-4);font-size:var(--text-sm);color:var(--text-tertiary);">Loading live stock data...</div>
            </div>
          </div>

          <!-- Top Crypto -->
          <div class="activity-card glass" style="margin-top:var(--space-6);">
            <h3>Top Cryptocurrencies</h3>
            <div id="top-crypto" style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4);">
              <div class="loading-pulse" style="text-align:center;padding:var(--space-4);font-size:var(--text-sm);color:var(--text-tertiary);">Loading live crypto data...</div>
            </div>
          </div>
        </div>

        <!-- Sidebar column -->
        <div class="dash-sidebar">
          <!-- Risk/Confidence -->
          <div class="risk-card glass hover-glow" id="risk-card">
            <h3>Confidence Score</h3>
            <div id="gauge-container"></div>
          </div>

          <!-- Market Pulse -->
          <div class="risk-card glass hover-glow" id="pulse-card">
            <h3>Market Pulse</h3>
            <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-2);">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
                <span style="font-size:var(--text-sm);font-weight:600;">AAPL</span>
                <span style="font-size:var(--text-sm);font-weight:600;" id="pulse-aapl" class="pulse-value loading-pulse">Loading...</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
                <span style="font-size:var(--text-sm);font-weight:600;">TSLA</span>
                <span style="font-size:var(--text-sm);font-weight:600;" id="pulse-tsla" class="pulse-value loading-pulse">Loading...</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
                <span style="font-size:var(--text-sm);font-weight:600;">BTC</span>
                <span style="font-size:var(--text-sm);font-weight:600;" id="pulse-btc" class="pulse-value loading-pulse">Loading...</span>
              </div>
            </div>
          </div>

          <!-- AI Insight -->
          <div class="risk-card glass hover-glow" id="ai-insight-card">
            <h3 style="display:flex;align-items:center;gap:var(--space-2);">
              ${icons.sparkles}
              AI Insight
            </h3>
            <div class="ai-text-area" id="ai-insight-text" style="margin-top:var(--space-4);">
              Your portfolio is well positioned. Connect your assets and run a simulation to receive personalized AI-driven insights.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu button
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // Render gauge initially handled asynchronously inside fetchPortfolio()

  // Animate portfolio chart
  setTimeout(() => {
    const chartCanvas = document.getElementById('portfolio-chart');
    if (chartCanvas) {
      drawLineChart(chartCanvas, {
        data: generateSmoothData(60, 0.6),
        lineColor: '#00d4ff',
        gradientStart: 'rgba(0, 212, 255, 0.15)',
        gradientEnd: 'rgba(0, 212, 255, 0)',
      });
    }
  }, 300);

  // ===== LIVE DATA INTEGRATION =====

  // Helper to update a pulse element with color class
  function updatePulseElement(id, price, changePercent) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('loading-pulse');
    if (price == null) {
      el.textContent = 'N/A';
      return;
    }
    const sign = changePercent >= 0 ? '+' : '';
    el.textContent = `${sign}${changePercent.toFixed(2)}%`;
    el.classList.remove('positive', 'negative');
    el.classList.add(changePercent >= 0 ? 'positive' : 'negative');
  }

  // --- Market Pulse: BTC (crypto) ---
  async function fetchBTC() {
    const btcData = await getCoinPrice('bitcoin');
    if (btcData) {
      updatePulseElement('pulse-btc', btcData.price, btcData.change24h);
    } else {
      const el = document.getElementById('pulse-btc');
      if (el) { el.textContent = 'N/A'; el.classList.remove('loading-pulse'); }
    }
  }

  // --- Market Pulse: AAPL + TSLA (Yahoo) ---
  async function fetchPulseStocks() {
    const [aaplData, tslaData] = await Promise.all([
      getStockPrice('AAPL'),
      getStockPrice('TSLA'),
    ]);

    if (aaplData) {
      updatePulseElement('pulse-aapl', aaplData.price, aaplData.change);
    } else {
      const el = document.getElementById('pulse-aapl');
      if (el) { el.textContent = 'N/A'; el.classList.remove('loading-pulse'); }
    }

    if (tslaData) {
      updatePulseElement('pulse-tsla', tslaData.price, tslaData.change);
    } else {
      const el = document.getElementById('pulse-tsla');
      if (el) { el.textContent = 'N/A'; el.classList.remove('loading-pulse'); }
    }
  }

  // --- Portfolio Value (derived from BTC) ---
  async function fetchPortfolio() {
    const btcData = await getCoinPrice('bitcoin');
    if (btcData) {
      const portfolioVal = btcData.price * 0.5 + 15000;
      const el = document.getElementById('portfolio-value');
      if (el) el.textContent = formatCurrency(portfolioVal);

      const changeEl = document.getElementById('portfolio-change');
      if (changeEl) {
        const isPositive = btcData.change24h >= 0;
        changeEl.className = `portfolio-change ${isPositive ? 'positive' : 'negative'}`;
        changeEl.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            ${isPositive
            ? '<polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/>'
            : '<polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/>'
          }
          </svg>
          <span>${btcData.change24h >= 0 ? '+' : ''}${btcData.change24h.toFixed(2)}%</span>
        `;
      }

      // Dynamic AI insight
      const insightEl = document.getElementById('ai-insight-text');
      if (insightEl) {
        if (btcData.change24h > 2) {
          insightEl.textContent = 'Markets are showing strong bullish momentum today. Consider taking partial profits on your positions if they\'ve exceeded your target returns.';
        } else if (btcData.change24h > 0) {
          insightEl.textContent = 'Markets are slightly positive today. Your portfolio is well-positioned. Continue your current strategy and monitor for any significant market shifts.';
        } else if (btcData.change24h > -2) {
          insightEl.textContent = 'Markets are slightly down today. This is normal volatility — stay the course. Consider this a potential buying opportunity for long-term positions.';
        } else {
          insightEl.textContent = 'Markets are experiencing a notable dip. Review your stop-loss levels and ensure your portfolio allocation matches your risk tolerance. Avoid panic selling.';
        }
      }
      
      // Dynamic Confidence Score
      const gaugeContainer = document.getElementById('gauge-container');
      if (gaugeContainer) {
        // Base market score plus volatility multiplier
        let baseScore = 65; 
        if (btcData.change24h >= 0) baseScore += (btcData.change24h * 4); // positive pushes up
        else baseScore += (btcData.change24h * 3); // negative pulls down

        // Clamp between 15 and 95
        let finalScore = Math.min(Math.max(Math.round(baseScore), 15), 95);
        
        gaugeContainer.innerHTML = '';
        gaugeContainer.appendChild(createGauge({ value: finalScore, label: 'Confidence Score' }));
      }
    }
  }

  // --- Trending Stocks Section (Yahoo) ---
  async function fetchTrendingStocks() {
    const container = document.getElementById('trending-stocks');
    if (!container) return;

    try {
      const results = await Promise.all(
        TRENDING_STOCKS.map(sym => getStockPrice(sym))
      );

      const stocks = results.filter(Boolean);
      if (stocks.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:var(--space-4);font-size:var(--text-sm);color:var(--text-tertiary);">Unable to fetch live stock data</p>';
        return;
      }

      container.innerHTML = stocks.map(stock => {
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const sign = stock.change >= 0 ? '+' : '';
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
            <div style="display:flex;align-items:center;gap:var(--space-3);">
              <span style="font-size:var(--text-sm);font-weight:700;">${stock.symbol}</span>
            </div>
            <div style="text-align:right;">
              <div style="font-size:var(--text-sm);font-weight:600;">${formatCurrency(stock.price)}</div>
              <div class="asset-price-change ${changeClass}" style="font-size:var(--text-xs);">${sign}${stock.change.toFixed(2)}%</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = '<p style="text-align:center;padding:var(--space-4);font-size:var(--text-sm);color:var(--text-tertiary);">Unable to fetch live stock data</p>';
    }
  }

  // --- Top Crypto Section (CoinGecko) ---
  async function fetchTopCrypto() {
    const container = document.getElementById('top-crypto');
    if (!container) return;

    try {
      let cryptoList;
      if (isCacheValid('crypto')) {
        cryptoList = getCachedData('crypto');
      } else {
        cryptoList = await getCryptoMarketData();
        if (cryptoList) setCachedData('crypto', cryptoList);
      }

      if (!cryptoList || cryptoList.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:var(--space-4);font-size:var(--text-sm);color:var(--text-tertiary);">Unable to fetch live crypto data</p>';
        return;
      }

      container.innerHTML = cryptoList.slice(0, 6).map(coin => {
        const changeClass = coin.change24h >= 0 ? 'positive' : 'negative';
        const sign = coin.change24h >= 0 ? '+' : '';
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
            <div style="display:flex;align-items:center;gap:var(--space-3);">
              <span style="font-size:var(--text-sm);font-weight:700;">${coin.symbol}</span>
              <span style="font-size:var(--text-xs);color:var(--text-tertiary);">${coin.name}</span>
            </div>
            <div style="text-align:right;">
              <div style="font-size:var(--text-sm);font-weight:600;">${formatCurrency(coin.price)}</div>
              <div class="asset-price-change ${changeClass}" style="font-size:var(--text-xs);">${sign}${coin.change24h.toFixed(2)}%</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = '<p style="text-align:center;padding:var(--space-4);font-size:var(--text-sm);color:var(--text-tertiary);">Unable to fetch live crypto data</p>';
    }
  }

  // ===== INITIAL DATA FETCH =====
  fetchBTC();
  fetchPulseStocks();
  fetchPortfolio();
  fetchTrendingStocks();
  fetchTopCrypto();

  // ===== REFRESH INTERVALS =====
  registerInterval(PAGE_NAME, fetchBTC, 30_000);           // Crypto pulse every 30s
  registerInterval(PAGE_NAME, fetchPortfolio, 30_000);      // Portfolio every 30s
  registerInterval(PAGE_NAME, fetchTopCrypto, 30_000);      // Crypto list every 30s
  registerInterval(PAGE_NAME, fetchPulseStocks, 60_000);    // Stock pulse every 60s
  registerInterval(PAGE_NAME, fetchTrendingStocks, 60_000); // Trending stocks every 60s
}
