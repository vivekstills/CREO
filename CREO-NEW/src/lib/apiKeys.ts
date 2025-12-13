'use strict';

const buildMissingKeyError = (service: string) =>
  `${service} API key not configured. Set ${service === 'Gemini' ? 'GEMINI_API_KEY or GOOGLE_API_KEY' : 'YOUTUBE_API_KEY'} in your environment.`;

export async function getGeminiApiKey(): Promise<string> {
  const key =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!key) {
    throw new Error(buildMissingKeyError('Gemini'));
  }
  return key;
}

export async function getYouTubeApiKey(): Promise<string> {
  const key =
    process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!key) {
    throw new Error(buildMissingKeyError('YouTube'));
  }
  return key;
}
