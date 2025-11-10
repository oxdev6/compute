/**
 * Price Feed Compute Function
 * Example: pricefeed.eth → { "ETH/USD": 3120.23, signature: ... }
 */

const axios = require('axios');

/**
 * Fetches price data from CoinGecko API
 * @param {string} pair - Trading pair (e.g., "ethereum", "bitcoin")
 * @returns {Promise<Object>} Price data
 */
async function getPrice(pair = 'ethereum') {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${pair}&vs_currencies=usd`,
      { timeout: 5000 }
    );
    
    const price = response.data[pair]?.usd;
    if (!price) {
      throw new Error(`Price not found for ${pair}`);
    }
    
    return {
      pair: `${pair.toUpperCase()}/USD`,
      price: price,
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error('Price fetch error:', error.message);
    throw new Error(`Failed to fetch price for ${pair}`);
  }
}

/**
 * Main compute function for price feed
 * @param {Object} params - Computation parameters
 * @returns {Promise<Object>} Computation result
 */
async function compute(params = {}) {
  const pair = params.pair || 'ethereum';
  const priceData = await getPrice(pair);
  
  return {
    success: true,
    data: priceData,
    type: 'pricefeed',
  };
}

module.exports = { compute, getPrice };

