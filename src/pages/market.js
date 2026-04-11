/* ====================================
   Market Explorer Page
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { drawSparkline, generateSmoothData } from '../components/chart.js';
import { icons, formatCurrency, debounce } from '../utils/helpers.js';
import { getCryptoMarketData } from '../services/crypto.js';
import { searchStocks, getStockPrice } from '../services/yahoo.js';
import { registerInterval, clearPageIntervals, getCachedData, setCachedData, isCacheValid } from '../services/dataManager.js';

const PAGE_NAME = 'market';

const cryptoAssets = [
  { name: 'Bitcoin', symbol: 'BTC', color: '#f59e0b' },
  { name: 'Ethereum', symbol: 'ETH', color: '#7b61ff' },
  { name: 'Solana', symbol: 'SOL', color: '#00d4ff' },
  { name: 'Cardano', symbol: 'ADA', color: '#3b82f6' },
  { name: 'Polkadot', symbol: 'DOT', color: '#ec4899' },
  { name: 'Chainlink', symbol: 'LINK', color: '#3b82f6' },
];

// Color palette for dynamically searched stocks
const STOCK_COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#00d4ff', '#ef4444', '#ec4899', '#7b61ff'];

export function renderMarket(container) {
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
        <div class="market-search" style="position:relative;">
          <span class="market-search-icon">${icons.search}</span>
          <input type="text" class="market-search-input" placeholder="Search stocks (e.g. AAPL, Tesla)..." id="market-search-input" />
          <div class="search-dropdown" id="search-dropdown" style="display:none;"></div>
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
  let cryptoData = null;       // CoinGecko data map
  let stockResults = [];       // Currently displayed stock cards (from search/click)

  // ===== RENDER FUNCTIONS =====

  function showLoadingGrid(count = 5) {
    const grid = main.querySelector('#asset-grid');
    grid.innerHTML = Array(count).fill(0).map((_, i) => `
      <div class="asset-card glass" style="animation-delay:${i * 50}ms;">
        <div class="asset-card-header">
          <div class="asset-info">
            <div class="asset-icon" style="background:rgba(255,255,255,0.05);">
              <span class="loading-pulse" style="display:inline-block;width:24px;height:12px;border-radius:4px;background:rgba(255,255,255,0.1);"></span>
            </div>
            <div>
              <div class="asset-name loading-pulse" style="width:80px;height:14px;background:rgba(255,255,255,0.08);border-radius:4px;"></div>
              <div class="asset-symbol loading-pulse" style="width:40px;height:10px;background:rgba(255,255,255,0.05);border-radius:4px;margin-top:4px;"></div>
            </div>
          </div>
          <div class="asset-price">
            <div class="asset-price-value loading-pulse" style="width:60px;height:14px;background:rgba(255,255,255,0.08);border-radius:4px;"></div>
            <div class="asset-price-change loading-pulse" style="width:40px;height:10px;background:rgba(255,255,255,0.05);border-radius:4px;margin-top:4px;"></div>
          </div>
        </div>
        <canvas class="asset-sparkline" style="opacity:0.3;"></canvas>
      </div>
    `).join('');
  }

  function renderStockCards(stocks) {
    const grid = main.querySelector('#asset-grid');

    if (!stocks || stocks.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-tertiary);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 1rem;opacity:0.3;">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Search for stocks above to see live market data</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = stocks.map((stock, i) => {
      const color = STOCK_COLORS[i % STOCK_COLORS.length];
      const priceText = stock.price != null ? formatCurrency(stock.price) : '—';
      const changeVal = stock.change;
      const changeText = changeVal != null
        ? `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)}%`
        : '—';
      const changeClass = changeVal != null
        ? (changeVal >= 0 ? 'positive' : 'negative')
        : '';

      return `
        <div class="asset-card glass hover-lift" style="animation-delay:${i * 50}ms;">
          <div class="asset-card-header">
            <div class="asset-info">
              <div class="asset-icon" style="background:${color}20; color:${color};">
                ${stock.symbol.slice(0, 2)}
              </div>
              <div>
                <div class="asset-name">${stock.name || stock.symbol}</div>
                <div class="asset-symbol">${stock.symbol}</div>
              </div>
            </div>
            <div class="asset-price">
              <div class="asset-price-value">${priceText}</div>
              <div class="asset-price-change ${changeClass}">${changeText}</div>
            </div>
          </div>
          <canvas class="asset-sparkline" id="sparkline-stock-${stock.symbol}"></canvas>
        </div>
      `;
    }).join('');

    // Draw sparklines (generated, since Yahoo doesn't give sparkline data in the chart endpoint easily)
    requestAnimationFrame(() => {
      stocks.forEach(stock => {
        const canvas = document.getElementById(`sparkline-stock-${stock.symbol}`);
        if (canvas) {
          const data = generateSmoothData(20, 0.6);
          const isUp = stock.change != null ? stock.change >= 0 : data[data.length - 1] > data[0];
          drawSparkline(canvas, {
            data,
            color: isUp ? '#10b981' : '#ef4444',
          });
        }
      });
    });
  }

  function renderCryptoAssets(assets, liveDataMap, searchTerm = '') {
    const grid = main.querySelector('#asset-grid');
    const filtered = assets.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    grid.innerHTML = filtered.map((asset, i) => {
      const live = liveDataMap ? liveDataMap[asset.symbol] : null;
      const priceText = live ? formatCurrency(live.price) : '—';
      const changeVal = live ? live.change : null;
      const changeText = changeVal != null
        ? `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)}%`
        : '—';
      const changeClass = changeVal != null
        ? (changeVal >= 0 ? 'positive' : 'negative')
        : '';

      return `
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
              <div class="asset-price-value">${priceText}</div>
              <div class="asset-price-change ${changeClass}">${changeText}</div>
            </div>
          </div>
          <canvas class="asset-sparkline" id="sparkline-${asset.symbol}"></canvas>
        </div>
      `;
    }).join('');

    // Draw sparklines
    requestAnimationFrame(() => {
      filtered.forEach(asset => {
        const canvas = document.getElementById(`sparkline-${asset.symbol}`);
        if (canvas) {
          const live = liveDataMap ? liveDataMap[asset.symbol] : null;
          let data;
          if (live && live.sparkline && live.sparkline.length > 0) {
            const spark = live.sparkline;
            const step = Math.max(1, Math.floor(spark.length / 20));
            data = [];
            for (let i = 0; i < spark.length; i += step) {
              data.push(spark[i]);
            }
          } else {
            data = generateSmoothData(20, 0.6);
          }
          const isUp = data[data.length - 1] > data[0];
          drawSparkline(canvas, {
            data,
            color: isUp ? '#10b981' : '#ef4444',
          });
        }
      });
    });
  }

  function renderError(message) {
    const grid = main.querySelector('#asset-grid');
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-tertiary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 1rem;opacity:0.5;">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${message}</p>
      </div>
    `;
  }

  // ===== SEARCH DROPDOWN (Stocks tab) =====

  const searchDropdown = main.querySelector('#search-dropdown');

  function showSearchDropdown(results) {
    if (!results || results.length === 0) {
      searchDropdown.style.display = 'none';
      return;
    }

    searchDropdown.style.display = 'block';
    searchDropdown.innerHTML = results.map(r => `
      <div class="search-dropdown-item" data-symbol="${r.symbol}" data-name="${r.name || r.symbol}">
        <span class="search-dropdown-symbol">${r.symbol}</span>
        <span class="search-dropdown-name">${r.name || ''}</span>
      </div>
    `).join('');

    // Click handler for each result
    searchDropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
      item.addEventListener('click', async () => {
        const symbol = item.dataset.symbol;
        const name = item.dataset.name;
        searchDropdown.style.display = 'none';
        searchInput.value = '';

        // Fetch price for this stock and add to displayed results
        showLoadingGrid(1);

        const priceData = await getStockPrice(symbol);
        const newStock = {
          symbol,
          name,
          price: priceData ? priceData.price : null,
          change: priceData ? priceData.change : null,
        };

        // Add to front of results, avoid duplicates, limit to 5
        stockResults = [newStock, ...stockResults.filter(s => s.symbol !== symbol)].slice(0, 5);
        renderStockCards(stockResults);
      });
    });
  }

  // Debounced search (500ms)
  const debouncedSearch = debounce(async (query) => {
    if (!query || query.trim().length < 1) {
      searchDropdown.style.display = 'none';
      return;
    }

    const results = await searchStocks(query.trim());
    // Only show dropdown if we're still on stocks tab
    if (activeTab === 'stocks') {
      showSearchDropdown(results);
    }
  }, 500);

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.market-search')) {
      searchDropdown.style.display = 'none';
    }
  });

  // ===== DATA FETCHING =====

  function buildCryptoMap(apiData) {
    if (!apiData) return null;
    const map = {};
    apiData.forEach(coin => {
      map[coin.symbol] = {
        price: coin.price,
        change: coin.change24h,
        sparkline: coin.sparkline,
      };
    });
    return map;
  }

  async function fetchCryptoData() {
    if (isCacheValid('crypto')) {
      cryptoData = buildCryptoMap(getCachedData('crypto'));
    } else {
      const raw = await getCryptoMarketData();
      if (raw) {
        setCachedData('crypto', raw);
        cryptoData = buildCryptoMap(raw);
      }
    }

    if (activeTab === 'crypto') {
      const search = main.querySelector('#market-search-input')?.value || '';
      if (cryptoData) {
        renderCryptoAssets(cryptoAssets, cryptoData, search);
      } else {
        renderError('Unable to fetch live crypto data. Please try again later.');
      }
    }
  }

  // ===== INITIAL LOAD =====

  // Stocks tab: show empty state with search prompt
  renderStockCards([]);

  // Pre-fetch crypto data in background
  fetchCryptoData();

  // Crypto refreshes every 30s
  registerInterval(PAGE_NAME, fetchCryptoData, 30_000);

  // ===== EVENT HANDLERS =====

  // Search input
  const searchInput = main.querySelector('#market-search-input');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;

    if (activeTab === 'stocks') {
      // Debounced Yahoo search
      debouncedSearch(query);
    } else {
      // Crypto: filter locally
      if (cryptoData) {
        renderCryptoAssets(cryptoAssets, cryptoData, query);
      }
    }
  });

  // Tab switching
  const tabs = main.querySelectorAll('.market-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      searchInput.value = '';
      searchDropdown.style.display = 'none';

      if (activeTab === 'stocks') {
        searchInput.placeholder = 'Search stocks (e.g. AAPL, Tesla)...';
        if (stockResults.length > 0) {
          renderStockCards(stockResults);
        } else {
          renderStockCards([]);
        }
      } else {
        searchInput.placeholder = 'Search crypto...';
        if (cryptoData) {
          renderCryptoAssets(cryptoAssets, cryptoData);
        } else {
          showLoadingGrid();
          fetchCryptoData();
        }
      }
    });
  });
}
