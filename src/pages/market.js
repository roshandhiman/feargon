/* ====================================
   Market Explorer Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawSparkline, generateSmoothData } from '../components/chart.js';
import { icons } from '../utils/helpers.js';

const stockAssets = [
  { name: 'Apple Inc.', symbol: 'AAPL', color: '#a855f7' },
  { name: 'Microsoft Corp.', symbol: 'MSFT', color: '#3b82f6' },
  { name: 'Alphabet Inc.', symbol: 'GOOGL', color: '#10b981' },
  { name: 'Amazon.com Inc.', symbol: 'AMZN', color: '#f59e0b' },
  { name: 'NVIDIA Corp.', symbol: 'NVDA', color: '#00d4ff' },
  { name: 'Tesla Inc.', symbol: 'TSLA', color: '#ef4444' },
  { name: 'Meta Platforms', symbol: 'META', color: '#3b82f6' },
  { name: 'Netflix Inc.', symbol: 'NFLX', color: '#ef4444' },
];

const cryptoAssets = [
  { name: 'Bitcoin', symbol: 'BTC', color: '#f59e0b' },
  { name: 'Ethereum', symbol: 'ETH', color: '#7b61ff' },
  { name: 'Solana', symbol: 'SOL', color: '#00d4ff' },
  { name: 'Cardano', symbol: 'ADA', color: '#3b82f6' },
  { name: 'Polkadot', symbol: 'DOT', color: '#ec4899' },
  { name: 'Chainlink', symbol: 'LINK', color: '#3b82f6' },
];

export function renderMarket(container) {
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
        <h1 class="top-navbar-title">Market Explorer</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn" id="btn-notifications">
          ${icons.bell}
        </button>
        <div class="user-profile">
          <div class="user-avatar">U</div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="market-header">
        <div class="market-search">
          <span class="market-search-icon">${icons.search}</span>
          <input type="text" class="market-search-input" placeholder="Search assets..." id="market-search-input" />
        </div>

        <div class="market-controls">
          <div class="market-tabs" id="market-tabs">
            <button class="market-tab active" data-tab="stocks" id="tab-stocks">Stocks</button>
            <button class="market-tab" data-tab="crypto" id="tab-crypto">Crypto</button>
          </div>
          <div class="market-filters">
            <select class="filter-select" id="filter-sort">
              <option>Sort by Name</option>
              <option>Sort by Change</option>
              <option>Sort by Volume</option>
            </select>
          </div>
        </div>
      </div>

      <div class="asset-grid" id="asset-grid">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // State
  let activeTab = 'stocks';

  function renderAssets(assets, searchTerm = '') {
    const grid = main.querySelector('#asset-grid');
    const filtered = assets.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    grid.innerHTML = filtered.map((asset, i) => `
      <div class="asset-card glass hover-lift" data-index="${i}" style="animation-delay:${i * 50}ms;">
        <div class="asset-card-header">
          <div class="asset-info">
            <div class="asset-icon" style="background:${asset.color}20; color:${asset.color};">
              ${asset.symbol.slice(0, 2)}
            </div>
            <div>
              <div class="asset-name">${asset.name}</div>
              <div class="asset-symbol">${asset.symbol}</div>
            </div>
          </div>
          <div class="asset-price">
            <div class="asset-price-value">—</div>
            <div class="asset-price-change positive">—</div>
          </div>
        </div>
        <canvas class="asset-sparkline" id="sparkline-${asset.symbol}"></canvas>
      </div>
    `).join('');

    // Draw sparklines
    requestAnimationFrame(() => {
      filtered.forEach(asset => {
        const canvas = document.getElementById(`sparkline-${asset.symbol}`);
        if (canvas) {
          const data = generateSmoothData(20, 0.6);
          const isUp = data[data.length - 1] > data[0];
          drawSparkline(canvas, {
            data,
            color: isUp ? '#10b981' : '#ef4444',
          });
        }
      });
    });
  }

  // Initial render
  renderAssets(stockAssets);

  // Tab switching
  const tabs = main.querySelectorAll('.market-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      const search = main.querySelector('#market-search-input').value;
      renderAssets(activeTab === 'stocks' ? stockAssets : cryptoAssets, search);
    });
  });

  // Search
  const searchInput = main.querySelector('#market-search-input');
  searchInput.addEventListener('input', (e) => {
    const assets = activeTab === 'stocks' ? stockAssets : cryptoAssets;
    renderAssets(assets, e.target.value);
  });
}
