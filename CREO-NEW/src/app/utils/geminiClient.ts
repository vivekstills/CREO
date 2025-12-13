import { safeJsonParse } from '@/app/utils/jsonHelpers';

const RATE_LIMIT_STATUS = new Set([429, 503]);
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 2000;
const DEFAULT_BACKOFF_MULTIPLIER = 2;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitWithJitter = async (ms: number) => {
  const jitter = Math.floor(Math.random() * 250);
  await wait(ms + jitter);
};

const parseRetryAfterHeader = (headers: Headers): number | null => {
  const retryAfter = headers.get('retry-after');
  if (!retryAfter) return null;

  const numericValue = Number(retryAfter);
  if (!Number.isNaN(numericValue)) {
    return Math.max(numericValue * 1000, 0);
  }

  const retryDate = Date.parse(retryAfter);
  if (!Number.isNaN(retryDate)) {
    return Math.max(retryDate - Date.now(), 0);
  }

  return null;
};

const buildGeminiErrorMessage = (raw: string, status?: number): string => {
  const parsed = safeJsonParse(raw);
  if (parsed.success) {
    return (
      parsed.data?.error?.message ||
      parsed.data?.message ||
      parsed.data?.error ||
      raw ||
      `Gemini API Error${status ? ` ${status}` : ''}`
    );
  }
  return raw || `Gemini API Error${status ? ` ${status}` : ''}`;
};

export interface GeminiRetryOptions {
  apiKey: string;
  model: string;
  body: unknown;
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  headers?: Record<string, string>;
}

export interface GeminiRetryResult {
  response: Response | null;
  status?: number;
  errorMessage?: string;
  attempts: number;
  wasRateLimited: boolean;
}

export async function callGeminiWithRetry(
  options: GeminiRetryOptions
): Promise<GeminiRetryResult> {
  const {
    apiKey,
    model,
    body,
    headers = {},
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER
  } = options;

  const totalAttempts = Math.max(1, maxRetries + 1);
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  let attempt = 0;
  let lastStatus: number | undefined;
  let lastErrorMessage = '';
  let wasRateLimited = false;

  while (attempt < totalAttempts) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: payload
        }
      );

      if (response.ok) {
        return { response, attempts: attempt + 1, wasRateLimited };
      }

      lastStatus = response.status;
      const errorText = await response.text();
      lastErrorMessage = buildGeminiErrorMessage(errorText, lastStatus);

      if (RATE_LIMIT_STATUS.has(response.status) && attempt < totalAttempts - 1) {
        wasRateLimited = true;
        const retryDelay =
          parseRetryAfterHeader(response.headers) ??
          Math.round(initialDelayMs * Math.pow(backoffMultiplier, attempt));

        console.warn(
          `Gemini rate limit hit for model ${model} (status ${response.status}). Retrying in ${retryDelay}ms...`
        );
        await waitWithJitter(retryDelay);
        attempt += 1;
        continue;
      }

      return {
        response: null,
        status: response.status,
        errorMessage: lastErrorMessage,
        attempts: attempt + 1,
        wasRateLimited
      };
    } catch (error) {
      lastStatus = 0;
      lastErrorMessage = error instanceof Error ? error.message : String(error);

      if (attempt < totalAttempts - 1) {
        const retryDelay = Math.round(initialDelayMs * Math.pow(backoffMultiplier, attempt));
        console.warn(
          `Gemini request error for model ${model}. Retrying in ${retryDelay}ms...`,
          error
        );
        await waitWithJitter(retryDelay);
        attempt += 1;
        continue;
      }

      return {
        response: null,
        status: lastStatus,
        errorMessage: lastErrorMessage,
        attempts: attempt + 1,
        wasRateLimited
      };
    }
  }

  return {
    response: null,
    status: lastStatus,
    errorMessage: lastErrorMessage || 'Gemini request failed',
    attempts: totalAttempts,
    wasRateLimited
  };
}
