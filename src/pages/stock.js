import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawLineChart } from '../components/chart.js';
import { icons, formatCurrency, renderUserProfile } from '../utils/helpers.js';
import { getStockTimeSeries, getMarketStockPrice } from '../services/finnhub.js';
import { getCoinHistory, getCoinPrice } from '../services/crypto.js';
import { getAIAssetVerdict } from '../utils/gemini.js';

export async function renderStockDetail(container) {
  container.innerHTML = '';
  
  // Extract symbol from hash e.g. #/stock?symbol=AAPL&type=crypto
  const hashObj = new URLSearchParams(window.location.hash.split('?')[1]);
  const symbol = hashObj.get('symbol') || 'IBM';
  const assetType = hashObj.get('type') || 'stock';

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
        <h1 class="top-navbar-title">${symbol.toUpperCase()} Detail</h1>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="asset-detail-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <!-- Left: Chart & Info -->
        <div>
          <div class="glass" style="padding:var(--space-4); margin-bottom:var(--space-4); border-radius:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <h2 style="font-size:1.5rem;margin:0;color:var(--text-primary);">${symbol.toUpperCase()}</h2>
                <div id="stock-detail-price" style="font-size:2rem;font-weight:700;margin-top:8px;">Loading...</div>
              </div>
              <div class="chart-tabs">
                <button class="market-tab active" data-range="intraday">Intraday</button>
                <button class="market-tab" data-range="daily">Daily</button>
                <button class="market-tab" data-range="weekly">Weekly</button>
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

        <!-- Right: AI Verdict -->
        <div class="ai-verdict-sidebar">
          <div class="glass" style="padding: 24px; height: 100%;">
            <div style="margin-bottom: 24px; display: flex; justify-content: flex-end;">
              ${renderUserProfile()}
            </div>
            <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
              ${icons.sparkles}
              AI Expert Verdict
            </h3>

            <div id="ai-verdict-status" style="text-align: center; margin-bottom: 24px;">
               <div class="loading-pulse" style="height: 100px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 12px; color: var(--text-tertiary);">
                 Analyzing Trends...
               </div>
            </div>

            <div id="ai-verdict-result" style="display: none;">
               <div id="verdict-badge" style="font-size: 32px; font-weight: 900; text-align: center; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                 HOLD
               </div>
               
               <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                 <span style="font-size: 12px; color: var(--text-tertiary);">AI CONFIDENCE</span>
                 <span id="verdict-confidence" style="font-weight: 700;">85%</span>
               </div>

               <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                 <h4 style="font-size: 12px; color: var(--accent-purple); margin-bottom: 8px;">REASONING</h4>
                 <p id="verdict-reasoning" style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;"></p>
               </div>

               <div style="display: flex; flex-direction: column; gap: 8px;">
                 <div id="verdict-level-1" style="min-height: 48px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; padding: 10px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; color: #10b981;"></div>
                 <div id="verdict-level-2" style="min-height: 48px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; padding: 10px 12px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; color: #ef4444;"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  const priceEl = main.querySelector('#stock-detail-price');
  const canvas = main.querySelector('#stock-detail-chart');
  const loader = main.querySelector('#chart-loader');
  const tabs = main.querySelectorAll('.market-tab');
  
  const verdictStatus = main.querySelector('#ai-verdict-status');
  const verdictResult = main.querySelector('#ai-verdict-result');

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseDisplayedPrice() {
    const match = priceEl.textContent.match(/-?\$?[\d,]+(?:\.\d+)?/);
    if (!match) return null;
    const numericValue = Number(match[0].replace(/[$,]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function formatLevelValue(value, fallback = 'N/A') {
    if (value === null || value === undefined || value === '') return fallback;
    const rawValue = String(value).trim();
    const withoutLabel = rawValue.replace(/^(target profit|take profit|stop loss|support|resistance)\s*:\s*/i, '').trim();
    const numericText = withoutLabel.replace(/[^0-9.-]/g, '');
    if (!numericText) return withoutLabel || fallback;
    const numericValue = Number(numericText);
    if (Number.isFinite(numericValue)) return `$${numericValue.toFixed(2)}`;
    return withoutLabel || fallback;
  }

  function renderVerdictLevel(el, iconSvg, label, value) {
    const sizedIcon = iconSvg.replace('<svg ', '<svg style="width:100%;height:100%;" ');
    el.innerHTML = `
      <span style="width: 18px; height: 18px; display: inline-flex; flex: 0 0 18px;">${sizedIcon}</span>
      <span style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.78;">${label}</span>
        <strong style="font-size: 13px; line-height: 1.25; overflow-wrap: anywhere;">${escapeHTML(value)}</strong>
      </span>
    `;
  }

  // Load Current Price
  async function fetchPrice() {
    let data;
    if (assetType === 'crypto') {
      data = await getCoinPrice(symbol);
      if (data) {
        const isUp = data.change24h >= 0;
        priceEl.innerHTML = `
          ${formatCurrency(data.price)} 
          <span style="font-size:1rem;color:${isUp ? '#10b981' : '#ef4444'};">
            ${isUp ? '+' : ''}${data.change24h.toFixed(2)}%
          </span>`;
      }
    } else {
      data = await getMarketStockPrice(symbol);
      if (data) {
        const isUp = data.change >= 0;
        priceEl.innerHTML = `
          $${data.price.toFixed(2)} 
          <span style="font-size:1rem;color:${isUp ? '#10b981' : '#ef4444'};">
            ${isUp ? '+' : ''}${data.change.toFixed(2)}%
          </span>`;
      }
    }
  }

  // Load Chart Data
  async function loadChart(range) {
    loader.style.display = 'block';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let series;
    if (assetType === 'crypto') {
      const days = range === 'intraday' ? 1 : range === 'daily' ? 7 : 30;
      series = await getCoinHistory(symbol, days);
    } else {
      series = await getStockTimeSeries(symbol, range);
    }

    loader.style.display = 'none';

    if (series && series.length > 0) {
      const prices = series.map(d => d.price);
      const dates = series.map(d => d.date);

      drawLineChart(canvas, {
        data: prices,
        labels: dates,
        lineColor: prices[prices.length - 1] > prices[0] ? '#10b981' : '#ef4444',
        gradientStart: prices[prices.length - 1] > prices[0] ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        gradientEnd: 'rgba(0,0,0,0)',
        animate: true,
      });

      // Run AI Diagnosis once data is ready
      runAnalysis(prices);
    } else {
      loader.textContent = 'Data Limit Reached / Fetching...';
    }
  }

  async function runAnalysis(history) {
    const latestHistoryPrice = Number(history[history.length - 1]);
    const currentPrice = parseDisplayedPrice() ?? (Number.isFinite(latestHistoryPrice) ? latestHistoryPrice : null);
    const data = await getAIAssetVerdict(symbol, currentPrice, history.slice(-5), assetType);

    if (data) {
      verdictStatus.style.display = 'none';
      verdictResult.style.display = 'block';
      
      const badge = main.querySelector('#verdict-badge');
      const normalizedVerdict = String(data.verdict || 'SYSTEM CALIBRATING').toUpperCase();
      badge.textContent = normalizedVerdict;
      
      const colors = {
        BUY: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
        SELL: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
        HOLD: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
        'SYSTEM CALIBRATING': { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' }
      };
      
      const colorSet = colors[normalizedVerdict] || colors['SYSTEM CALIBRATING'];
      badge.style.background = colorSet.bg;
      badge.style.color = colorSet.text;
      
      const confidence = Number(data.confidence);
      main.querySelector('#verdict-confidence').textContent = `${Number.isFinite(confidence) ? confidence : 0}%`;
      main.querySelector('#verdict-reasoning').textContent = data.reasoning;

      const targetProfit = formatLevelValue(data.targetProfit ?? data.keyLevels?.[0]);
      const stopLoss = formatLevelValue(data.stopLoss ?? data.keyLevels?.[1]);
      renderVerdictLevel(main.querySelector('#verdict-level-1'), icons.trendUp, 'Target Profit', targetProfit);
      renderVerdictLevel(main.querySelector('#verdict-level-2'), icons.trendDown, 'Stop Loss', stopLoss);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      loadChart(e.target.dataset.range);
    });
  });

  fetchPrice();
  loadChart('intraday');
}
