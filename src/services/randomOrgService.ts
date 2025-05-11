'use server';

const RANDOM_ORG_API_URL = 'https://api.random.org/json-rpc/4/invoke';
const API_KEY = process.env.RANDOM_ORG_API_KEY;

interface RandomOrgBaseResponse {
  jsonrpc: string;
  id: number;
}

interface RandomOrgSuccessResponse<T> extends RandomOrgBaseResponse {
  result: {
    random: {
      data: T[];
      completionTime: string;
    };
    bitsUsed: number;
    bitsLeft: number;
    requestsLeft: number;
    advisoryDelay: number;
  };
  error?: never;
}

interface RandomOrgErrorResponse extends RandomOrgBaseResponse {
  result?: never;
  error: {
    code: number;
    message: string;
    data: any;
  };
}

type RandomOrgResponse<T> = RandomOrgSuccessResponse<T> | RandomOrgErrorResponse;

async function makeRandomOrgRequest<T>(method: string, params: object): Promise<T[]> {
  if (!API_KEY) {
    console.warn('RANDOM_ORG_API_KEY is not set in .env. Cannot use Random.org API.');
    throw new Error('Random.org API key not configured');
  }

  const requestId = Date.now();

  try {
    const response = await fetch(RANDOM_ORG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: { ...params, apiKey: API_KEY },
        id: requestId,
      }),
      cache: 'no-store', // Ensure fresh data for randomness
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Random.org API request failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Random.org API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as RandomOrgResponse<T>;

    if (data.error) {
      console.error('Random.org API Error:', data.error);
      throw new Error(`Random.org API Error: ${data.error.message}`);
    }

    if (data.result && data.result.random && data.result.random.data) {
      // console.log(`Random.org: ${method} successful. Requests left: ${data.result.requestsLeft}, Bits left: ${data.result.bitsLeft}`);
      return data.result.random.data;
    }

    console.error('Invalid response structure from Random.org:', data);
    throw new Error('Invalid response structure from Random.org');
  } catch (error) {
    console.error(`Error calling Random.org method "${method}":`, error);
    throw error; // Re-throw to be handled by caller
  }
}

export async function fetchRandomIntegers(
  n: number,
  min: number,
  max: number,
  replacement: boolean = true
): Promise<number[]> {
  return makeRandomOrgRequest<number>('generateIntegers', { n, min, max, replacement });
}

export async function fetchRandomDecimalFractions(
  n: number,
  decimalPlaces: number,
  replacement: boolean = true
): Promise<number[]> {
  // Ensure decimalPlaces is within Random.org's limits (typically 1-20, API might enforce this)
  const clampedDecimalPlaces = Math.max(1, Math.min(20, decimalPlaces));
  return makeRandomOrgRequest<number>('generateDecimalFractions', { n, decimalPlaces: clampedDecimalPlaces, replacement });
}

export async function isRandomOrgConfigured(): Promise<boolean> {
  return !!API_KEY;
}
