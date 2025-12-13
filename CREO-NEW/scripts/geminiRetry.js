const RATE_LIMIT_STATUS = new Set([429, 503]);
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 2000;
const DEFAULT_BACKOFF_MULTIPLIER = 2;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitWithJitter = async ms => {
  const jitter = Math.floor(Math.random() * 250);
  await wait(ms + jitter);
};

const parseRetryAfterHeader = headers => {
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

async function callGeminiWithRetry({
  apiKey,
  model,
  body,
  headers = {},
  maxRetries = DEFAULT_MAX_RETRIES,
  initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
  backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER
}) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const totalAttempts = Math.max(1, maxRetries + 1);

  let attempt = 0;
  let lastStatus;
  let lastErrorMessage = '';

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
        return { response, attempts: attempt + 1 };
      }

      lastStatus = response.status;
      const errorText = await response.text();

      if (RATE_LIMIT_STATUS.has(response.status) && attempt < totalAttempts - 1) {
        const retryDelay =
          parseRetryAfterHeader(response.headers) ??
          Math.round(initialDelayMs * Math.pow(backoffMultiplier, attempt));
        console.warn(
          `Gemini rate limit/quota hit for model ${model} (status ${response.status}). Retrying in ${retryDelay}ms...`
        );
        await waitWithJitter(retryDelay);
        attempt += 1;
        continue;
      }

      lastErrorMessage = errorText;
      break;
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

      break;
    }
  }

  return {
    response: null,
    status: lastStatus,
    errorMessage: lastErrorMessage,
    attempts: totalAttempts
  };
}

module.exports = {
  callGeminiWithRetry
};
