import { getSavedGeminiKey } from './storage';

export interface TranslationChunkResponse {
  success: boolean;
  pageNumber: number;
  chunkIndex?: number;
  originalText?: string;
  translatedSinhala?: string;
  modelUsed?: string;
  autoRecovered?: boolean;
  recoveredFrom?: string;
  isRateLimitOrTimeout?: boolean;
  error?: string;
}

export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string; model?: string; sampleTranslation?: string }> {
  try {
    const res = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-key': apiKey.trim(),
      },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to validate API key. Please verify your Gemini API key.',
      };
    }

    return {
      success: true,
      message: data.message || 'API key validated successfully!',
      model: data.model,
      sampleTranslation: data.sampleTranslation,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error while testing Gemini API key.',
    };
  }
}

export async function translateTextChunk(
  text: string,
  genre: string,
  pageNumber: number,
  chunkIndex: number = 0,
  model: string = 'auto-fallback',
  maxRetries: number = 3
): Promise<TranslationChunkResponse> {
  const apiKey = getSavedGeminiKey();

  let attempt = 0;
  let delay = 1000;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch('/api/translate/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey,
        },
        body: JSON.stringify({
          text,
          genre,
          pageNumber,
          chunkIndex,
          model,
          apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          pageNumber,
          chunkIndex,
          originalText: text,
          translatedSinhala: data.translatedSinhala,
          modelUsed: data.modelUsed,
          autoRecovered: data.autoRecovered,
          recoveredFrom: data.recoveredFrom,
        };
      }

      // If client error (e.g. 401 Unauthorized or 400 Bad Request), don't retry in vain
      if (response.status === 401 || response.status === 400) {
        return {
          success: false,
          pageNumber,
          chunkIndex,
          error: data.error || 'Invalid API Key or Bad Request',
        };
      }

      if (response.status === 429 || data.isRateLimitOrTimeout) {
        // Rate limit hit across cascade or timeout
        attempt++;
        if (attempt > maxRetries) {
          return {
            success: false,
            pageNumber,
            chunkIndex,
            isRateLimitOrTimeout: true,
            error: data.error || 'Rate limit or timeout reached on Gemini. Checkpoint preserved.',
          };
        }
        await new Promise((resolve) => setTimeout(resolve, delay * 1.5));
        delay *= 2;
        continue;
      }

      throw new Error(data.error || `Server responded with status ${response.status}`);
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries) {
        return {
          success: false,
          pageNumber,
          chunkIndex,
          isRateLimitOrTimeout: /429|rate limit|timeout|quota/i.test(error?.message || ''),
          error: error?.message || 'Max translation retry attempts reached.',
        };
      }
      // Wait with exponential backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return {
    success: false,
    pageNumber,
    chunkIndex,
    isRateLimitOrTimeout: true,
    error: 'Failed to translate after multiple retries.',
  };
}
