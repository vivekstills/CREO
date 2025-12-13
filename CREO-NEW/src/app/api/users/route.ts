import { NextRequest, NextResponse } from 'next/server';
import {
  AttentionSpan,
  LearningStyle,
  createUserProfile,
  getRecentMessages,
  getUserProfile,
  listTopicProgress,
  listUsers,
  updateUserProfile
} from '@/lib/db';

type UserPayload = {
  userId?: string;
  name?: string;
  subjects?: string[];
  goals?: string;
  learningStyle?: LearningStyle;
  attentionSpan?: AttentionSpan;
  pastStruggles?: string[];
  progressNotes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: UserPayload = await request.json();
    const payload: UserPayload = {
      name: body.name ?? 'Learner',
      subjects: body.subjects ?? [],
      goals: body.goals ?? '',
      learningStyle: body.learningStyle ?? 'default',
      attentionSpan: body.attentionSpan ?? 'medium',
      pastStruggles: body.pastStruggles ?? [],
      progressNotes: body.progressNotes ?? ''
    };

    const profile = body.userId
      ? updateUserProfile(body.userId, payload)
      : createUserProfile(payload);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found for update' },
        { status: 404 }
      );
    }

    const progress = listTopicProgress(profile.id);

    return NextResponse.json(
      { success: true, data: { profile, progress } },
      { status: body.userId ? 200 : 201 }
    );
  } catch (error) {
    console.error('POST /api/users error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save user profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');

    if (id) {
      const user = getUserProfile(id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const progress = listTopicProgress(id);
      const history = getRecentMessages(id, 20);
      return NextResponse.json(
        { success: true, data: { profile: user, progress, history } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: { users: listUsers() } },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/users error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
