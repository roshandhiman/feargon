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
};

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
    return null;
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
    return null;
  }
};

/**
 * Get a single coin's price + change
 * Returns { price, change24h } or null
 */
export const getCoinPrice = async (coinId = 'bitcoin') => {
  try {
    const data = await getCryptoPrices([coinId]);
    if (!data || !data[coinId]) return null;

    return {
      price: data[coinId].usd,
      change24h: data[coinId].usd_24h_change,
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
    const res = await fetch(`/api/proxy/crypto?type=history&ids=${coinId}&days=${days}`);
    if (!res.ok) throw new Error("History fetch failed");
    const data = await res.json();
    
    // Transform to standard { date, price } format
    return data.prices.map(p => ({
      date: new Date(p[0]).toISOString().split('T')[0],
      price: p[1]
    }));
  } catch (error) {
    console.error('Error fetching coin history:', error);
    return null;
  }
};

export { COIN_ID_MAP };
