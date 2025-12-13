'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Clock3, Lock, NotebookPen } from 'lucide-react';
import { Inter } from 'next/font/google';
import { CourseModule, CourseTopic } from '@/app/types/course';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] });

type ModuleStatus = 'done' | 'current' | 'locked';

type JourneyResource = {
  label: string;
  detail: string;
};

type JourneyModule = {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: ModuleStatus;
  resources: JourneyResource[];
  quiz: string[];
  practice: string[];
  reflectionPrompt: string;
};

const chipStyles: Record<ModuleStatus, { label: string; className: string }> = {
  done: {
    label: 'Completed',
    className: 'bg-white/80 text-[#a05a5a]'
  },
  current: {
    label: 'In Progress',
    className: 'bg-[#fceaea] text-[#c05656]'
  },
  locked: {
    label: 'Locked',
    className: 'bg-white/60 text-[#b08c84]'
  }
};

const mapTopicsToResources = (topics: CourseTopic[] = []): JourneyResource[] => {
  const mapped: JourneyResource[] = [];
  topics.slice(0, 3).forEach((topic) => {
    if (topic.videos?.length) {
      const video = topic.videos[0];
      mapped.push({ label: video.title, detail: video.duration || 'Short watch' });
    } else {
      mapped.push({ label: topic.title, detail: 'Quick read' });
    }
  });
  return mapped;
};

const hydrateModules = (courseModules?: CourseModule[]): JourneyModule[] => {
  if (!courseModules || !courseModules.length) return [];
  return courseModules.map((module, index) => {
    const status: ModuleStatus = index === 0 ? 'current' : 'locked';
    const resources = mapTopicsToResources(module.topics);
    if (module.assessment?.problemSetTitle) {
      resources.push({
        label: module.assessment.problemSetTitle,
        detail: `${module.assessment.problemPrompts?.length || 1} prompts`
      });
    }
    return {
      id: module.id,
      title: module.title,
      description: module.description,
      duration: module.estimatedDuration || 'Self-paced',
      status,
      resources,
      quiz: module.assessment?.quizQuestions || [],
      practice: module.assessment?.problemPrompts || [],
      reflectionPrompt: module.assessment?.quizTitle || `What did you learn in ${module.title}?`
    };
  });
};

type CourseJourneyProps = {
  modules?: CourseModule[];
  title?: string;
};

export default function CourseJourney({ modules: courseModules, title }: CourseJourneyProps) {
  const hydratedModules = useMemo(() => hydrateModules(courseModules), [courseModules]);
  const [modules, setModules] = useState<JourneyModule[]>(hydratedModules);
  const [expandedModule, setExpandedModule] = useState<string | null>(hydratedModules[0]?.id ?? null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openResources, setOpenResources] = useState<Record<string, boolean>>({});
  const [openPractice, setOpenPractice] = useState<Record<string, boolean>>({});

  const completedCount = useMemo(() => modules.filter((module) => module.status === 'done').length, [modules]);
  const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  const markModuleComplete = (moduleId: string) => {
    setModules((prev) => {
      const next = prev.map((module) => (module.id === moduleId ? { ...module, status: 'done' } : module));
      const hasCurrent = next.some((module) => module.status === 'current');
      if (!hasCurrent) {
        const nextLockedIndex = next.findIndex((module) => module.status === 'locked');
        if (nextLockedIndex !== -1) {
          const nextModule = { ...next[nextLockedIndex], status: 'current' };
          next[nextLockedIndex] = nextModule;
          setExpandedModule(nextModule.id);
        }
      }
      return next;
    });
  };

  const renderModule = (module: JourneyModule, index: number) => {
    const isExpanded = expandedModule === module.id;
    return (
      <motion.div
        key={module.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-[#f4dfd6] bg-white p-5 shadow-sm"
      >
        <button
          type="button"
          onClick={() => setExpandedModule((prev) => (prev === module.id ? null : module.id))}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c39b91]">Module {index + 1}</p>
            <h3 className="text-lg font-semibold text-[#321f17]">{module.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-[0.6rem] font-semibold ${chipStyles[module.status].className}`}>
              {chipStyles[module.status].label}
            </span>
            <div className="flex items-center gap-2 text-sm text-[#b27c74]">
              <Clock3 className="h-4 w-4" />
              <span>{module.duration}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#b27c74] transition ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[#6f5a56]">{module.description}</p>
                <div className="flex flex-wrap gap-2">
                  {module.resources.map((resource) => (
                    <span key={`${module.id}-${resource.label}`} className="rounded-full border border-[#f4dfd6] bg-[#fffaf6] px-3 py-1 text-xs text-[#b27c74]">
                      {resource.label} · {resource.detail}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setOpenResources((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#f4dfd6] bg-white px-4 py-2 text-xs font-semibold text-[#b27c74]"
                  >
                    <span>Resources for this step</span>
                    <ChevronDown className={`h-4 w-4 transition ${openResources[module.id] ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openResources[module.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-2xl border border-[#f4dfd6] bg-white p-3 text-xs text-[#5b4743]"
                      >
                        {module.resources.map((resource) => (
                          <div key={`${module.id}-${resource.label}-detail`} className="flex items-center justify-between py-1">
                            <p className="font-semibold text-[#341f18]">{resource.label}</p>
                            <span className="text-[#a07269]">{resource.detail}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setOpenPractice((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#f4dfd6] bg-white px-4 py-2 text-xs font-semibold text-[#b27c74]"
                  >
                    <span>Exercises & practice</span>
                    <ChevronDown className={`h-4 w-4 transition ${openPractice[module.id] ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openPractice[module.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 rounded-2xl border border-[#f4dfd6] bg-[#fff6f3] p-3 text-xs text-[#5b4743]"
                      >
                        <div>
                          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#c39b91]">Quiz</p>
                          {module.quiz.length ? (
                            <ol className="mt-1 list-decimal list-inside space-y-1">
                              {module.quiz.map((question) => (
                                <li key={`${module.id}-${question}`}>{question}</li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-[#a1a1a1]">Quiz questions coming soon.</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#c39b91]">Problem set</p>
                          {module.practice.length ? (
                            <ul className="mt-1 list-disc list-inside space-y-1">
                              {module.practice.map((prompt) => (
                                <li key={`${module.id}-${prompt}`}>{prompt}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[#a1a1a1]">Practice prompts coming soon.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c39b91]">Reflection</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#b27c74]">
                    <NotebookPen className="h-4 w-4" />
                    <span>{notes[module.id]?.length ? `${notes[module.id].length} chars` : module.reflectionPrompt}</span>
                  </div>
                  <textarea
                    value={notes[module.id] || ''}
                    onChange={(event) =>
                      setNotes((prev) => ({ ...prev, [module.id]: event.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-[#f4dfd6] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9a8a8]/40"
                    placeholder={module.reflectionPrompt}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {module.status === 'current' && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => markModuleComplete(module.id)}
                      className="rounded-full bg-gradient-to-r from-[#f9baba] to-[#f2b6b6] px-4 py-2 text-xs font-semibold text-[#4b2323] shadow-[0_8px_20px_rgba(249,168,168,0.35)] transition hover:opacity-90"
                    >
                      Mark complete
                    </motion.button>
                  )}
                  {module.status === 'done' && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#3f7b62]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                  )}
                  {module.status === 'locked' && (
                    <div className="flex items-center gap-2 text-sm text-[#b08c84]">
                      <Lock className="h-4 w-4" />
                      <span>Unlocks after the previous module</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <section className={`${inter.className} space-y-6 rounded-[32px] border border-[#f2dfd7] bg-white p-6 shadow-[0_20px_60px_rgba(34,20,12,0.08)]`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#c39b91]">Learning journey</p>
          <h2 className="text-2xl font-semibold text-[#321f17]">{title || 'Your personal path'}</h2>
        </div>
        <div className="text-sm text-[#b27c74]">
          <Clock3 className="mr-2 inline h-4 w-4 align-middle" />
          <span>{progressPct}% complete</span>
        </div>
      </div>
      <div className="rounded-full border border-[#f4dfd6] bg-[#fff7f4] p-1">
        <div className="h-2 rounded-full bg-[#f4dfd6]">
          <div className="h-2 rounded-full bg-gradient-to-r from-[#fce3e3] to-[#f9a8a8] transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
      <div className="space-y-5">
        {modules.map((module, index) => renderModule(module, index))}
      </div>
    </section>
  );
}
