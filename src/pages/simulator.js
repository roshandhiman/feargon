/* ====================================
   Investment Simulator Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawSimulatorChart } from '../components/chart.js';
import { icons, formatCurrency, debounce, renderUserProfile } from '../utils/helpers.js';
import { runAISimulation } from '../utils/gemini.js';
import { getStockHistory, getStockPrice, searchStocks } from '../services/yahoo.js';
import { getCoinHistory, getCoinPrice, getCryptoMarketData, getFallbackCryptoMarketData, resolveCoinId } from '../services/crypto.js';

export function renderSimulator(container) {
  container.innerHTML = '';

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
        <h1 class="top-navbar-title">Investment Simulator</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn">
          ${icons.bell}
        </button>
        ${renderUserProfile()}
      </div>
    </div>

    <div class="dashboard-content">
      <div class="glass" style="margin-bottom: var(--space-6); padding: var(--space-4); border-left: 4px solid var(--accent-yellow); background: rgba(245, 158, 11, 0.1);">
        <p style="color: var(--accent-yellow); font-weight: 600; font-size: var(--text-sm);">
          Beta Environment: Projections use recent market data and are for educational planning, not financial advice.
        </p>
      </div>
      <div class="simulator-layout">
        <!-- Input Panel -->
        <div class="sim-input-panel glass" id="sim-panel">
          <h2>Configure Simulation</h2>

          <div class="sim-field">
            <div class="sim-field-label">
              <span>Investment Amount</span>
              <span class="sim-field-value" id="amount-display">$10,000</span>
            </div>
            <input type="range" class="sim-slider" id="sim-amount" min="1000" max="100000" step="1000" value="10000" />
          </div>

          <div class="sim-field">
            <div class="sim-field-label">
              <span>Time Period</span>
            </div>
            <div class="period-options" id="period-options">
              <button class="period-option" data-period="1">1 Year</button>
              <button class="period-option active" data-period="3">3 Years</button>
              <button class="period-option" data-period="5">5 Years</button>
              <button class="period-option" data-period="10">10 Years</button>
              <button class="period-option" data-period="15">15 Years</button>
              <button class="period-option" data-period="20">20 Years</button>
            </div>
          </div>

          <div class="sim-field">
            <div class="sim-field-label">
              <span>Select Assets to Simulate</span>
            </div>
            <div class="asset-search-wrapper sim-asset-search-wrapper" style="position:relative;">
              <input type="text" class="market-search-input" id="asset-search" placeholder="Search Stocks or Crypto..." />
              <div id="asset-search-results" class="search-dropdown sim-search-dropdown" style="display:none; top: 100%; width: 100%;"></div>
            </div>
            <div id="selected-assets" class="selected-assets-chips" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;"></div>
          </div>

          <div class="sim-field">
            <div class="sim-field-label">
              <span>Risk Appetite</span>
            </div>
            <div class="risk-toggle" id="risk-toggle">
              <button class="risk-level-btn active safe" data-level="safe">Safe</button>
              <button class="risk-level-btn moderate" data-level="moderate">Moderate</button>
              <button class="risk-level-btn aggressive" data-level="aggressive">Aggressive</button>
            </div>
          </div>

          <button class="btn btn-primary btn-lg sim-run-btn" id="sim-run">
            ${icons.zap}
            Run AI Simulation
          </button>
        </div>

        <!-- Output -->
        <div class="sim-output">
          <!-- Chart -->
          <div class="sim-chart-card glass" id="sim-chart-card">
            <h3>Projected Growth</h3>
            <div class="sim-chart-container">
              <canvas class="sim-chart-canvas" id="sim-chart"></canvas>
            </div>
          </div>

          <!-- Scenario Cards -->
          <div class="scenario-cards" id="scenario-cards">
            <div class="scenario-card glass safe">
              <div class="scenario-label">Win Probability</div>
              <div class="scenario-value" id="sim-win-prob">—</div>
              <div class="scenario-return">Based on AI logic</div>
            </div>
            <div class="scenario-card glass moderate">
              <div class="scenario-label">Expected Return</div>
              <div class="scenario-value" id="sim-exp-return">—</div>
              <div class="scenario-return">Annual projection</div>
            </div>
            <div class="scenario-card glass aggressive">
              <div class="scenario-label">Risk Score</div>
              <div class="scenario-value" id="sim-risk-score">—</div>
              <div class="scenario-return">Volatility index</div>
            </div>
          </div>

          <!-- Risk Meter -->
          <div class="risk-meter-card glass" id="risk-meter-card">
            <h3>Risk Assessment</h3>
            <div class="risk-meter-bar">
              <div class="risk-meter-fill" id="risk-meter-fill" style="width:30%;"></div>
            </div>
            <div class="risk-meter-labels">
              <span>Low Risk</span>
              <span>Medium</span>
              <span>High Risk</span>
            </div>
          </div>

          <!-- AI Explanation -->
          <div class="ai-explanation-card glass" id="ai-explanation-card">
            <h3>
              ${icons.sparkles}
              AI Analysis
            </h3>
            <div class="ai-text-area" id="ai-explanation-text">
              Configure your simulation parameters and click "Run Simulation" to receive an AI-powered analysis of your investment strategy with detailed risk breakdown and recommendations.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // State
  let amount = 10000;
  let period = 3;
  let riskLevel = 'safe';
  let selectedAssets = [
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', id: 'bitcoin' },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' }
  ];
  let allCrypto = getFallbackCryptoMarketData();
  let currentSearchResults = [];

  // Fetch crypto for search
  getCryptoMarketData().then(data => { if (data?.length) allCrypto = data; });

  const selectedContainer = main.querySelector('#selected-assets');
  const searchInput = main.querySelector('#asset-search');
  const searchResults = main.querySelector('#asset-search-results');

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getAssetKey(asset) {
    return `${asset.type || 'stock'}:${asset.type === 'crypto' ? asset.id || resolveCoinId(asset.symbol) : asset.symbol}`.toLowerCase();
  }

  function normalizeAsset(asset) {
    const type = asset.type || 'stock';
    const symbol = String(asset.symbol || '').toUpperCase();
    return {
      symbol,
      name: asset.name || symbol,
      type,
      id: type === 'crypto' ? (asset.id || resolveCoinId(symbol)) : undefined,
    };
  }

  function addAsset(asset) {
    const normalized = normalizeAsset(asset);
    if (!selectedAssets.some(item => getAssetKey(item) === getAssetKey(normalized))) {
      selectedAssets.push(normalized);
      renderChips();
    }
    searchResults.style.display = 'none';
    searchInput.value = '';
  }

  function renderChips() {
    selectedContainer.innerHTML = selectedAssets.map(asset => `
      <div class="asset-chip glass-strong" style="padding: 6px 10px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 8px;">
        <span style="font-weight:700;">${escapeHTML(asset.symbol)}</span>
        <span style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">${escapeHTML(asset.type || 'stock')}</span>
        <button class="remove-asset" data-key="${getAssetKey(asset)}" title="Remove ${escapeHTML(asset.symbol)}" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:16px; line-height:1;">&times;</button>
      </div>
    `).join('');

    selectedContainer.querySelectorAll('.remove-asset').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAssets = selectedAssets.filter(a => getAssetKey(a) !== btn.dataset.key);
        renderChips();
      });
    });
  }

  renderChips();

  // Handle asset search
  const performSearch = debounce(async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.style.display = 'block';
    searchResults.innerHTML = `
      <div class="sim-search-state">Searching live markets...</div>
    `;

    const stocks = await searchStocks(trimmedQuery);
    const filteredCrypto = allCrypto.filter(c => 
      c.name.toLowerCase().includes(trimmedQuery.toLowerCase()) || 
      c.symbol.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(trimmedQuery.toLowerCase())
    ).slice(0, 5);

    const merged = [
      ...stocks.map(stock => normalizeAsset({ ...stock, type: 'stock' })),
      ...filteredCrypto.map(c => normalizeAsset({ symbol: c.symbol, name: c.name, type: 'crypto', id: c.id }))
    ].filter((item, index, arr) => arr.findIndex(candidate => getAssetKey(candidate) === getAssetKey(item)) === index);

    currentSearchResults = merged;

    if (merged.length > 0) {
      searchResults.style.display = 'block';
      searchResults.innerHTML = merged.map((item, index) => `
        <button type="button" class="search-dropdown-item sim-search-result add-asset-btn" data-index="${index}">
          <span class="sim-search-symbol">${escapeHTML(item.symbol)}</span>
          <span class="sim-search-name">${escapeHTML(item.name)}</span>
          <span class="sim-search-type">${escapeHTML(item.type)}</span>
          <span class="sim-search-add">Add</span>
        </button>
      `).join('');

      searchResults.querySelectorAll('.add-asset-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const asset = currentSearchResults[Number(btn.dataset.index)];
          if (asset) addAsset(asset);
        });
      });
    } else {
      searchResults.innerHTML = `
        <div class="sim-search-state">No matching assets found.</div>
      `;
    }
  }, 400);

  searchInput.addEventListener('input', (e) => performSearch(e.target.value));
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim() && currentSearchResults.length) {
      searchResults.style.display = 'block';
    }
  });

  const closeSearchOnOutsideClick = (event) => {
    if (!event.target.closest('.sim-asset-search-wrapper')) {
      searchResults.style.display = 'none';
    }
  };
  document.addEventListener('pointerdown', closeSearchOnOutsideClick);

  // Amount slider
  const amountSlider = main.querySelector('#sim-amount');
  const amountDisplay = main.querySelector('#amount-display');
  amountSlider.addEventListener('input', (e) => {
    amount = parseInt(e.target.value);
    amountDisplay.textContent = formatCurrency(amount);
  });

  // Period selection
  const periodBtns = main.querySelectorAll('.period-option');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      period = parseInt(btn.dataset.period);
    });
  });

  // Risk level
  const riskBtns = main.querySelectorAll('.risk-level-btn');
  riskBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      riskBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      riskLevel = btn.dataset.level;
    });
  });

  // Run simulation
  const runBtn = main.querySelector('#sim-run');
  const winProbEl = main.querySelector('#sim-win-prob');
  const expReturnEl = main.querySelector('#sim-exp-return');
  const riskScoreEl = main.querySelector('#sim-risk-score');
  const aiTextEl = main.querySelector('#ai-explanation-text');
  const riskMeterFill = main.querySelector('#risk-meter-fill');

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getDailyReturns(history) {
    const prices = history.map(point => Number(point.price)).filter(Number.isFinite);
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] > 0) returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  function getAverage(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function getStdDev(values) {
    if (values.length < 2) return 0;
    const average = getAverage(values);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  function buildProjectionSeries(startAmount, years, annualReturn, annualVolatility, seed = 1) {
    const pointCount = Math.max(13, Math.min(121, years * 12 + 1));
    return Array.from({ length: pointCount }, (_, index) => {
      const t = index / Math.max(1, pointCount - 1);
      const trend = startAmount * Math.pow(1 + annualReturn, t * years);
      const wave = Math.sin(t * Math.PI * years * 2 + seed) * annualVolatility * 0.055;
      const drawdown = Math.cos(t * Math.PI * years * 3 + seed * 0.7) * annualVolatility * 0.025;
      return Math.max(startAmount * 0.2, trend * (1 + wave + drawdown));
    });
  }

  async function fetchAssetProfile(asset) {
    const normalized = normalizeAsset(asset);
    if (normalized.type === 'crypto') {
      const coinId = normalized.id || resolveCoinId(normalized.symbol);
      const [priceData, history] = await Promise.all([
        getCoinPrice(coinId),
        getCoinHistory(coinId, 30),
      ]);
      const prices = (history || []).map(point => Number(point.price)).filter(Number.isFinite);
      const latestPrice = priceData?.price || prices[prices.length - 1] || 0;
      const firstPrice = prices[0] || latestPrice;
      const change24h = Number.isFinite(priceData?.change24h)
        ? priceData.change24h
        : (firstPrice ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0);
      return { ...normalized, price: latestPrice, change24h, history: history || [] };
    }

    const [priceData, history] = await Promise.all([
      getStockPrice(normalized.symbol),
      getStockHistory(normalized.symbol, 30),
    ]);
    const prices = (history || []).map(point => Number(point.price)).filter(Number.isFinite);
    const latestPrice = priceData?.price || prices[prices.length - 1] || 0;
    const firstPrice = prices[0] || latestPrice;
    const change24h = Number.isFinite(priceData?.change)
      ? priceData.change
      : (firstPrice ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0);
    return { ...normalized, price: latestPrice, change24h, history: history || [] };
  }

  function buildPortfolioProjection(assetProfiles) {
    const weightedStats = assetProfiles.map((asset, index) => {
      const prices = asset.history.map(point => Number(point.price)).filter(Number.isFinite);
      const firstPrice = prices[0] || asset.price || 1;
      const lastPrice = prices[prices.length - 1] || asset.price || firstPrice;
      const historicalReturn30d = firstPrice ? (lastPrice - firstPrice) / firstPrice : 0;
      const returns = getDailyReturns(asset.history);
      const annualVolatility = clamp(getStdDev(returns) * Math.sqrt(252), asset.type === 'crypto' ? 0.28 : 0.08, asset.type === 'crypto' ? 1.4 : 0.75);
      return {
        ...asset,
        weight: 1 / assetProfiles.length,
        historicalReturn30d,
        annualVolatility,
        seed: index + 1 + asset.symbol.charCodeAt(0),
      };
    });

    const historicalReturn30d = getAverage(weightedStats.map(asset => asset.historicalReturn30d));
    const annualVolatility = clamp(getAverage(weightedStats.map(asset => asset.annualVolatility)), 0.06, 1.4);
    const cryptoShare = weightedStats.filter(asset => asset.type === 'crypto').length / weightedStats.length;
    const momentumAnnualReturn = clamp(0.045 + historicalReturn30d * 4 + getAverage(weightedStats.map(asset => (asset.change24h || 0) / 100)) * 0.35, -0.35, 0.85);

    const scenarioConfig = {
      safe: {
        label: 'Safe',
        color: '#10b981',
        expectedAnnualReturn: clamp(momentumAnnualReturn * 0.55 + 0.025, -0.18, 0.32),
        annualVolatility: clamp(annualVolatility * 0.55, 0.05, 0.55),
      },
      moderate: {
        label: 'Moderate',
        color: '#f59e0b',
        expectedAnnualReturn: clamp(momentumAnnualReturn, -0.3, 0.7),
        annualVolatility: clamp(annualVolatility, 0.08, 0.95),
      },
      aggressive: {
        label: 'Aggressive',
        color: '#ef4444',
        expectedAnnualReturn: clamp(momentumAnnualReturn * 1.35 + cryptoShare * 0.04, -0.45, 1.05),
        annualVolatility: clamp(annualVolatility * 1.35 + cryptoShare * 0.08, 0.15, 1.35),
      },
    };

    const scenarios = Object.fromEntries(Object.entries(scenarioConfig).map(([key, scenario], index) => [
      key,
      {
        ...scenario,
        data: buildProjectionSeries(amount, period, scenario.expectedAnnualReturn, scenario.annualVolatility, index + 1),
      }
    ]));

    const activeScenario = scenarios[riskLevel] || scenarios.moderate;
    const riskScore = Math.round(clamp(activeScenario.annualVolatility * 78 + cryptoShare * 18 + Math.max(0, -activeScenario.expectedAnnualReturn) * 35, 5, 95));
    const expectedReturn = Number((activeScenario.expectedAnnualReturn * 100).toFixed(1));
    const winProbability = Math.round(clamp(74 + expectedReturn * 0.35 - riskScore * 0.32, 25, 94));

    return {
      scenarios,
      metrics: {
        riskLevel,
        assetCount: assetProfiles.length,
        cryptoShare: Number(cryptoShare.toFixed(2)),
        historicalReturn30d: Number((historicalReturn30d * 100).toFixed(2)),
        annualVolatility: Number(activeScenario.annualVolatility.toFixed(3)),
        expectedAnnualReturn: Number(activeScenario.expectedAnnualReturn.toFixed(3)),
        expectedReturn,
        riskScore,
        winProbability,
        lossProbability: 100 - winProbability,
        assets: weightedStats.map(asset => ({
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          price: Number((asset.price || 0).toFixed(2)),
          change24h: Number((asset.change24h || 0).toFixed(2)),
          return30d: Number((asset.historicalReturn30d * 100).toFixed(2)),
          annualVolatility: Number((asset.annualVolatility * 100).toFixed(1)),
        })),
      }
    };
  }

  function normalizeSimulationResult(aiResult, projection) {
    const metrics = projection.metrics;
    const riskScore = Math.round(clamp(Number(aiResult?.riskScore ?? metrics.riskScore), 0, 100));
    const expectedReturn = Number(clamp(Number(aiResult?.expectedReturn ?? metrics.expectedReturn), -80, 150).toFixed(1));
    const winProbability = Math.round(clamp(Number(aiResult?.winProbability ?? (100 - (aiResult?.lossProbability ?? metrics.lossProbability))), 0, 100));
    const recommendations = Array.isArray(aiResult?.recommendations) && aiResult.recommendations.length
      ? aiResult.recommendations.slice(0, 3)
      : ["Keep allocations diversified", "Re-check projections after major price moves", "Use staged entries for volatile assets"];

    return {
      riskScore,
      expectedReturn,
      winProbability,
      lossProbability: 100 - winProbability,
      analysisBrief: aiResult?.analysisBrief || `Recent data for ${metrics.assetCount} selected assets implies an annualized ${expectedReturn}% projected return at ${riskScore}/100 risk. The projection is calibrated from 30-day trend and volatility.`,
      recommendations,
    };
  }

  function updateRiskMeter(score) {
    riskMeterFill.style.width = '0%';
    requestAnimationFrame(() => {
      riskMeterFill.style.width = `${clamp(score, 0, 100)}%`;
    });
  }

  runBtn.addEventListener('click', async () => {
    if (selectedAssets.length === 0) {
      alert("Please add at least one asset to simulate.");
      return;
    }

    runBtn.innerHTML = `<span class="loading-spinner"></span> Fetching Market Data...`;
    runBtn.classList.add('loading');
    runBtn.style.pointerEvents = 'none';
    winProbEl.textContent = '...';
    expReturnEl.textContent = '...';
    riskScoreEl.textContent = '...';
    aiTextEl.textContent = 'Fetching recent prices and 30-day history for the selected assets...';

    try {
      const assetProfiles = await Promise.all(selectedAssets.map(fetchAssetProfile));
      const projection = buildPortfolioProjection(assetProfiles);

      const chartCanvas = document.getElementById('sim-chart');
      if (chartCanvas) {
        drawSimulatorChart(chartCanvas, {
          amount,
          period,
          scenarios: projection.scenarios,
          activeRisk: riskLevel,
        });
      }

      winProbEl.textContent = `${projection.metrics.winProbability}%`;
      expReturnEl.textContent = `${projection.metrics.expectedReturn}%`;
      riskScoreEl.textContent = `${projection.metrics.riskScore}/100`;
      updateRiskMeter(projection.metrics.riskScore);

      runBtn.innerHTML = `<span class="loading-spinner"></span> Generating AI Analysis...`;
      const assetSummaries = projection.metrics.assets.map(asset =>
        `${asset.symbol} (${asset.type}, ${asset.change24h}% 24h, ${asset.return30d}% 30d)`
      );
      const aiResult = await runAISimulation(assetSummaries, amount, period, projection.metrics);
      const result = normalizeSimulationResult(aiResult, projection);

      winProbEl.textContent = `${result.winProbability}%`;
      expReturnEl.textContent = `${result.expectedReturn}%`;
      riskScoreEl.textContent = `${result.riskScore}/100`;
      updateRiskMeter(result.riskScore);

      aiTextEl.innerHTML = `
        <p class="mb-4">${escapeHTML(result.analysisBrief)}</p>
        <div style="background: var(--bg-overlay-subtle); padding: 12px; border-radius: 8px;">
          <h4 style="font-size: 13px; margin-bottom: 8px; color: var(--accent-purple);">Recommendations:</h4>
          <ul style="list-style: disc; margin-left: 20px; font-size: 13px; color: var(--text-secondary);">
            ${result.recommendations.map(r => `<li class="mb-1">${escapeHTML(r)}</li>`).join('')}
          </ul>
        </div>
      `;
    } catch (error) {
      console.error('Simulation run failed:', error);
      aiTextEl.textContent = 'Unable to complete the simulation. Please check the console/backend logs and try again.';
      winProbEl.textContent = '—';
      expReturnEl.textContent = '—';
      riskScoreEl.textContent = '—';
    }

    // Run button feedback
    runBtn.innerHTML = `Simulation Complete`;
    setTimeout(() => {
      runBtn.innerHTML = `${icons.zap} Run AI Simulation`;
      runBtn.style.pointerEvents = '';
      runBtn.classList.remove('loading');
    }, 3000);
  });

  // Initial chart
  setTimeout(() => {
    const chartCanvas = document.getElementById('sim-chart');
    if (chartCanvas) drawSimulatorChart(chartCanvas, { amount, period, activeRisk: riskLevel });
  }, 300);

  return () => {
    document.removeEventListener('pointerdown', closeSearchOnOutsideClick);
  };
}
