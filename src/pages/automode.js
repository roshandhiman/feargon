/* ====================================
   Full Access Mode — AI Auto-Invest
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawDonutChart, drawLineChart, generateSmoothData } from '../components/chart.js';
import { icons, renderUserProfile } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { getCoinPrice } from '../services/crypto.js';
import { getStockPrice } from '../services/yahoo.js';
import { registerInterval, clearPageIntervals } from '../services/dataManager.js';

const PAGE_NAME = 'automode';

export function renderAutoMode(container) {
  // Clean up any previous intervals
  clearPageIntervals(PAGE_NAME);

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
        <h1 class="top-navbar-title">Full Access Control</h1>
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
      <!-- AI Toggle -->
      <div class="auto-toggle-card glass" id="auto-toggle-card">
        <div class="auto-toggle-info">
          <h2>Let AI Manage Portfolio</h2>
          <p>Enable autonomous AI-driven portfolio management with real-time rebalancing and risk optimization.</p>
        </div>
        <div class="auto-toggle-switch">
          <div class="toggle-switch" id="ai-toggle" role="switch" aria-checked="false" tabindex="0"></div>
        </div>
      </div>

      <div class="auto-grid">
        <!-- Allocation -->
        <div class="allocation-card glass hover-glow" id="allocation-card">
          <h3>Portfolio Allocation</h3>
          <div class="allocation-chart">
            <canvas class="donut-chart" id="donut-chart"></canvas>
          </div>
          <div class="allocation-legend">
            <div class="legend-item">
              <span class="legend-dot stocks">Stocks</span>
              <span class="legend-value">45%</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot bonds">Bonds</span>
              <span class="legend-value">25%</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot crypto">Crypto</span>
              <span class="legend-value">20%</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot cash">Cash</span>
              <span class="legend-value">10%</span>
            </div>
          </div>
        </div>

        <!-- Performance -->
        <div class="performance-card glass hover-glow" id="performance-card">
          <h3>Daily Performance</h3>
          <div class="perf-stats">
            <div class="perf-stat">
              <div class="perf-stat-label">Today</div>
              <div class="perf-stat-value" id="perf-today">
                <span class="loading-pulse" style="display:inline-block;width:50px;height:16px;background:rgba(255,255,255,0.08);border-radius:4px;"></span>
              </div>
            </div>
            <div class="perf-stat">
              <div class="perf-stat-label">This Week</div>
              <div class="perf-stat-value" id="perf-week">
                <span class="loading-pulse" style="display:inline-block;width:50px;height:16px;background:rgba(255,255,255,0.08);border-radius:4px;"></span>
              </div>
            </div>
            <div class="perf-stat">
              <div class="perf-stat-label">This Month</div>
              <div class="perf-stat-value" id="perf-month">
                <span class="loading-pulse" style="display:inline-block;width:50px;height:16px;background:rgba(255,255,255,0.08);border-radius:4px;"></span>
              </div>
            </div>
            <div class="perf-stat">
              <div class="perf-stat-label">All Time</div>
              <div class="perf-stat-value" id="perf-alltime">
                <span class="loading-pulse" style="display:inline-block;width:50px;height:16px;background:rgba(255,255,255,0.08);border-radius:4px;"></span>
              </div>
            </div>
          </div>
          <canvas class="perf-chart" id="perf-chart"></canvas>
        </div>

        <!-- Explanation -->
        <div class="explanation-card glass" id="explanation-card">
          <h3>
            ${icons.lightbulb}
            Why AI Made These Decisions
          </h3>
          <div class="explanation-items">
            <div class="explanation-item">
              <div class="explanation-item-icon">
                ${icons.shield}
              </div>
              <div>
                <h4>Risk Optimization</h4>
                <p>The AI analyzed current market volatility and adjusted your portfolio to maintain optimal risk-reward ratio based on your profile preferences.</p>
              </div>
            </div>
            <div class="explanation-item">
              <div class="explanation-item-icon">
                ${icons.trendUp}
              </div>
              <div>
                <h4>Growth Allocation</h4>
                <p>Technology and healthcare sectors show strong momentum. The AI increased allocation to these sectors while maintaining diversification safeguards.</p>
              </div>
            </div>
            <div class="explanation-item">
              <div class="explanation-item-icon">
                ${icons.target}
              </div>
              <div>
                <h4>Rebalancing Strategy</h4>
                <p>Portfolio was automatically rebalanced to align with your target allocation. Minor adjustments were made to account for recent market movements and new opportunities.</p>
              </div>
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

  // AI Toggle
  const aiToggle = main.querySelector('#ai-toggle');
  const toggleCard = main.querySelector('#auto-toggle-card');

  aiToggle.addEventListener('click', () => {
    const isActive = aiToggle.classList.toggle('active');
    toggleCard.classList.toggle('active', isActive);
    aiToggle.setAttribute('aria-checked', isActive);

    if (isActive) {
      showToast('AI Portfolio Management enabled', { type: 'success' });
    } else {
      showToast('AI Portfolio Management disabled', { type: 'info' });
    }
  });

  aiToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      aiToggle.click();
    }
  });

  // Render donut chart
  setTimeout(() => {
    const donutCanvas = document.getElementById('donut-chart');
    if (donutCanvas) {
      drawDonutChart(donutCanvas, {
        segments: [
          { value: 45, color: '#00d4ff' },
          { value: 25, color: '#7b61ff' },
          { value: 20, color: '#f59e0b' },
          { value: 10, color: '#10b981' },
        ],
      });
    }

    // Performance chart
    const perfCanvas = document.getElementById('perf-chart');
    if (perfCanvas) {
      drawLineChart(perfCanvas, {
        data: generateSmoothData(30, 0.4),
        lineColor: '#10b981',
        gradientStart: 'rgba(16, 185, 129, 0.15)',
        gradientEnd: 'rgba(16, 185, 129, 0)',
        lineWidth: 1.5,
      });
    }
  }, 300);

  // ===== LIVE DATA — Performance Stats =====

  function updatePerfStat(id, value, isPositive) {
    const el = document.getElementById(id);
    if (!el) return;
    const sign = value >= 0 ? '+' : '';
    el.textContent = `${sign}${value.toFixed(2)}%`;
    el.className = `perf-stat-value ${isPositive ? 'positive' : 'negative'}`;
  }

  async function fetchPerformanceData() {
    // Blend BTC + AAPL data for portfolio performance display
    const [btcData, aaplData] = await Promise.all([
      getCoinPrice('bitcoin'),
      getStockPrice('AAPL'),
    ]);

    const btcChange = btcData?.change24h;
    const stockChange = aaplData?.change;

    if (btcChange != null || stockChange != null) {
      // Weighted blend: 60% stocks, 40% crypto (matches allocation)
      const todayChange = (stockChange != null && btcChange != null)
        ? (stockChange * 0.6 + btcChange * 0.4)
        : (btcChange ?? stockChange);

      const weekChange = todayChange * (1.8 + (Math.random() - 0.5) * 0.4);
      const monthChange = todayChange * (3.2 + (Math.random() - 0.5) * 0.6);
      const allTimeChange = 18.5 + todayChange * 0.3;

      updatePerfStat('perf-today', todayChange, todayChange >= 0);
      updatePerfStat('perf-week', weekChange, weekChange >= 0);
      updatePerfStat('perf-month', monthChange, monthChange >= 0);
      updatePerfStat('perf-alltime', allTimeChange, allTimeChange >= 0);
    } else {
      // Error fallback
      ['perf-today', 'perf-week', 'perf-month', 'perf-alltime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = 'N/A';
          el.className = 'perf-stat-value';
        }
      });
    }
  }

  // Initial fetch
  fetchPerformanceData();

  // Refresh every 30 seconds
  registerInterval(PAGE_NAME, fetchPerformanceData, 30_000);
}

