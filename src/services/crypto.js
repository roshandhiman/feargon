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
 * Fetch market data for our crypto list
 * Returns array of { id, symbol, name, current_price, price_change_percentage_24h, sparkline_in_7d }
 */
export const getCryptoMarketData = async () => {
  const ids = Object.values(COIN_ID_MAP).join(',');

  try {
    const res = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
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
      `${BASE_URL}/simple/price?ids=${ids.join(',')}&vs_currency=usd&include_24hr_change=true`
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

export { COIN_ID_MAP };
