'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  Compass,
  Lightbulb,
  Loader2,
  MessageCircle,
  Sparkles,
  Turtle
} from 'lucide-react';
import {
  ChatApiResponse,
  LearningSignals,
  TopicProgress,
  TutorMessage,
  TutorUserProfile
} from '@/app/types/tutor';

const gradient = 'bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50';
const panel =
  'bg-white/70 border border-white/50 backdrop-blur-xl shadow-xl shadow-rose-100/40';

type ControlKey = 'hint' | 'explainDifferently' | 'simplify' | 'overwhelmed';

const DEFAULT_PROFILE: Partial<TutorUserProfile> = {
  name: 'Explorer',
  subjects: ['algorithms', 'systems'],
  goals: 'Prepare for upcoming interviews and exams',
  learningStyle: 'examples',
  attentionSpan: 'medium',
  pastStruggles: ['prefix sums', 'dynamic programming']
};

const MessageBubble = ({ message }: { message: TutorMessage }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-[#1f120f] to-[#40221c] text-white shadow-lg shadow-rose-200/40'
            : 'bg-white text-[#1f120f] border border-rose-100/60 shadow'
        }`}
      >
        {message.learningMode && (
          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-amber-900">
            <Turtle className="h-3 w-3" />
            Learning Mode
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

const ProgressPill = ({ progress }: { progress: TopicProgress }) => {
  const percent = Math.round(progress.confidence * 100);
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
        <span>{progress.topic}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-50">
        <div
          className={`h-full rounded-full ${
            progress.lastStatus === 'struggling'
              ? 'bg-amber-400'
              : progress.lastStatus === 'improving'
              ? 'bg-emerald-500'
              : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.max(10, percent)}%` }}
        />
      </div>
      <div className="mt-1 text-[0.7rem] uppercase tracking-wide text-emerald-700">
        {progress.lastStatus}
      </div>
    </div>
  );
};

export default function TutorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<TutorUserProfile | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [learningMode, setLearningMode] = useState(false);
  const [signals, setSignals] = useState<LearningSignals | null>(null);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('');
  const [pending, setPending] = useState(false);
  const [controls, setControls] = useState<Record<ControlKey, boolean>>({
    hint: false,
    explainDifferently: false,
    simplify: false,
    overwhelmed: false
  });

  const bootstrapProfile = async (existingId?: string | null) => {
    try {
      if (existingId) {
        const res = await fetch(`/api/users?id=${existingId}`);
        if (res.ok) {
          const payload = await res.json();
          setProfile(payload.data.profile);
          setProgress(payload.data.progress ?? []);
          setMessages(payload.data.history ?? []);
          setUserId(existingId);
          setLearningMode(Boolean(payload.data.history?.some((m: TutorMessage) => m.learningMode)));
          return;
        }
      }

      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_PROFILE)
      });
      if (createRes.ok) {
        const payload = await createRes.json();
        setProfile(payload.data.profile);
        setProgress(payload.data.progress ?? []);
        setUserId(payload.data.profile.id);
        localStorage.setItem('creoTutorUserId', payload.data.profile.id);
      }
    } catch (error) {
      console.error('Failed to bootstrap profile', error);
    }
  };

  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('creoTutorUserId') : null;
    bootstrapProfile(storedId);
  }, []);

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      userId,
      name: formData.get('name') as string,
      goals: formData.get('goals') as string,
      subjects: ((formData.get('subjects') as string) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      learningStyle: (formData.get('learningStyle') as string) || 'default',
      attentionSpan: (formData.get('attentionSpan') as string) || 'medium',
      pastStruggles: ((formData.get('pastStruggles') as string) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      progressNotes: formData.get('progressNotes') as string
    };

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      setProfile(data.data.profile);
      setProgress(data.data.progress ?? []);
    }
  };

  const sendMessage = async (override?: Partial<Record<ControlKey, boolean>>) => {
    if (!input.trim() || !userId) return;
    const mergedControls = { ...controls, ...(override ?? {}) };
    setControls(mergedControls);

    const userMessage: TutorMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      topic,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setPending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: input,
          topic: topic || undefined,
          controls: mergedControls,
          modeOverride: mergedControls.overwhelmed ? 'learning' : undefined
        })
      });

      if (!res.ok) {
        const fallback: TutorMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'I could not reach the tutor brain right now. Try again in a moment.',
          learningMode: false
        };
        setMessages((prev) => [...prev, fallback]);
        return;
      }

      const payload = (await res.json()) as { data: ChatApiResponse };
      const assistant: TutorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.data.assistant,
        learningMode: payload.data.learningMode
      };
      setMessages((prev) => [...prev, assistant]);
      setLearningMode(payload.data.learningMode);
      setSignals(payload.data.signals);
      setProgress(payload.data.topicProgress ?? []);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setPending(false);
      setInput('');
      setControls({
        hint: false,
        explainDifferently: false,
        simplify: false,
        overwhelmed: false
      });
    }
  };

  const actionButtons: { key: ControlKey; label: string; copy: string }[] = useMemo(
    () => [
      { key: 'hint', label: 'Give me a hint', copy: 'Can I get a hint?' },
      { key: 'explainDifferently', label: 'Explain differently', copy: 'Explain this differently.' },
      { key: 'simplify', label: 'Simplify', copy: 'Can you simplify this?' },
      { key: 'overwhelmed', label: "I'm overwhelmed", copy: "I'm overwhelmed. Slow down." }
    ],
    []
  );

  return (
    <div className={`min-h-screen ${gradient} text-[#1f120f]`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-col gap-3 rounded-3xl border border-rose-100 bg-white/70 p-5 shadow-xl shadow-rose-100/60 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-gradient-to-br from-[#1f120f] to-[#40221c] p-3 text-white shadow-lg shadow-rose-200/60">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-500">Tutor cockpit</p>
              <h1 className="text-2xl font-semibold text-[#1f120f]">Personalized AI Learning Coach</h1>
              <p className="text-sm text-[#5b4743]">
                Detects blockers, switches to Learning Mode, and adapts pacing to keep you moving.
              </p>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              learningMode
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
            {learningMode ? <Turtle className="h-4 w-4" /> : <BoltIcon />}
            {learningMode ? 'Learning Mode Active' : 'Coaching Mode'}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className={`rounded-3xl ${panel} p-4`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-900">
              <Compass className="h-4 w-4" />
              Learner Profile
            </div>
            <form className="mt-3 space-y-3" onSubmit={updateProfile}>
              <input
                name="name"
                defaultValue={profile?.name ?? DEFAULT_PROFILE.name}
                placeholder="Name"
                className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
              />
              <input
                name="goals"
                defaultValue={profile?.goals ?? DEFAULT_PROFILE.goals}
                placeholder="Goals"
                className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
              />
              <input
                name="subjects"
                defaultValue={profile?.subjects?.join(', ') ?? DEFAULT_PROFILE.subjects?.join(', ')}
                placeholder="Subjects (comma separated)"
                className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-rose-900">Style</span>
                  <select
                    name="learningStyle"
                    defaultValue={profile?.learningStyle ?? 'examples'}
                    className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 focus:border-rose-300 focus:outline-none"
                  >
                    <option value="examples">Examples</option>
                    <option value="visual-metaphors">Visual</option>
                    <option value="formulas">Formulas</option>
                    <option value="intuition-first">Intuition first</option>
                    <option value="default">Balanced</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-rose-900">Attention</span>
                  <select
                    name="attentionSpan"
                    defaultValue={profile?.attentionSpan ?? 'medium'}
                    className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 focus:border-rose-300 focus:outline-none"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </label>
              </div>
              <textarea
                name="pastStruggles"
                defaultValue={profile?.pastStruggles?.join(', ') ?? DEFAULT_PROFILE.pastStruggles?.join(', ')}
                placeholder="Past struggles (comma separated)"
                className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
              />
              <textarea
                name="progressNotes"
                defaultValue={profile?.progressNotes ?? ''}
                placeholder="Progress notes / current blockers"
                className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#1f120f] to-[#40221c] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200/40 transition hover:-translate-y-0.5"
              >
                Save profile
              </button>
            </form>

            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <Activity className="h-4 w-4" />
                Progress signals
              </div>
              {progress.length === 0 && (
                <p className="text-xs text-rose-800">Progress will appear once you start chatting.</p>
              )}
              <div className="grid gap-2">
                {progress.slice(0, 4).map((item) => (
                  <ProgressPill key={item.topic} progress={item} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className={`rounded-3xl ${panel} p-4`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-900">
                  <Sparkles className="h-4 w-4" />
                  Adaptive feedback
                </div>
                {signals?.reasons?.length ? (
                  <div className="text-xs text-rose-800">
                    {signals.reasons.join(' · ')}
                  </div>
                ) : (
                  <div className="text-xs text-rose-800">We watch for struggle, hesitation, and repetition.</div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {actionButtons.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => {
                      setInput(action.copy);
                      if (action.key === 'overwhelmed') {
                        setLearningMode(true);
                      }
                      setControls((prev) => ({ ...prev, [action.key]: true }));
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      controls[action.key]
                        ? 'border-rose-300 bg-rose-100 text-rose-900'
                        : 'border-rose-100 bg-white text-rose-800 hover:border-rose-200'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl ${panel} p-4`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-900">
                <MessageCircle className="h-4 w-4" />
                Coaching dialogue
              </div>

              <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto pr-2">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-rose-100 bg-white/70 p-4 text-sm text-rose-800">
                    Say hello and tell the tutor what you are working on. Mention where you feel stuck to trigger Learning Mode.
                  </div>
                )}
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-white px-3 py-2 text-xs text-rose-800">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic (ex: prefix sums, SQL joins, thermodynamics)"
                  className="w-full rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question, describe a blocker, or request a checkpoint..."
                    className="flex-1 rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={pending || !input.trim() || !userId}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f120f] to-[#40221c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
