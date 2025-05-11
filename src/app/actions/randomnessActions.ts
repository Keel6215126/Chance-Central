'use server';

import {
  fetchRandomIntegers as fetchIntegersFromService,
  fetchRandomDecimalFractions as fetchDecimalsFromService,
  isRandomOrgConfigured as getIsConfigured,
} from '@/services/randomOrgService';

export async function getRandomIntegers(n: number, min: number, max: number): Promise<number[]> {
  if (!getIsConfigured()) {
    console.warn("Random.org API key not configured. Falling back to Math.random() for integers.");
    return Array.from({ length: n }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  }
  try {
    return await fetchIntegersFromService(n, min, max);
  } catch (error) {
    console.error("Failed to fetch integers from Random.org, falling back to Math.random():", error);
    // Fallback on API error
    return Array.from({ length: n }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  }
}

export async function getRandomDecimalFractions(n: number, decimalPlaces: number): Promise<number[]> {
   if (!getIsConfigured()) {
    console.warn("Random.org API key not configured. Falling back to Math.random() for decimals.");
    const multiplier = Math.pow(10, decimalPlaces);
    return Array.from({ length: n }, () => parseFloat((Math.random()).toFixed(decimalPlaces)));
  }
  try {
    return await fetchDecimalsFromService(n, decimalPlaces);
  } catch (error) {
    console.error("Failed to fetch decimal fractions from Random.org, falling back to Math.random():", error);
    return Array.from({ length: n }, () => parseFloat((Math.random()).toFixed(decimalPlaces)));
  }
}

export async function checkRandomOrgConfigured(): Promise<boolean> {
  return getIsConfigured();
}
