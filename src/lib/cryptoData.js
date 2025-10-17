// Top 20 cryptocurrencies with their symbols and info
export const TOP_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', logo: '₿' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', logo: 'Ξ' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', logo: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', logo: 'SOL' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', logo: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', logo: 'ADA' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', logo: 'AVAX' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', logo: 'Ð' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', logo: 'DOT' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', logo: 'LINK' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', logo: 'TRX' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', logo: 'MATIC' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', logo: 'XLM' },
  { id: 'worldcoin-wld', symbol: 'WLD', name: 'Worldcoin', logo: 'WLD' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', logo: '🐸' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', logo: 'Ł' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', logo: 'UNI' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', logo: 'SHIB' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', logo: 'NEAR' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', logo: 'ATOM' }
]

// Calculate standard deviation
export function calculateStandardDeviation(values) {
  const n = values.length
  if (n === 0) return 0
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / n
  
  return Math.sqrt(variance)
}

// Calculate probability of drop using normal distribution
export function calculateDropProbability(currentPrice, prices) {
  if (!prices || prices.length === 0) return 50
  
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
  const stdDev = calculateStandardDeviation(prices)
  
  if (stdDev === 0) return 50
  
  // Z-score: how many standard deviations away from mean
  const zScore = (currentPrice - mean) / stdDev
  
  // If current price is above mean (positive z-score), higher chance of drop
  // If current price is below mean (negative z-score), lower chance of drop
  
  // Use cumulative distribution function approximation
  // For simplicity, we'll use a linear approximation
  // Z-score of +1 = ~84% above mean = ~60% chance of drop
  // Z-score of -1 = ~16% above mean = ~40% chance of drop
  
  let dropProb = 50 + (zScore * 10)
  
  // Clamp between 10% and 90%
  dropProb = Math.max(10, Math.min(90, dropProb))
  
  return Math.round(dropProb)
}

// Calculate price range with confidence interval
export function calculatePriceRange(prices, confidenceLevel = 0.95) {
  if (!prices || prices.length === 0) {
    return { min: 0, max: 0, confidence: 0 }
  }
  
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
  const stdDev = calculateStandardDeviation(prices)
  
  // Z-scores for common confidence levels
  const zScores = {
    0.99: 2.576,
    0.95: 1.96,
    0.90: 1.645,
    0.88: 1.55
  }
  
  const zScore = zScores[confidenceLevel] || 1.96
  const margin = zScore * stdDev
  
  return {
    min: Math.max(0, mean - margin),
    max: mean + margin,
    confidence: Math.round(confidenceLevel * 100)
  }
}

// Mock function to simulate fetching historical data
// In production, this would call a real API like CoinGecko
export async function fetchCryptoData(cryptoId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Generate mock historical prices (3 years of daily data)
  const days = 365 * 3
  const basePrice = Math.random() * 50000 + 1000
  const prices = []
  
  let currentPrice = basePrice
  for (let i = 0; i < days; i++) {
    // Random walk with slight upward trend
    const change = (Math.random() - 0.48) * currentPrice * 0.05
    currentPrice = Math.max(currentPrice + change, basePrice * 0.1)
    prices.push(currentPrice)
  }
  
  const latestPrice = prices[prices.length - 1]
  const dropProb = calculateDropProbability(latestPrice, prices)
  const range99 = calculatePriceRange(prices, 0.99)
  const range95 = calculatePriceRange(prices, 0.95)
  const range88 = calculatePriceRange(prices, 0.88)
  
  return {
    currentPrice: latestPrice,
    dropProbability: dropProb,
    priceRange: range95,
    historicalPrices: prices
  }
}

