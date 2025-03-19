import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { RiskLevel } from '../models/InvestmentPlan';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PriceData {
  date: string;
  timestamp: number; // Added timestamp for easier comparison
  price: number;
}

export interface AnalysisResult {
  movingAverage7Day: number;
  movingAverage30Day: number;
  priceChangePercentage: number;
  priceFactor: number;
  isPriceGoingUp: boolean;
}

async function fetchHistoricalPrices(tokenId: string, days: number = 30): Promise<PriceData[]> {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
      },
    });

    const data = response.data as { prices: [number, number][] };
    return data.prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toISOString(),
      timestamp: item[0], // Store the timestamp for easier comparison
      price: item[1],
    }));
  } catch (error) {
    logger.error('Error fetching historical prices:', error);
    throw new Error('Failed to fetch historical prices');
  }
}

function calculateMovingAverage(prices: PriceData[], period: number): number {
  if (prices.length < period) {
    throw new Error('Not enough price data to calculate moving average');
  }

  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((acc, data) => acc + data.price, 0);
  return sum / period;
}

function calculatePriceChangePercentage(prices: PriceData[]): number {
  if (prices.length < 2) {
    throw new Error('Not enough price data to calculate price change');
  }

  // Sort prices by timestamp in ascending order to ensure chronological order
  const sortedPrices = [...prices].sort((a, b) => a.timestamp - b.timestamp);
  
  // Get the latest price
  const latestPrice = sortedPrices[sortedPrices.length - 1];
  
  // Find the price closest to 24 hours ago
  const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const targetTimestamp = latestPrice.timestamp - oneDayMs;
  
  // Find the price data point closest to 24 hours ago
  let closestPricePoint = sortedPrices[0];
  let smallestDiff = Math.abs(sortedPrices[0].timestamp - targetTimestamp);
  
  for (let i = 1; i < sortedPrices.length; i++) {
    const diff = Math.abs(sortedPrices[i].timestamp - targetTimestamp);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestPricePoint = sortedPrices[i];
    }
  }
  
  // Calculate percentage change using true 24-hour window
  const percentageChange = ((latestPrice.price - closestPricePoint.price) / closestPricePoint.price) * 100;
  
  return percentageChange;
}

export async function analyzeTokenPrice(tokenId: string = 'sonic-svm'): Promise<AnalysisResult> {
  try {
    // Fetch historical price data with extra days to ensure we have enough data points
    const priceData = await fetchHistoricalPrices(tokenId, 31);
    
    const movingAverage7Day = calculateMovingAverage(priceData, 7);
    const movingAverage30Day = calculateMovingAverage(priceData, Math.min(30, priceData.length));
    
    // Calculate price change percentage using 24-hour rolling window
    const priceChangePercentage = calculatePriceChangePercentage(priceData);
    const isPriceGoingUp = priceChangePercentage > 0;
    
    // Use OpenAI to analyze the data and provide a factor between 0-1 or 1-2
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a cryptocurrency price analyzer. Analyze the provided data and return a single number:
          
          - If price is dropping (negative price change %), return a number between 0 and 1:
            * For minimal price drops (0 to -3%), return a number close to 1 (0.7-1.0)
            * For moderate price drops (-3% to -10%), return a mid-range number (0.4-0.7)
            * For significant price drops (< -10%), return a number close to 0 (0.1-0.3)
          
          - If price is rising (positive price change %), return a number between 1 and 2:
            * For minimal price increases (0-3%), return a number close to 1 (1.0-1.3)
            * For moderate price increases (3-10%), return a mid-range number (1.3-1.7)
            * For significant price increases (>10%), return a number close to 2 (1.7-1.9)
          
          Only return the number as a JSON object with a single field called "priceFactor". Nothing else.`
        },
        {
          role: "user",
          content: `
          Please analyze this token data and provide a price factor:
          
          Token: ${tokenId}
          7-Day Moving Average: $${movingAverage7Day.toFixed(4)}
          30-Day Moving Average: $${movingAverage30Day.toFixed(4)}
          24-Hour Price Change: ${priceChangePercentage.toFixed(2)}%
          `
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    if (!completion.choices[0].message.content) {
      throw new Error('OpenAI response content is null');
    }
    
    const analysis = JSON.parse(completion.choices[0].message.content);
    const priceFactor = analysis.priceFactor;
    logger.info(`AI analysis for ${tokenId}: Price factor = ${priceFactor}, Price trend: ${isPriceGoingUp ? 'Up' : 'Down'}`);
    
    return {
      movingAverage7Day,
      movingAverage30Day,
      priceChangePercentage,
      priceFactor,
      isPriceGoingUp
    };
  } catch (error) {
    logger.error('Error analyzing token price:', error);
    // Default to a neutral factor if analysis fails
    return {
      movingAverage7Day: 0,
      movingAverage30Day: 0,
      priceChangePercentage: 0,
      priceFactor: 1.0, // Neutral factor
      isPriceGoingUp: false
    };
  }
}

export function getRiskMultiplier(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case RiskLevel.NO_RISK:
      return 1.0;
    case RiskLevel.LOW_RISK:
      return 1.2;
    case RiskLevel.MEDIUM_RISK:
      return 1.5;
    case RiskLevel.HIGH_RISK:
      return 2.0;
    default:
      return 1.0;
  }
}