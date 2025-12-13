import { NextResponse } from 'next/server';
import { callGeminiWithRetry } from '@/app/utils/geminiClient';
import { getGeminiApiKey } from '@/lib/apiKeys';

// Simple test to verify Gemini API is working
export async function GET() {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not configured'
      });
    }

    // Test with a simple prompt - including latest models
    const models = [
      'gemini-2.0-flash-exp',
      'gemini-exp-1206',
      'gemini-exp-1121', 
      'gemini-1.5-flash-002',
      'gemini-1.5-flash',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro'
    ];
    
    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Return a simple JSON object with one field: {"status": "working"}'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100
      }
    };
    
    for (const model of models) {
      const { response, errorMessage } = await callGeminiWithRetry({
        apiKey,
        model,
        body: payload,
        maxRetries: 2
      });
      
      if (!response) {
        console.error(`Model ${model} failed: ${errorMessage || 'Unknown error'}`);
        continue;
      }

      const data = await response.json();
      let responseText = '';
      
      if (data.candidates && data.candidates[0]) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts) {
          responseText = candidate.content.parts
            .map((part: any) => part.text || '')
            .join('');
        }
      }

      return NextResponse.json({
        success: true,
        model: model,
        response: responseText,
        message: `Model ${model} is working!`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No models available',
      triedModels: models
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
