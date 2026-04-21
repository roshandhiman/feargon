// src/services/crypto.js — CoinGecko API (free, no key required)

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Map our display symbols to CoinGecko IDs
const COIN_ID_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  LINK: 'chainlink',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
};

const FALLBACK_CRYPTO_MARKET = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 67110, change24h: 2.1, marketCap: 1320000000000, volume: 32000000000 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3400, change24h: 1.5, marketCap: 410000000000, volume: 16000000000 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 145, change24h: 3.2, marketCap: 68000000000, volume: 4200000000 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 0.62, change24h: 0.8, marketCap: 35000000000, volume: 1900000000 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: 1.1, marketCap: 16000000000, volume: 550000000 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.16, change24h: 2.4, marketCap: 23000000000, volume: 1400000000 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 15.2, change24h: 1.7, marketCap: 9100000000, volume: 520000000 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 6.8, change24h: 0.5, marketCap: 9700000000, volume: 310000000 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 36.4, change24h: 2.8, marketCap: 15000000000, volume: 760000000 },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', price: 0.72, change24h: 1.9, marketCap: 7100000000, volume: 420000000 },
];

function buildFallbackSparkline(price, change24h = 0, points = 30) {
  const data = [];
  const totalMove = change24h / 100;
  for (let i = 0; i < points; i++) {
    const t = i / Math.max(1, points - 1);
    const trend = 1 + totalMove * (t - 1);
    const wave = Math.sin(i * 0.8 + price) * 0.015;
    data.push(price * trend * (1 + wave));
  }
  return data;
}

export function getFallbackCryptoMarketData() {
  return FALLBACK_CRYPTO_MARKET.map(coin => ({
    ...coin,
    sparkline: buildFallbackSparkline(coin.price, coin.change24h),
    image: null,
  }));
}

export function resolveCoinId(symbolOrId) {
  const value = String(symbolOrId || '').trim();
  if (!value) return 'bitcoin';
  const upperValue = value.toUpperCase();
  return COIN_ID_MAP[upperValue] || value.toLowerCase();
}

/**
 * Fetch market data for a large list of cryptos
 * Returns array of objects with standard fields
 */
export const getCryptoMarketData = async () => {
  try {
    // We pass per_page=500 and ids=all to get the broad market
    const res = await fetch(
      `/api/proxy/crypto?type=market&ids=all&per_page=100`
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return getFallbackCryptoMarketData();
    }

    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      sparkline: coin.sparkline_in_7d?.price || [],
      image: coin.image,
      marketCap: coin.market_cap,
      volume: coin.total_volume,
    }));
  } catch (error) {
    console.error('Error fetching crypto market data:', error);
    return getFallbackCryptoMarketData();
  }
};

/**
 * Lightweight: fetch just prices for specific coins
 * Returns object like { bitcoin: { usd: 60000, usd_24h_change: 2.5 }, ... }
 */
export const getCryptoPrices = async (ids = ['bitcoin', 'ethereum', 'solana']) => {
  try {
    const res = await fetch(
      `/api/proxy/crypto?type=simple&ids=${ids.join(',')}`
    );

    if (!res.ok) {
      throw new Error(`CoinGecko price API error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    const fallback = {};
    const fallbackMarket = getFallbackCryptoMarketData();
    ids.forEach(id => {
      const coin = fallbackMarket.find(item => item.id === id || item.symbol.toLowerCase() === String(id).toLowerCase());
      if (coin) {
        fallback[id] = { usd: coin.price, usd_24h_change: coin.change24h };
      }
    });
    return fallback;
  }
};

/**
 * Get a single coin's price + change
 * Returns { price, change24h } or null
 */
export const getCoinPrice = async (coinId = 'bitcoin') => {
  try {
    const resolvedId = resolveCoinId(coinId);
    const data = await getCryptoPrices([resolvedId]);
    if (!data || !data[resolvedId]) {
      const fallbackCoin = getFallbackCryptoMarketData().find(item => item.id === resolvedId || item.symbol.toLowerCase() === String(coinId).toLowerCase());
      if (!fallbackCoin) return null;
      return {
        price: fallbackCoin.price,
        change24h: fallbackCoin.change24h,
      };
    }

    return {
      price: data[resolvedId].usd,
      change24h: data[resolvedId].usd_24h_change,
    };
  } catch (error) {
    console.error('Error fetching coin price:', error);
    return null;
  }
};

/**
 * Fetch historical data for a specific coin
 */
export const getCoinHistory = async (coinId, days = 7) => {
  try {
    const resolvedId = resolveCoinId(coinId);
    const res = await fetch(`/api/proxy/crypto?type=history&ids=${resolvedId}&days=${days}`);
    if (!res.ok) throw new Error("History fetch failed");
    const data = await res.json();
    if (!Array.isArray(data.prices)) throw new Error("History response missing prices");
    
    // Transform to one close per day so simulator volatility is not inflated by hourly points.
    const dailyMap = new Map();
    data.prices.forEach(p => {
      dailyMap.set(new Date(p[0]).toISOString().split('T')[0], p[1]);
    });

    return Array.from(dailyMap.entries())
      .map(([date, price]) => ({ date, price }))
      .slice(-days);
  } catch (error) {
    console.error('Error fetching coin history:', error);
    const resolvedId = resolveCoinId(coinId);
    const coin = getFallbackCryptoMarketData().find(item => item.id === resolvedId || item.symbol.toLowerCase() === String(coinId).toLowerCase()) || getFallbackCryptoMarketData()[0];
    const sparkline = buildFallbackSparkline(coin.price, coin.change24h, days);
    const now = new Date();
    return sparkline.map((price, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (sparkline.length - index - 1));
      return {
        date: date.toISOString().split('T')[0],
        price,
      };
    });
  }
};

export { COIN_ID_MAP };
