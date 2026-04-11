// src/services/dataManager.js — Central data cache & interval manager
// Prevents redundant API calls and ensures proper cleanup on page navigation

const cache = {
  crypto: { data: null, timestamp: 0 },
  stocks: { data: null, timestamp: 0 },
  indices: { data: null, timestamp: 0 },
};

// Active interval IDs — keyed by page name
const activeIntervals = new Map();

// Cache TTL (milliseconds)
const CRYPTO_TTL = 25_000;  // 25s (refresh is 30s, so cache stays fresh between)
const STOCK_TTL = 300_000;  // 5 minutes — stocks fetched once on load

/**
 * Get cached data or fetch fresh
 */
export function getCachedData(key) {
  const entry = cache[key];
  if (!entry) return null;
  return entry.data;
}

/**
 * Update cache
 */
export function setCachedData(key, data) {
  if (!cache[key]) cache[key] = { data: null, timestamp: 0 };
  cache[key].data = data;
  cache[key].timestamp = Date.now();
}

/**
 * Check if cache is still valid
 */
export function isCacheValid(key) {
  const entry = cache[key];
  if (!entry || !entry.data) return false;

  const ttl = key === 'crypto' ? CRYPTO_TTL : STOCK_TTL;
  return (Date.now() - entry.timestamp) < ttl;
}

/**
 * Register an interval for a specific page
 * Returns the interval ID
 */
export function registerInterval(pageName, callback, intervalMs) {
  const id = setInterval(callback, intervalMs);

  if (!activeIntervals.has(pageName)) {
    activeIntervals.set(pageName, []);
  }
  activeIntervals.get(pageName).push(id);

  return id;
}

/**
 * Clear all intervals for a specific page
 * Call this when leaving a page
 */
export function clearPageIntervals(pageName) {
  const intervals = activeIntervals.get(pageName);
  if (intervals) {
    intervals.forEach((id) => clearInterval(id));
    activeIntervals.delete(pageName);
  }
}

/**
 * Clear ALL active intervals (emergency cleanup)
 */
export function clearAllIntervals() {
  activeIntervals.forEach((intervals) => {
    intervals.forEach((id) => clearInterval(id));
  });
  activeIntervals.clear();
}
