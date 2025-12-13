export type LearningStyle =
  | 'examples'
  | 'visual-metaphors'
  | 'formulas'
  | 'intuition-first'
  | 'default';

export type AttentionSpan = 'short' | 'medium' | 'long';

export type TutorUserProfile = {
  id: string;
  name: string;
  subjects: string[];
  goals: string;
  learningStyle: LearningStyle;
  attentionSpan: AttentionSpan;
  pastStruggles: string[];
  progressNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TutorMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  topic?: string;
  learningMode?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt?: string;
};

export type TopicProgress = {
  topic: string;
  confidence: number;
  lastStatus: 'struggling' | 'steady' | 'improving';
  struggleCount: number;
  successCount: number;
  lastLearningMode: boolean;
  updatedAt: string;
};

export type LearningSignals = {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  frustrationScore: number;
  learningMode: boolean;
  reasons: string[];
  recommendedPacing: 'slow' | 'normal';
  pastStrugglesHit: string[];
};

export type ChatApiResponse = {
  assistant: string;
  learningMode: boolean;
  signals: LearningSignals;
  topicProgress?: TopicProgress[];
  prompt?: string;
};
