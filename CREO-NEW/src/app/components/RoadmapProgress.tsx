'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Lock,
  PlayCircle,
  Sparkles,
  X
} from 'lucide-react';
import { Inter } from 'next/font/google';

type ModuleStatus = 'done' | 'current' | 'locked';

type ModuleResource = {
  title: string;
  type: 'video' | 'note' | 'assignment';
  length: string;
};

type Module = {
  id: string;
  title: string;
  status: ModuleStatus;
  duration: string;
  description: string;
  resources: ModuleResource[];
};

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const roadmapTemplate: Module[] = [
  {
    id: 'm1',
    title: 'Introduction',
    status: 'done',
    duration: '45 min',
    description: 'Set the tone for the sprint, meet your mentor, and collect a quick win.',
    resources: [
      { title: 'Welcome Stream', type: 'video', length: '12 min' },
      { title: 'Mindset micro-note', type: 'note', length: '5 min' },
      { title: 'Reflection prompt', type: 'assignment', length: '10 min' }
    ]
  },
  {
    id: 'm2',
    title: 'Vectors & Matrices',
    status: 'done',
    duration: '2 h',
    description: 'Work through geometric intuition with guided visual labs and memory hooks.',
    resources: [
      { title: 'Visual notebook', type: 'note', length: '16 slides' },
      { title: 'Problem sprint', type: 'assignment', length: '30 min' },
      { title: 'Studio walkthrough', type: 'video', length: '22 min' }
    ]
  },
  {
    id: 'm3',
    title: 'Eigenvalues & PCA',
    status: 'current',
    duration: '2 h 30 min',
    description: 'Translate eigen insight into a PCA mini-project with beautiful, intuitive visuals.',
    resources: [
      { title: 'Guided PCA lab', type: 'assignment', length: '45 min' },
      { title: 'Explainer: eigen magic', type: 'video', length: '18 min' },
      { title: 'Notebook template', type: 'note', length: '8 pages' }
    ]
  },
  {
    id: 'm4',
    title: 'Projects & Practice',
    status: 'locked',
    duration: '3 h',
    description: 'Ship a polished deliverable and practice articulating your thinking to peers.',
    resources: [
      { title: 'Showcase brief', type: 'assignment', length: '60 min' },
      { title: 'Peer review kit', type: 'note', length: '20 min' },
      { title: 'Studio hours', type: 'video', length: 'Live' }
    ]
  }
];

const buildRoadmapState = (): Module[] =>
  roadmapTemplate.map((module) => ({
    ...module,
    resources: module.resources.map((resource) => ({ ...resource }))
  }));

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

export default function RoadmapProgress() {
  const [modules, setModules] = useState<Module[]>(() => buildRoadmapState());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const completedCount = useMemo(() => modules.filter((m) => m.status === 'done').length, [modules]);
  const progressPct = useMemo(
    () => Math.round((completedCount / modules.length) * 100),
    [completedCount, modules.length]
  );
  const currentModule = modules.find((module) => module.status === 'current') ?? null;

  const advanceProgress = () => {
    setModules((prev) => {
      const next = prev.map((module) => ({ ...module }));
      const currentIdx = next.findIndex((module) => module.status === 'current');

      if (currentIdx === -1) {
        return next;
      }

      next[currentIdx] = { ...next[currentIdx], status: 'done' };
      if (next[currentIdx + 1]) {
        next[currentIdx + 1] = { ...next[currentIdx + 1], status: 'current' };
      }

      return next;
    });
  };

  const resetProgress = () => {
    setModules(buildRoadmapState());
  };

  const statusIcon = (status: ModuleStatus) => {
    if (status === 'done') return <CheckCircle2 className="h-4 w-4" />;
    if (status === 'current') return <Sparkles className="h-4 w-4" />;
    return <Lock className="h-4 w-4" />;
  };

  const renderTimelineNode = (module: Module, index: number) => {
    const isCompleted = module.status === 'done';
    const isCurrent = module.status === 'current';
    const circleClass = isCompleted
      ? 'bg-gradient-to-br from-[#fce3e3] via-[#f9baba] to-[#fce3e3] border-transparent text-[#8c3b3b] shadow-[0_12px_30px_rgba(249,168,168,0.3)]'
      : isCurrent
        ? 'bg-white border-[#f9a8a8] text-[#b04f4f] shadow-[0_10px_35px_rgba(249,168,168,0.28)]'
        : 'bg-white border-[#f2dfd7] text-[#b7948c] shadow-[0_8px_20px_rgba(176,149,140,0.12)]';

    return (
      <div key={module.id} className="relative grid grid-cols-[auto_1fr] gap-6">
        <div className="flex flex-col items-center">
          <motion.div
            animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={isCurrent ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
            className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 font-semibold ${circleClass}`}
          >
            <span>{index + 1}</span>
            {isCurrent && (
              <motion.span
                layoutId="current-glow"
                className="pointer-events-none absolute inset-0 rounded-full"
                initial={false}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'radial-gradient(circle at center, rgba(249,168,168,0.65), transparent 65%)',
                  filter: 'blur(1px)'
                }}
              />
            )}
          </motion.div>
          {index < modules.length - 1 && (
            <div className="relative mt-3 flex h-24 w-14 justify-center">
              <span className="absolute left-1/2 h-full -translate-x-1/2 border-l-2 border-dotted border-[#ead2ca]" />
              {(isCompleted || isCurrent) && (
                <span
                  className="absolute left-1/2 h-full w-1 -translate-x-1/2 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #fce3e3 0%, #f9a8a8 100%)',
                    boxShadow: '0 0 16px rgba(249,168,168,0.55)',
                    animation: `${isCompleted ? 'pathGlow' : 'pathGlowSoft'} 3s ease-in-out infinite`
                  }}
                />
              )}
            </div>
          )}
        </div>
        <motion.button
          type="button"
          onClick={() => setSelectedModule(module)}
          whileHover={{ translateX: 4 }}
          className={`group relative w-full rounded-[28px] border px-6 py-5 text-left transition-colors ${
            isCompleted
              ? 'border-transparent bg-gradient-to-r from-[#fef6f4] via-[#fde9e6] to-[#fff9f6]'
              : isCurrent
                ? 'border-[#f9a8a8] bg-white'
                : 'border-[#f2dfd7] bg-white/70'
          }`}
        >
          {isCurrent && (
            <motion.span
              layoutId="card-glow"
              className="pointer-events-none absolute inset-0 rounded-[28px]"
              initial={false}
              animate={{ opacity: [0.25, 0.6, 0.25] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'linear-gradient(120deg, rgba(249,168,168,0.35), rgba(242,182,182,0.35))',
                filter: 'blur(18px)'
              }}
            />
          )}

          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                chipStyles[module.status].className
              }`}
            >
              {statusIcon(module.status)}
              {chipStyles[module.status].label}
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-[#a07269]">
              <Clock3 className="h-4 w-4" />
              {module.duration}
            </span>
          </div>

          <h3 className="relative mt-4 text-xl font-semibold text-[#35221c]">{module.title}</h3>
          <p className="relative mt-2 text-sm text-[#8e6c61]">{module.description}</p>

          <div className="relative mt-4 flex flex-wrap gap-3">
            {module.resources.map((resource) => (
              <span
                key={`${module.id}-${resource.title}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#f4dfd6] bg-white/80 px-4 py-1.5 text-xs font-medium text-[#b27c74]"
              >
                <BookOpenText className="h-3.5 w-3.5" />
                {resource.title}
              </span>
            ))}
          </div>

          <div className="relative mt-5 flex items-center gap-2 text-sm font-semibold text-[#d07070]">
            <span>View resources</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.button>
      </div>
    );
  };

  return (
    <>
      <section
        className={`${inter.className} relative w-full max-w-4xl rounded-[38px] border border-[#f2dfd7] bg-[#fffaf6]/95 p-8 shadow-[0_35px_90px_rgba(34,20,12,0.08)]`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c39b91]">Looplearn path</p>
              <h2 className="mt-1 text-3xl font-semibold text-[#321f17]">Elegant Progress Map</h2>
            </div>
            <div className="text-right">
              <span className="text-5xl font-semibold text-[#de7d7d]">{progressPct}%</span>
              <p className="text-sm text-[#a57c70]">complete</p>
            </div>
          </div>

          <div className="rounded-[999px] border border-[#f5e4dd] bg-white/60 p-2 backdrop-blur">
            <div className="h-3 w-full rounded-full bg-[#f4dfd6]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #fce3e3, #f9baba)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {currentModule && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#f9e1dc] bg-white/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#fce3e3] to-[#f9baba]"
                >
                  <PlayCircle className="h-5 w-5 text-[#b04f4f]" />
                </motion.div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c39b91]">Now learning</p>
                  <p className="text-base font-semibold text-[#3c271f]">{currentModule.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={advanceProgress}
                  disabled={!currentModule}
                  className="rounded-full bg-gradient-to-r from-[#f9baba] to-[#f2b6b6] px-4 py-2 text-sm font-semibold text-[#4b2323] shadow-[0_10px_25px_rgba(249,168,168,0.4)] transition hover:opacity-90 disabled:opacity-60"
                >
                  Mark complete
                </button>
                <button
                  type="button"
                  onClick={resetProgress}
                  className="rounded-full border border-[#f2dfd7] px-4 py-2 text-sm font-semibold text-[#9d756b] transition hover:border-[#f9a8a8] hover:text-[#c35f58]"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-8">{modules.map((module, index) => renderTimelineNode(module, index))}</div>
        </div>
      </section>

      <AnimatePresence>
        {selectedModule && (
          <motion.div
            key="roadmap-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(35,20,15,0.55)] backdrop-blur-sm"
            onClick={() => setSelectedModule(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="relative w-full max-w-lg rounded-[32px] border border-[#f2dfd7] bg-[#fffaf6] p-8 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="absolute right-4 top-4 rounded-full border border-[#f4dfd6] p-2 text-[#a67a70] transition hover:border-[#f9a8a8] hover:text-[#c35e5e]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-col gap-2">
                <span
                  className={`flex w-max items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    chipStyles[selectedModule.status].className
                  }`}
                >
                  {statusIcon(selectedModule.status)}
                  {chipStyles[selectedModule.status].label}
                </span>
                <h3 className="text-2xl font-semibold text-[#321f17]">{selectedModule.title}</h3>
                <p className="text-sm text-[#8d6a60]">{selectedModule.description}</p>
              </div>
              <div className="mt-6 rounded-3xl border border-[#f4dfd6] bg-white/80 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-[#a07269]">
                  <Clock3 className="h-4 w-4" />
                  {selectedModule.duration}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#c39b91]">Resources</p>
                <ul className="mt-3 space-y-3">
                  {selectedModule.resources.map((resource) => (
                    <li
                      key={`${selectedModule.id}-${resource.title}`}
                      className="flex items-center justify-between rounded-2xl border border-[#f5e1db] bg-[#fffaf6] px-4 py-3 text-sm text-[#3b251d]"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpenText className="h-4 w-4 text-[#d07a7a]" />
                        <div>
                          <p className="font-semibold">{resource.title}</p>
                          <p className="text-xs uppercase tracking-wide text-[#ac7e75]">{resource.type}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#b47d74]">{resource.length}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {selectedModule.status === 'locked' && (
                <p className="mt-4 text-center text-sm text-[#b58a81]">
                  Unlock this module by lighting up the path before it.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pathGlow {
          0% {
            opacity: 0.3;
            box-shadow: 0 0 6px rgba(249, 168, 168, 0.4);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(249, 168, 168, 0.55);
          }
          100% {
            opacity: 0.3;
            box-shadow: 0 0 6px rgba(249, 168, 168, 0.4);
          }
        }

        @keyframes pathGlowSoft {
          0% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>
    </>
  );
}
