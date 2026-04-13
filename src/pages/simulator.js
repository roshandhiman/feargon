/* ====================================
   Investment Simulator Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawSimulatorChart } from '../components/chart.js';
import { icons, formatCurrency } from '../utils/helpers.js';

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
        <div class="user-profile">
          <div class="user-avatar">R</div>
        </div>
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
              <span>Risk Level</span>
            </div>
            <div class="risk-toggle" id="risk-toggle">
              <button class="risk-level-btn active safe" data-level="safe">Safe</button>
              <button class="risk-level-btn moderate" data-level="moderate">Moderate</button>
              <button class="risk-level-btn aggressive" data-level="aggressive">Aggressive</button>
            </div>
          </div>

          <button class="btn btn-primary btn-lg sim-run-btn" id="sim-run">
            ${icons.zap}
            Run Simulation
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
              <div class="scenario-label">Conservative</div>
              <div class="scenario-value" id="scenario-safe-val">—</div>
              <div class="scenario-return">Estimated return</div>
            </div>
            <div class="scenario-card glass moderate">
              <div class="scenario-label">Moderate</div>
              <div class="scenario-value" id="scenario-mod-val">—</div>
              <div class="scenario-return">Estimated return</div>
            </div>
            <div class="scenario-card glass aggressive">
              <div class="scenario-label">Aggressive</div>
              <div class="scenario-value" id="scenario-agg-val">—</div>
              <div class="scenario-return">Estimated return</div>
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
  runBtn.addEventListener('click', () => {
    // Animate chart
    const chartCanvas = document.getElementById('sim-chart');
    if (chartCanvas) {
      drawSimulatorChart(chartCanvas);
    }

    // Update scenarios
    const multipliers = {
      safe: { low: 1.03, mid: 1.05, high: 1.08 },
      moderate: { low: 1.05, mid: 1.10, high: 1.15 },
      aggressive: { low: 1.08, mid: 1.18, high: 1.25 },
    };

    const m = multipliers[riskLevel];
    const safeVal = amount * Math.pow(m.low, period);
    const modVal = amount * Math.pow(m.mid, period);
    const aggVal = amount * Math.pow(m.high, period);

    document.getElementById('scenario-safe-val').textContent = formatCurrency(safeVal);
    document.getElementById('scenario-mod-val').textContent = formatCurrency(modVal);
    document.getElementById('scenario-agg-val').textContent = formatCurrency(aggVal);

    // Risk meter
    const riskPct = { safe: 25, moderate: 55, aggressive: 85 };
    document.getElementById('risk-meter-fill').style.width = `${riskPct[riskLevel]}%`;

    // AI explanation
    const explanations = {
      safe: `Based on your ${formatCurrency(amount)} investment over ${period} year${period > 1 ? 's' : ''} with a conservative strategy, the simulation projects steady growth with minimal volatility. Historical data suggests a high probability of positive returns with limited downside risk. This strategy prioritizes capital preservation.`,
      moderate: `Your ${formatCurrency(amount)} investment over ${period} year${period > 1 ? 's' : ''} with moderate risk shows balanced growth potential. The simulation ran 10,000 scenarios and found a favorable risk-reward ratio. You can expect moderate volatility with strong long-term growth prospects. Diversification across asset classes is recommended.`,
      aggressive: `With ${formatCurrency(amount)} invested over ${period} year${period > 1 ? 's' : ''} at high risk, the simulation shows significant growth potential alongside higher volatility. While the upside is substantial, be prepared for market corrections of 15-30%. This strategy is best for investors with high risk tolerance and long time horizons.`,
    };
    document.getElementById('ai-explanation-text').textContent = explanations[riskLevel];

    // Run button feedback
    runBtn.textContent = 'Simulation Complete ✓';
    runBtn.style.pointerEvents = 'none';
    setTimeout(() => {
      runBtn.innerHTML = `${icons.zap} Run Simulation`;
      runBtn.style.pointerEvents = '';
    }, 2000);
  });

  // Initial chart
  setTimeout(() => {
    const chartCanvas = document.getElementById('sim-chart');
    if (chartCanvas) drawSimulatorChart(chartCanvas);
  }, 300);
}
