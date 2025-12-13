import { MessageRecord, UserProfile } from '@/lib/db';

type Sentiment = 'positive' | 'neutral' | 'negative';

export type LearningSignalBundle = {
  sentiment: Sentiment;
  sentimentScore: number;
  frustrationScore: number;
  learningMode: boolean;
  reasons: string[];
  recommendedPacing: 'slow' | 'normal';
  pastStrugglesHit: string[];
};

const FRUSTRATION_KEYWORDS = [
  'stuck',
  'blocked',
  'confused',
  'lost',
  'don\'t get',
  'don’t get',
  'overwhelmed',
  'burned out',
  'burnt out',
  'fail',
  'failing',
  'does not work',
  'doesn\'t work',
  'keep getting',
  'error',
  'panic',
  'hard',
  'no idea',
  'not sure how',
  'doubt'
];

const HESITATION_PATTERNS = ['maybe', 'i guess', 'i think', 'not sure', 'probably', 'hopefully'];

const POSITIVE_KEYWORDS = ['got it', 'makes sense', 'works', 'passed', 'win', 'solved', 'fixed', 'clicks'];

const normalize = (text: string) => text.toLowerCase().trim();

const countOccurrences = (text: string, keywords: string[]) =>
  keywords.reduce((acc, keyword) => (normalize(text).includes(keyword) ? acc + 1 : acc), 0);

export const scoreSentiment = (message: string): { sentiment: Sentiment; score: number } => {
  const normalized = normalize(message);
  const positiveHits = countOccurrences(normalized, POSITIVE_KEYWORDS);
  const frustrationHits = countOccurrences(normalized, FRUSTRATION_KEYWORDS);

  if (positiveHits > frustrationHits && positiveHits > 0) {
    return { sentiment: 'positive', score: Math.min(1, 0.2 + positiveHits * 0.2) };
  }

  if (frustrationHits > 0) {
    return { sentiment: 'negative', score: Math.min(1, 0.3 + frustrationHits * 0.15) };
  }

  return { sentiment: 'neutral', score: 0.4 };
};

export const detectLearningSignals = (params: {
  message: string;
  history: MessageRecord[];
  profile?: UserProfile | null;
  topic?: string;
  overrideMode?: 'learning' | 'normal';
}): LearningSignalBundle => {
  const reasons: string[] = [];
  const normalized = normalize(params.message);

  const { sentiment, score: sentimentScore } = scoreSentiment(params.message);
  let frustrationScore = sentiment === 'negative' ? sentimentScore : 0.2;

  const frustrationHits = FRUSTRATION_KEYWORDS.filter((kw) => normalized.includes(kw));
  frustrationScore += frustrationHits.length * 0.08;
  if (frustrationHits.length) reasons.push(`Keywords: ${frustrationHits.join(', ')}`);

  const hesitationHits = HESITATION_PATTERNS.filter((kw) => normalized.includes(kw));
  frustrationScore += hesitationHits.length * 0.05;
  if (hesitationHits.length) reasons.push('Hesitation detected');

  const recentUserMessages = params.history.filter((m) => m.role === 'user');
  const lastTwo = recentUserMessages.slice(-2);
  const hasRepeat =
    lastTwo.length === 2 && normalize(lastTwo[0].content) === normalize(lastTwo[1].content);
  if (hasRepeat) {
    frustrationScore += 0.1;
    reasons.push('Repeated question');
  }

  const consecutiveNegative = recentUserMessages
    .slice(-4)
    .filter((m) => m.sentiment === 'negative').length;
  if (consecutiveNegative >= 2) {
    frustrationScore += 0.12;
    reasons.push('Multiple negative turns');
  }

  const pastStrugglesHit =
    params.profile?.pastStruggles?.filter((struggle) =>
      normalized.includes(normalize(struggle))
    ) ?? [];
  if (pastStrugglesHit.length) {
    frustrationScore += 0.1;
    reasons.push('Past struggle resurfaced');
  }

  if (params.overrideMode === 'learning') {
    frustrationScore = Math.max(frustrationScore, 0.8);
    reasons.push('User requested Learning Mode');
  }

  const learningMode =
    params.overrideMode === 'learning' ||
    frustrationScore >= 0.55 ||
    (sentiment === 'negative' && consecutiveNegative >= 1) ||
    hesitationHits.length >= 2;

  const recommendedPacing: 'slow' | 'normal' =
    learningMode || params.profile?.attentionSpan === 'short' ? 'slow' : 'normal';

  return {
    sentiment,
    sentimentScore,
    frustrationScore: Math.min(1, frustrationScore),
    learningMode,
    reasons,
    recommendedPacing,
    pastStrugglesHit
  };
};
