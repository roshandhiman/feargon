/* ====================================
   Dashboard Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { createGauge } from '../components/gauge.js';
import { drawLineChart, generateSmoothData } from '../components/chart.js';
import { icons, formatCurrency } from '../utils/helpers.js';

export function renderDashboard(container) {
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
        <button class="notification-btn" id="btn-notifications">
          ${icons.bell}
          <span class="notification-dot"></span>
        </button>
        <div class="user-profile" id="user-profile">
          <div class="user-avatar">U</div>
          <div>
            <div class="user-name">User</div>
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
                <div class="portfolio-label">Total Portfolio Value</div>
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

          <!-- Activity -->
          <div class="activity-card glass" style="margin-top:var(--space-6);">
            <h3>Recent Activity</h3>
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>No recent activity yet. Start by exploring the market or running a simulation.</p>
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
                <span style="font-size:var(--text-sm);font-weight:600;">S&P 500</span>
                <span style="font-size:var(--text-sm);color:var(--accent-green);font-weight:600;">—</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
                <span style="font-size:var(--text-sm);font-weight:600;">NASDAQ</span>
                <span style="font-size:var(--text-sm);color:var(--accent-green);font-weight:600;">—</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
                <span style="font-size:var(--text-sm);font-weight:600;">BTC</span>
                <span style="font-size:var(--text-sm);color:var(--accent-red);font-weight:600;">—</span>
              </div>
            </div>
          </div>

          <!-- AI Insight -->
          <div class="risk-card glass hover-glow" id="ai-insight-card">
            <h3 style="display:flex;align-items:center;gap:var(--space-2);">
              ${icons.sparkles}
              AI Insight
            </h3>
            <div class="ai-text-area" style="margin-top:var(--space-4);">
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

  // Render gauge
  const gaugeContainer = main.querySelector('#gauge-container');
  gaugeContainer.appendChild(createGauge({ value: 72, label: 'Confidence Score' }));

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
}
