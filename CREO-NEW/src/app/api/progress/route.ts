import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, listTopicProgress, upsertTopicProgress } from '@/lib/db';

type ProgressPayload = {
  userId: string;
  topic: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  learningMode?: boolean;
};

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  const progress = listTopicProgress(userId);
  return NextResponse.json({ success: true, data: { progress } });
}

export async function POST(request: NextRequest) {
  try {
    const body: ProgressPayload = await request.json();
    if (!body.userId || !body.topic) {
      return NextResponse.json(
        { success: false, error: 'userId and topic are required' },
        { status: 400 }
      );
    }

    const user = getUserProfile(body.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const record = upsertTopicProgress({
      userId: body.userId,
      topic: body.topic,
      learningMode: Boolean(body.learningMode),
      sentiment: body.sentiment ?? 'neutral'
    });

    const progress = listTopicProgress(body.userId);

    return NextResponse.json(
      { success: true, data: { progress, record } },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/progress error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
