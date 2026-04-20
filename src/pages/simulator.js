/* ====================================
   Investment Simulator Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawSimulatorChart } from '../components/chart.js';
import { icons, formatCurrency, debounce, renderUserProfile } from '../utils/helpers.js';
import { runAISimulation } from '../utils/gemini.js';
import { searchStocks } from '../services/yahoo.js';
import { getCryptoMarketData } from '../services/crypto.js';

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
          ⚠️ Beta Environment: This is a demo version. Complete real-world bridging will be shipped soon!
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
            <div class="asset-search-wrapper" style="position:relative;">
              <input type="text" class="market-search-input" id="asset-search" placeholder="Search Stocks or Crypto..." />
              <div id="asset-search-results" class="search-dropdown" style="display:none; top: 100%; width: 100%;"></div>
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
  let selectedAssets = [{ symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'AAPL', name: 'Apple Inc.' }];
  let allCrypto = [];

  // Fetch crypto for search
  getCryptoMarketData().then(data => { if(data) allCrypto = data; });

  const selectedContainer = main.querySelector('#selected-assets');
  const searchInput = main.querySelector('#asset-search');
  const searchResults = main.querySelector('#asset-search-results');

  function renderChips() {
    selectedContainer.innerHTML = selectedAssets.map(asset => `
      <div class="asset-chip glass-strong" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 8px;">
        <span>${asset.symbol}</span>
        <button class="remove-asset" data-symbol="${asset.symbol}" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer;">&times;</button>
      </div>
    `).join('');

    selectedContainer.querySelectorAll('.remove-asset').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAssets = selectedAssets.filter(a => a.symbol !== btn.dataset.symbol);
        renderChips();
      });
    });
  }

  renderChips();

  // Handle asset search
  const performSearch = debounce(async (query) => {
    if (!query) {
      searchResults.style.display = 'none';
      return;
    }

    const stocks = await searchStocks(query);
    const filteredCrypto = allCrypto.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      c.symbol.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    const merged = [...stocks, ...filteredCrypto.map(c => ({ symbol: c.symbol, name: c.name }))];

    if (merged.length > 0) {
      searchResults.style.display = 'block';
      searchResults.innerHTML = merged.map(item => `
        <div class="search-dropdown-item add-asset-btn" data-symbol="${item.symbol}" data-name="${item.name}">
          <span>${item.symbol}</span>
          <span style="font-size:10px; color:var(--text-tertiary); margin-left:8px;">${item.name}</span>
        </div>
      `).join('');

      searchResults.querySelectorAll('.add-asset-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevent input blur from hiding results before click
          const sym = btn.dataset.symbol;
          if (!selectedAssets.find(a => a.symbol === sym)) {
            selectedAssets.push({ symbol: sym, name: btn.dataset.name });
            renderChips();
          }
          searchResults.style.display = 'none';
          searchInput.value = '';
        });
      });
    } else {
      searchResults.style.display = 'none';
    }
  }, 400);

  searchInput.addEventListener('input', (e) => performSearch(e.target.value));

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

  runBtn.addEventListener('click', async () => {
    if (selectedAssets.length === 0) {
      alert("Please add at least one asset to simulate.");
      return;
    }

    runBtn.innerHTML = `<span class="loading-spinner"></span> Generating AI Analysis...`;
    runBtn.classList.add('loading');
    runBtn.style.pointerEvents = 'none';

    // Animate chart
    const chartCanvas = document.getElementById('sim-chart');
    if (chartCanvas) drawSimulatorChart(chartCanvas);

    // AI Call
    const assetSymbols = selectedAssets.map(a => a.symbol);
    const aiResult = await runAISimulation(assetSymbols, amount, period);

    if (aiResult) {
      winProbEl.textContent = `${100 - aiResult.lossProbability}%`;
      expReturnEl.textContent = `${aiResult.expectedReturn}%`;
      riskScoreEl.textContent = `${aiResult.riskScore}/100`;
      
      aiTextEl.innerHTML = `
        <p class="mb-4">${aiResult.analysisBrief}</p>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
          <h4 style="font-size: 13px; margin-bottom: 8px; color: var(--accent-purple);">Recommendations:</h4>
          <ul style="list-style: disc; margin-left: 20px; font-size: 13px; color: var(--text-secondary);">
            ${aiResult.recommendations.map(r => `<li class="mb-1">${r}</li>`).join('')}
          </ul>
        </div>
      `;

      // Update risk meter
      document.getElementById('risk-meter-fill').style.width = `${aiResult.riskScore}%`;
    }

    // Run button feedback
    runBtn.innerHTML = `Simulation Complete ✓`;
    setTimeout(() => {
      runBtn.innerHTML = `${icons.zap} Run AI Simulation`;
      runBtn.style.pointerEvents = '';
      runBtn.classList.remove('loading');
    }, 3000);
  });

  // Initial chart
  setTimeout(() => {
    const chartCanvas = document.getElementById('sim-chart');
    if (chartCanvas) drawSimulatorChart(chartCanvas);
  }, 300);
}
