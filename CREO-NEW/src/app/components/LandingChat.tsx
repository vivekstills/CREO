'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, MessageSquare, Turtle } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  learningMode?: boolean;
};

type ChatResponse = {
  assistant: string;
  learningMode: boolean;
};

const DEFAULT_PROFILE = {
  name: 'Explorer',
  subjects: ['fundamentals'],
  goals: 'Stay curious and build momentum',
  learningStyle: 'examples',
  attentionSpan: 'medium',
  pastStruggles: ['motivation']
};

const bubbleBase =
  'rounded-2xl px-3 py-2 text-sm shadow-sm border border-rose-100/60';

export default function LandingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'seed',
      role: 'assistant',
      learningMode: false,
      content:
        'Welcome! Tell me what you are studying and where you feel stuck. I will slow down when you need it.'
    }
  ]);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [learningMode, setLearningMode] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const ensureUser = async () => {
    if (userId) return userId;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_PROFILE)
    });
    if (!res.ok) throw new Error('Unable to create profile');
    const data = await res.json();
    const id = data?.data?.profile?.id as string;
    setUserId(id);
    return id;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setError('');
    const safeInput = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: safeInput, learningMode }
    ]);
    setPending(true);
    setInput('');

    try {
      const id = await ensureUser();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          message: safeInput,
          topic: topic || undefined
        })
      });

      if (!res.ok) {
        throw new Error('Tutor is unavailable. Try again soon.');
      }

      const payload = (await res.json()) as { data: ChatResponse };
      const assistantText = payload?.data?.assistant || 'I am here and ready to help.';

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantText,
          learningMode: Boolean(payload?.data?.learningMode)
        }
      ]);
      setLearningMode(Boolean(payload?.data?.learningMode));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-rose-100/70 bg-white/70 p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-semibold text-rose-900">
        <MessageSquare className="h-4 w-4" />
        Learning Coach (inline)
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] font-semibold ${
            learningMode
              ? 'bg-amber-100 text-amber-900 border border-amber-200'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
          }`}
        >
          {learningMode ? <Turtle className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
          {learningMode ? 'Learning Mode' : 'Coaching'}
        </span>
      </div>

      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`${bubbleBase} ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-[#1f120f] to-[#40221c] text-white border-[#1f120f]'
                  : 'bg-white text-[#1f120f]'
              }`}
            >
              {msg.learningMode && (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-900">
                  <Turtle className="h-3 w-3" />
                  Learning Mode
                </span>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {pending && (
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-rose-800">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional, e.g., prefix sums, SQL joins)"
          className="w-full rounded-2xl border border-rose-100 bg-white/90 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Tell me what you are stuck on or ask for a hint..."
            className="flex-1 rounded-2xl border border-rose-100 bg-white/90 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={sendMessage}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f120f] to-[#40221c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200/50 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
            Send
          </button>
        </div>
        {error && <p className="text-xs text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
