import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get system prompt based on genre
function getGenreSystemPrompt(genre: string = 'general'): string {
  const basePrompt = `You are an expert English-to-Sinhala literary and technical translator.
Translate the provided English content into natural, fluent, grammatically correct Sinhala (සිංහල).
Your translation must sound as if it was originally written by a highly educated native Sinhala writer.
Do not translate word-for-word when doing so produces awkward or unnatural Sinhala.
Preserve the original meaning, context, tone, paragraph structure, headings, lists, numbers, names, formulas, references, and formatting.
Use modern, standard Sinhala Unicode characters.
Avoid awkward machine-translation syntax.
Do not summarize. Do not omit content. Do not add information. Do not explain your translation or include phrases like "මෙන්න පරිවර්තනය" (Here is the translation).
Return strictly the translated Sinhala text.`;

  switch (genre.toLowerCase()) {
    case 'literature':
    case 'fiction':
      return `${basePrompt}
Genre Specifics: Literature / Fiction.
Focus on literary beauty, expressive emotional vocabulary, idiomatic natural Sinhala prose, and character dialogue nuances.`;

    case 'academic':
    case 'educational':
      return `${basePrompt}
Genre Specifics: Academic & Educational.
Maintain high scholarly rigor, formal academic Sinhala register (උගත් ශාස්ත්‍රීය භාෂාව), precise scholarly terminology, and keep English technical loan words in parentheses where helpful for students and scholars.`;

    case 'technical':
      return `${basePrompt}
Genre Specifics: Technical / Computer Science / Engineering.
Use standard Sinhala technical terminology where established, and append the English technical term in parentheses upon first mention (e.g., 'දත්ත සමුදාය (Database)'). Preserve all code, mathematical symbols, variable names, and formulas unchanged.`;

    case 'business':
      return `${basePrompt}
Genre Specifics: Business / Economics / Finance.
Maintain polished professional commercial Sinhala register suitable for business reports, corporate literature, and economic analysis.`;

    default:
      return `${basePrompt}
Genre Specifics: General Book.
Balance everyday natural readability with rich grammatical fluency.`;
  }
}

// Helper to build model cascade list
function buildModelCascade(requestedModel?: string): string[] {
  // Free tier models supported
  const defaultFreeModels = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
  ];

  if (!requestedModel || requestedModel === 'auto-fallback') {
    return defaultFreeModels;
  }

  // Place requested model first, followed by others in the free cascade
  const filtered = defaultFreeModels.filter(m => m !== requestedModel);
  return [requestedModel, ...filtered];
}

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'SinhalaBook Translator',
    hasEnvGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    firebaseProjectId: 'sinhalabook-translator',
    supportedFreeModels: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'],
    autoFallbackEnabled: true,
    timestamp: new Date().toISOString(),
  });
});

// Test Gemini API key
app.post('/api/gemini/test', async (req, res) => {
  try {
    const userApiKey = req.headers['x-gemini-key'] as string || req.body.apiKey || DEFAULT_GEMINI_KEY;

    if (!userApiKey || typeof userApiKey !== 'string' || !userApiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No Gemini API key provided. Please provide a valid Gemini API key.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: userApiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const testPrompt = 'Translate into natural, fluent Sinhala in one short phrase: "Knowledge and wisdom illuminate the human mind."';
    
    // Try candidate models with fallback
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    let lastError: any = null;
    let successfulModel = '';
    let translatedText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: testPrompt,
        });
        if (response.text) {
          translatedText = response.text.trim();
          successfulModel = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Key Test] Model ${modelName} test issue: ${err.message}. Trying next candidate...`);
      }
    }

    if (!translatedText) {
      throw lastError || new Error('Could not validate key with free Gemini models.');
    }

    return res.json({
      success: true,
      message: `Gemini API key is active and successfully validated with ${successfulModel}.`,
      model: successfulModel,
      sampleTranslation: translatedText,
    });
  } catch (error: any) {
    console.error('Gemini test error:', error);
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to authenticate with Gemini API. Please check your API key quota and validity.',
    });
  }
});

// Translate chunk endpoint with Free Models Auto-Fallback & Recovery
app.post('/api/translate/chunk', async (req, res) => {
  const { text, genre = 'general', pageNumber, chunkIndex, model = 'auto-fallback' } = req.body;
  const userApiKey = (req.headers['x-gemini-key'] as string) || req.body.apiKey || DEFAULT_GEMINI_KEY;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Text content is required for translation.' });
  }

  if (!userApiKey || typeof userApiKey !== 'string' || !userApiKey.trim()) {
    return res.status(401).json({
      success: false,
      error: 'Gemini API Key missing. Please provide your API key in the application settings.',
    });
  }

  const ai = new GoogleGenAI({
    apiKey: userApiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const systemInstruction = getGenreSystemPrompt(genre);
  const modelCascade = buildModelCascade(model);
  const initialModel = modelCascade[0];

  let lastError: any = null;
  let translatedSinhala = '';
  let successfulModel = '';
  let autoRecovered = false;

  for (let i = 0; i < modelCascade.length; i++) {
    const candidateModel = modelCascade[i];

    try {
      // Timeout guard: 25 seconds per attempt
      const translationPromise = ai.models.generateContent({
        model: candidateModel,
        contents: `English Text to translate:\n\n${text.trim()}`,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout: ${candidateModel} translation exceeded 25s limit.`)), 25000);
      });

      const response = await Promise.race([translationPromise, timeoutPromise]);
      const resultText = response.text ? response.text.trim() : '';

      if (resultText) {
        translatedSinhala = resultText;
        successfulModel = candidateModel;
        autoRecovered = i > 0;
        break;
      } else {
        throw new Error(`Empty response received from ${candidateModel}`);
      }
    } catch (err: any) {
      lastError = err;
      const isRateLimit = /429|resource_exhausted|quota|rate limit|too many requests/i.test(err?.message || '');
      const isTimeout = /timeout|timed out|abort|deadline/i.test(err?.message || '');

      console.warn(`[Auto-Fallback Engine] Page ${pageNumber} attempt on ${candidateModel} failed: ${err?.message}. (RateLimit: ${isRateLimit}, Timeout: ${isTimeout})`);

      // If there are more models in cascade, wait brief backoff before trying next model
      if (i < modelCascade.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 + i * 500));
      }
    }
  }

  if (translatedSinhala && successfulModel) {
    return res.json({
      success: true,
      pageNumber,
      chunkIndex,
      originalText: text,
      translatedSinhala,
      modelUsed: successfulModel,
      autoRecovered,
      recoveredFrom: autoRecovered ? initialModel : undefined,
    });
  }

  // All free models exhausted or failed
  console.error(`All candidate models failed for page ${pageNumber}:`, lastError?.message);
  const isRateLimitOrTimeout = /429|resource_exhausted|quota|rate limit|timeout|timed out/i.test(lastError?.message || '');

  return res.status(isRateLimitOrTimeout ? 429 : 500).json({
    success: false,
    pageNumber,
    chunkIndex,
    isRateLimitOrTimeout,
    error: lastError?.message || 'Translation request failed on all free Gemini models. Safe checkpoint preserved.',
  });
});

// Translation job control state helpers
app.post('/api/translate/start', (req, res) => {
  const { jobId, totalPages } = req.body;
  res.json({ success: true, status: 'processing', jobId, totalPages });
});

app.post('/api/translate/pause', (req, res) => {
  const { jobId, lastCheckpointPage } = req.body;
  res.json({ success: true, status: 'paused', jobId, lastCheckpointPage });
});

app.post('/api/translate/resume', (req, res) => {
  const { jobId, resumePage } = req.body;
  res.json({ success: true, status: 'processing', jobId, resumePage });
});

app.post('/api/translate/retry', (req, res) => {
  const { jobId, pageNumber } = req.body;
  res.json({ success: true, status: 'retrying', jobId, pageNumber });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SinhalaBook Translator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
