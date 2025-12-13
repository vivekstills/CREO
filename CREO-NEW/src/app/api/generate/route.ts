import { NextResponse } from 'next/server';
import { safeJsonParse, normalizeApiResponse, validateJsonStructure } from '@/app/utils/jsonHelpers';
import { callGeminiWithRetry } from '@/app/utils/geminiClient';
import { getGeminiApiKey } from '@/lib/apiKeys';

// Type definitions for better type safety
interface RequestBody {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

// Gemini API specific types
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topK?: number;
    topP?: number;
  };
}

const FALLBACK_GEMINI_MODELS = [
  'gemini-2.0-pro-exp',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.0-pro',
  'gemini-1.0-pro-latest',
  'gemini-pro',
  'gemini-pro-vision'
];

type GeminiModelListResult = {
  models: Array<{
    name: string;
    displayName?: string;
    description?: string;
    supportedGenerationMethods?: string[];
  }>;
  error?: string;
};

async function listGeminiModels(apiKey: string): Promise<GeminiModelListResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const responseText = await response.text();
    const parsed = safeJsonParse(responseText);

    if (!response.ok) {
      const message = parsed.success
        ? parsed.data?.error?.message || parsed.data?.message || `Gemini API Error: ${response.status}`
        : `Gemini API Error: ${response.status} - ${responseText}`;

      return {
        models: [],
        error: message
      };
    }

    if (!parsed.success) {
      return {
        models: [],
        error: 'Failed to parse ListModels response.'
      };
    }

    const models = Array.isArray(parsed.data?.models) ? parsed.data.models : [];

    const filtered = models
      .filter((model: any) =>
        model?.supportedGenerationMethods?.includes?.('generateContent')
      )
      .map((model: any) => ({
        name: typeof model?.name === 'string' ? model.name.replace(/^models\//, '') : '',
        displayName: model?.displayName || model?.name,
        description: model?.description,
        supportedGenerationMethods: model?.supportedGenerationMethods
      }))
      .filter((model: any) => Boolean(model.name));

    return {
      models: filtered
    };
  } catch (error) {
    return {
      models: [],
      error: error instanceof Error ? error.message : 'Failed to fetch model list'
    };
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body with error handling
    let body: RequestBody;
    
    try {
      const rawBody = await request.text();
      
      // Check if body is empty
      if (!rawBody) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Request body is empty',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }
      
      // Use our safe JSON parser
      const parseResult = safeJsonParse<RequestBody>(rawBody);
      
      if (!parseResult.success) {
        console.error('JSON Parse Error:', parseResult.error);
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Invalid JSON format: ${parseResult.error}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }
      
      body = parseResult.data!;
      
    } catch (error) {
      console.error('Body reading error:', error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Failed to read request body',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const validation = validateJsonStructure(body, ['prompt']);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Missing required fields: ${validation.missing.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Get Gemini API key from environment variables
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error('Gemini API Key not configured');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY in your environment variables.',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Build candidate model list (user value, env default, and fallbacks)
    const requestedModel = body.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const candidateModels = Array.from(
      new Set(
        [
          requestedModel,
          requestedModel.replace(/^models\//, ''),
          requestedModel.endsWith('-latest')
            ? requestedModel.replace(/-latest$/, '')
            : `${requestedModel}-latest`,
          process.env.GEMINI_MODEL,
          process.env.GEMINI_MODEL?.replace(/^models\//, ''),
          ...FALLBACK_GEMINI_MODELS
        ].filter(Boolean) as string[]
      )
    );

    // Prepare the request body for Gemini API
    const geminiRequestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: body.prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: body.temperature || 0.7,
        maxOutputTokens: body.maxTokens || 2048,
        topK: 40,
        topP: 0.95
      }
    };

    const requestPayload = JSON.stringify(geminiRequestBody);
    let lastErrorMessage = '';
    let lastStatusCode = 404;

    for (const candidate of candidateModels) {
      const normalizedModel = candidate.replace(/^models\//, '');
      console.log('Calling Gemini API with model:', normalizedModel);

      const { response, errorMessage, status } = await callGeminiWithRetry({
        apiKey,
        model: normalizedModel,
        body: requestPayload,
        maxRetries: 3
      });

      if (response) {
        const responseText = await response.text();
        const parseResult = safeJsonParse(responseText);

        if (!parseResult.success) {
          console.error('Failed to parse Gemini response:', responseText);
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: 'Invalid response format from Gemini API',
              timestamp: new Date().toISOString()
            },
            { status: 502 }
          );
        }

        const apiData = parseResult.data;

        let responseContent = '';
        if (apiData.candidates && apiData.candidates.length > 0) {
          const candidateResponse = apiData.candidates[0];
          if (candidateResponse.content && candidateResponse.content.parts) {
            responseContent = candidateResponse.content.parts
              .map((part: any) => part.text || '')
              .join('');
          }
        }

        if (!responseContent) {
          responseContent = apiData.text ||
            apiData.response ||
            apiData.result ||
            'No response generated';
        }

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              response: responseContent,
              model: normalizedModel,
              usage: apiData.usageMetadata || null,
              safetyRatings: apiData.candidates?.[0]?.safetyRatings || null,
              finishReason: apiData.candidates?.[0]?.finishReason || null,
              raw: apiData
            },
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );
      }

      lastErrorMessage = errorMessage || `Gemini API Error: ${status ?? 'unknown'}`;
      lastStatusCode = status || 500;

      if (status === 404) {
        continue;
      }

      if (status === 429 || status === 503) {
        console.warn(
          `Gemini rate limit/quota error for model ${normalizedModel}. Trying next candidate...`
        );
        continue;
      }

      console.error('Gemini API Error:', lastErrorMessage);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: lastErrorMessage,
          data: {
            attemptedModel: normalizedModel,
            status
          },
          timestamp: new Date().toISOString()
        },
        { status: status || 500 }
      );
    }

    const modelList = await listGeminiModels(apiKey);
    const errorMessage = lastErrorMessage || 'Requested model not available or does not support generateContent for this API version.';

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
        data: {
          attemptedModels: candidateModels,
          availableModels: modelList.models,
          availableModelsError: modelList.error
        },
        timestamp: new Date().toISOString()
      },
      { status: lastStatusCode || 404 }
    );

  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET() {
  const apiKey = await getGeminiApiKey();
  const apiKeyConfigured = !!apiKey;

  let modelList: GeminiModelListResult | null = null;
  if (apiKey) {
    modelList = await listGeminiModels(apiKey);
  }

  const availableModels = modelList?.models ?? [];
  const supportedModels = availableModels.map(model => model.name);
  const defaultModel = process.env.GEMINI_MODEL || supportedModels[0] || 'gemini-1.5-flash';
  
  return NextResponse.json<ApiResponse>(
    {
      success: true,
      data: {
        message: 'Gemini API Integration is ready!',
        endpoints: {
          POST: '/api/generate - Send a POST request with { prompt: "your prompt" }'
        },
        supportedModels,
        availableModels,
        modelsError: modelList?.error,
        defaultModel,
        environmentVariables: {
          configured: apiKeyConfigured,
          keys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
          status: apiKeyConfigured ? '✅ API key is configured' : '❌ API key is missing'
        },
        documentation: 'https://ai.google.dev/api/rest'
      },
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
