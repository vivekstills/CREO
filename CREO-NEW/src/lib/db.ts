import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export type LearningStyle =
  | 'examples'
  | 'visual-metaphors'
  | 'formulas'
  | 'intuition-first'
  | 'default';

export type AttentionSpan = 'short' | 'medium' | 'long';

export type UserProfile = {
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

export type MessageRecord = {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  topic?: string | null;
  learningMode: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  frustrationScore: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type TopicProgress = {
  id: string;
  userId: string;
  topic: string;
  confidence: number;
  lastStatus: 'struggling' | 'steady' | 'improving';
  struggleCount: number;
  successCount: number;
  lastLearningMode: boolean;
  updatedAt: string;
  createdAt: string;
};

const DB_PATH = path.join(process.cwd(), 'data', 'learning.db');

let db: Database | null = null;

const ensureDatabase = (): Database => {
  if (db) return db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subjects TEXT DEFAULT '[]',
      goals TEXT DEFAULT '',
      learning_style TEXT DEFAULT 'default',
      attention_span TEXT DEFAULT 'medium',
      past_struggles TEXT DEFAULT '[]',
      progress_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      topic TEXT,
      learning_mode INTEGER DEFAULT 0,
      sentiment TEXT DEFAULT 'neutral',
      frustration_score REAL DEFAULT 0,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topic_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      confidence REAL DEFAULT 0.35,
      last_status TEXT DEFAULT 'steady',
      struggle_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      last_learning_mode INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, topic),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const createUserProfile = (data: Partial<UserProfile>): UserProfile => {
  const database = ensureDatabase();
  const id = data.id ?? randomUUID();
  const now = new Date().toISOString();

  const subjects = data.subjects ?? [];
  const pastStruggles = data.pastStruggles ?? [];

  database
    .prepare(
      `
        INSERT INTO users (id, name, subjects, goals, learning_style, attention_span, past_struggles, progress_notes, created_at, updated_at)
        VALUES (@id, @name, @subjects, @goals, @learningStyle, @attentionSpan, @pastStruggles, @progressNotes, @createdAt, @updatedAt)
      `
    )
    .run({
      id,
      name: data.name ?? 'Learner',
      subjects: JSON.stringify(subjects),
      goals: data.goals ?? '',
      learningStyle: data.learningStyle ?? 'default',
      attentionSpan: data.attentionSpan ?? 'medium',
      pastStruggles: JSON.stringify(pastStruggles),
      progressNotes: data.progressNotes ?? '',
      createdAt: now,
      updatedAt: now
    });

  return getUserProfile(id)!;
};

export const updateUserProfile = (id: string, data: Partial<UserProfile>): UserProfile | null => {
  const database = ensureDatabase();
  const existing = getUserProfile(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const merged: UserProfile = {
    ...existing,
    ...data,
    subjects: data.subjects ?? existing.subjects,
    pastStruggles: data.pastStruggles ?? existing.pastStruggles,
    learningStyle: data.learningStyle ?? existing.learningStyle,
    attentionSpan: data.attentionSpan ?? existing.attentionSpan,
    updatedAt: now
  };

  database
    .prepare(
      `
        UPDATE users
        SET name = @name,
            subjects = @subjects,
            goals = @goals,
            learning_style = @learningStyle,
            attention_span = @attentionSpan,
            past_struggles = @pastStruggles,
            progress_notes = @progressNotes,
            updated_at = @updatedAt
        WHERE id = @id
      `
    )
    .run({
      id,
      name: merged.name,
      subjects: JSON.stringify(merged.subjects),
      goals: merged.goals ?? '',
      learningStyle: merged.learningStyle,
      attentionSpan: merged.attentionSpan,
      pastStruggles: JSON.stringify(merged.pastStruggles),
      progressNotes: merged.progressNotes ?? '',
      updatedAt: now
    });

  return getUserProfile(id);
};

export const getUserProfile = (id: string): UserProfile | null => {
  const database = ensureDatabase();
  const row = database
    .prepare(
      `
        SELECT id, name, subjects, goals, learning_style as learningStyle, attention_span as attentionSpan,
               past_struggles as pastStruggles, progress_notes as progressNotes, created_at as createdAt, updated_at as updatedAt
        FROM users WHERE id = ?
      `
    )
    .get(id);

  if (!row) return null;

  return {
    ...row,
    subjects: parseJson<string[]>(row.subjects, []),
    pastStruggles: parseJson<string[]>(row.pastStruggles, [])
  };
};

export const listTopicProgress = (userId: string): TopicProgress[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, user_id as userId, topic, confidence, last_status as lastStatus,
               struggle_count as struggleCount, success_count as successCount,
               last_learning_mode as lastLearningMode, updated_at as updatedAt, created_at as createdAt
        FROM topic_progress WHERE user_id = ? ORDER BY updated_at DESC
      `
    )
    .all(userId);

  return rows.map((row) => ({
    ...row,
    lastLearningMode: Boolean(row.lastLearningMode)
  }));
};

export const upsertTopicProgress = (params: {
  userId: string;
  topic: string;
  learningMode: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  frustrationScore?: number;
}) => {
  const database = ensureDatabase();
  const now = new Date().toISOString();
  const existing = database
    .prepare(
      `
        SELECT id, confidence, struggle_count as struggleCount, success_count as successCount
        FROM topic_progress WHERE user_id = ? AND topic = ?
      `
    )
    .get(params.userId, params.topic) as
    | { id: string; confidence: number; struggleCount: number; successCount: number }
    | undefined;

  let confidence = existing?.confidence ?? 0.35;
  let struggleCount = existing?.struggleCount ?? 0;
  let successCount = existing?.successCount ?? 0;

  if (params.sentiment === 'positive') {
    confidence = Math.min(0.95, confidence + 0.08);
    successCount += 1;
  } else if (params.sentiment === 'negative') {
    confidence = Math.max(0.05, confidence - 0.05);
    struggleCount += 1;
  } else if (params.learningMode) {
    confidence = Math.max(0.1, confidence - 0.02);
    struggleCount += 1;
  } else {
    confidence = Math.min(0.9, confidence + 0.01);
  }

  const lastStatus: TopicProgress['lastStatus'] =
    struggleCount > successCount + 1 ? 'struggling' : confidence > 0.6 ? 'improving' : 'steady';

  if (existing) {
    database
      .prepare(
        `
          UPDATE topic_progress
          SET confidence = ?, last_status = ?, struggle_count = ?, success_count = ?,
              last_learning_mode = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(confidence, lastStatus, struggleCount, successCount, params.learningMode ? 1 : 0, now, existing.id);
    return listTopicProgress(params.userId).find((item) => item.topic === params.topic);
  }

  const id = randomUUID();
  database
    .prepare(
      `
        INSERT INTO topic_progress
          (id, user_id, topic, confidence, last_status, struggle_count, success_count, last_learning_mode, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(id, params.userId, params.topic, confidence, lastStatus, struggleCount, successCount, params.learningMode ? 1 : 0, now, now);

  return listTopicProgress(params.userId).find((item) => item.topic === params.topic);
};

export const recordMessage = (message: Omit<MessageRecord, 'createdAt' | 'id'> & { id?: string }) => {
  const database = ensureDatabase();
  const now = new Date().toISOString();
  const id = message.id ?? randomUUID();

  database
    .prepare(
      `
        INSERT INTO messages (id, user_id, role, content, topic, learning_mode, sentiment, frustration_score, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      id,
      message.userId,
      message.role,
      message.content,
      message.topic ?? null,
      message.learningMode ? 1 : 0,
      message.sentiment,
      message.frustrationScore ?? 0,
      message.metadata ? JSON.stringify(message.metadata) : null,
      now
    );

  return { ...message, id, createdAt: now };
};

export const getRecentMessages = (userId: string, limit = 15): MessageRecord[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, user_id as userId, role, content, topic,
               learning_mode as learningMode, sentiment, frustration_score as frustrationScore,
               metadata, created_at as createdAt
        FROM messages
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `
    )
    .all(userId, limit)
    .reverse();

  return rows.map((row) => ({
    ...row,
    learningMode: Boolean(row.learningMode),
    metadata: parseJson<Record<string, unknown>>(row.metadata, {})
  }));
};

export const listUsers = (): UserProfile[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, name, subjects, goals, learning_style as learningStyle, attention_span as attentionSpan,
               past_struggles as pastStruggles, progress_notes as progressNotes, created_at as createdAt, updated_at as updatedAt
        FROM users ORDER BY datetime(created_at) DESC
      `
    )
    .all();

  return rows.map((row) => ({
    ...row,
    subjects: parseJson<string[]>(row.subjects, []),
    pastStruggles: parseJson<string[]>(row.pastStruggles, [])
  }));
};
