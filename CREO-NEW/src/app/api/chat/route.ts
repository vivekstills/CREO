import { NextRequest, NextResponse } from 'next/server';
import { buildTutorPrompt } from '@/app/lib/promptBuilder';
import { detectLearningSignals } from '@/app/lib/learningSignals';
import {
  getRecentMessages,
  getUserProfile,
  recordMessage,
  upsertTopicProgress,
  listTopicProgress
} from '@/lib/db';
import { getGeminiApiKey } from '@/lib/apiKeys';
import { callGeminiWithRetry } from '@/app/utils/geminiClient';
import { safeJsonParse } from '@/app/utils/jsonHelpers';

type ChatRequestBody = {
  userId: string;
  message: string;
  topic?: string;
  modeOverride?: 'learning' | 'normal';
  controls?: {
    hint?: boolean;
    explainDifferently?: boolean;
    simplify?: boolean;
    overwhelmed?: boolean;
  };
};

const fallbackTutor = (params: {
  name: string;
  learningMode: boolean;
  message: string;
  topic?: string;
  controls?: ChatRequestBody['controls'];
}) => {
  const controlText: string[] = [];
  if (params.controls?.hint) controlText.push('Here is a hint.');
  if (params.controls?.explainDifferently) controlText.push('I will reframe it differently.');
  if (params.controls?.simplify) controlText.push('I will simplify the language.');
  if (params.controls?.overwhelmed) controlText.push('Taking it slowly.');

  const prefix = params.learningMode
    ? `I hear you, ${params.name}. Let's slow down and tackle this step by step.`
    : `Let's move forward together, ${params.name}.`;

  const topicText = params.topic ? ` on ${params.topic}` : '';

  return `${prefix} ${controlText.join(' ')} Here is a small step${topicText}: identify what is confusing, state it in one sentence, then try a tiny example. What is the first piece you want to test?`;
};

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    if (!body.userId || !body.message) {
      return NextResponse.json(
        { success: false, error: 'userId and message are required' },
        { status: 400 }
      );
    }

    const profile = getUserProfile(body.userId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const history = getRecentMessages(body.userId, 18);
    const signals = detectLearningSignals({
      message: body.message,
      history,
      profile,
      topic: body.topic,
      overrideMode: body.modeOverride
    });

    const prompt = buildTutorPrompt({
      profile,
      signals,
      userMessage: body.message,
      topic: body.topic,
      controls: body.controls,
      history
    });

    recordMessage({
      userId: body.userId,
      role: 'user',
      content: body.message,
      topic: body.topic,
      learningMode: signals.learningMode,
      sentiment: signals.sentiment,
      frustrationScore: signals.frustrationScore,
      metadata: {
        controls: body.controls,
        modeOverride: body.modeOverride
      }
    });

    let assistantText = '';
    let modelUsed = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    let modelError: string | null = null;

    try {
      const apiKey = await getGeminiApiKey();
      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: signals.learningMode ? 0.45 : 0.65,
          maxOutputTokens: signals.learningMode ? 400 : 500
        }
      };

      const { response, errorMessage } = await callGeminiWithRetry({
        apiKey,
        model: modelUsed,
        body: requestBody
      });

      if (response) {
        const text = await response.text();
        const parsed = safeJsonParse(text);
        if (parsed.success && parsed.data?.candidates?.length) {
          const candidate = parsed.data.candidates[0];
          const parts = (candidate?.content?.parts ?? []) as Array<{ text?: string }>;
          assistantText =
            parts.map((part) => part.text || '').join('') ||
            candidate?.output_text ||
            '';
          modelUsed = parsed.data.model ?? modelUsed;
        } else {
          modelError = errorMessage || 'Invalid Gemini response';
        }
      } else {
        modelError = errorMessage || 'No Gemini response';
      }
    } catch (error) {
      modelError =
        error instanceof Error
          ? error.message
          : 'Gemini key missing or model call failed';
    }

    if (!assistantText) {
      assistantText = fallbackTutor({
        name: profile.name,
        learningMode: signals.learningMode,
        message: body.message,
        topic: body.topic,
        controls: body.controls
      });
    }

    const assistantRecord = recordMessage({
      userId: body.userId,
      role: 'assistant',
      content: assistantText,
      topic: body.topic,
      learningMode: signals.learningMode,
      sentiment: 'positive',
      frustrationScore: 0,
      metadata: {
        prompt,
        modelUsed,
        modelError
      }
    });

    if (body.topic) {
      upsertTopicProgress({
        userId: body.userId,
        topic: body.topic,
        learningMode: signals.learningMode,
        sentiment: signals.sentiment
      });
    }
    const progress = listTopicProgress(body.userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          assistant: assistantRecord.content,
          learningMode: signals.learningMode,
          signals,
          topicProgress: progress,
          prompt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/chat error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
