'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, BookOpenCheck, GraduationCap, Sparkles, Star, TrendingUp, Moon, Sun } from 'lucide-react';
import CourseProgress from '@/app/components/CourseProgress';
import { Course } from '@/app/types/course';
import Waves from '@/app/components/Waves';
import FloatingElement from '@/app/components/FloatingElement';
import { HERO_FLOATING_ELEMENTS } from '@/app/config/heroFloatingElements';
import LandingChat from '@/app/components/LandingChat';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700', '900'] });
const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

const AuthDialogue = ({ onClose, isDark }: { onClose: () => void; isDark: boolean }) => (
  <div className={`absolute right-0 top-12 z-30 w-80 rounded-3xl border ${
    isDark ? 'border-[#3a2f2a] bg-[#1f1410]' : 'border-[#f2e1d8] bg-white'
  } p-6 shadow-xl transition-colors duration-300`}>
    <div className="space-y-3">
      <p className={`text-[0.65rem] uppercase tracking-[0.4em] ${isDark ? 'text-[#c9a89a]' : 'text-[#b37871]'}`}>Quick access</p>
      <h4 className={`${headlineFont.className} text-xl ${isDark ? 'text-[#f5e6dc]' : 'text-[#1f120f]'}`}>Sign into your cockpit</h4>
      <div className="space-y-2">
        <label className={`text-xs ${isDark ? 'text-[#b8998a]' : 'text-[#5b4743]'}`}>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            className={`mt-1 w-full rounded-2xl border ${
              isDark 
                ? 'border-[#3a2f2a] bg-[#2a1f1a] text-[#f5e6dc] placeholder:text-[#7d6b5f]' 
                : 'border-[#eaded0] bg-white text-[#1f120f]'
            } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300`}
          />
        </label>
        <label className={`text-xs ${isDark ? 'text-[#b8998a]' : 'text-[#5b4743]'}`}>
          Password
          <input
            type="password"
            placeholder="••••••••"
            className={`mt-1 w-full rounded-2xl border ${
              isDark 
                ? 'border-[#3a2f2a] bg-[#2a1f1a] text-[#f5e6dc] placeholder:text-[#7d6b5f]' 
                : 'border-[#eaded0] bg-white text-[#1f120f]'
            } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300`}
          />
        </label>
      </div>
      <button
        type="button"
        className={`w-full rounded-full ${
          isDark ? 'bg-[#f5e6dc] text-[#1f120f]' : 'bg-[#1f120f] text-white'
        } py-2 text-sm font-semibold transition hover:-translate-y-0.5`}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={onClose}
        className={`w-full rounded-full border ${
          isDark ? 'border-[#3a2f2a] text-[#f5e6dc]' : 'border-[#1f120f]/10 text-[#1f120f]'
        } py-2 text-sm font-semibold transition-colors duration-300`}
      >
        Close
      </button>
    </div>
  </div>
);

const HERO_STATS = [
  { label: 'Learning paths created', value: '18,240' },
  { label: 'Resources curated', value: '72,110' },
  { label: 'Active study groups', value: '342' }
];

const FEATURE_STACK = [
  {
    title: 'Describe what you want',
    body: 'Type any topic or goal. Tell us how fast you want to go.',
    accentLight: 'from-[#fde6e0] to-[#f9c5d1]',
    accentDark: 'from-[#3a2420] to-[#3a2028]'
  },
  {
    title: 'Get a simple path',
    body: 'We lay out steps with a few trusted videos, reads, and projects. No endless tab hopping.',
    accentLight: 'from-[#fff4d8] to-[#ffd6a5]',
    accentDark: 'from-[#3a3420] to-[#3a2e20]'
  },
  {
    title: 'Stick with it',
    body: 'Gentle reminders, streaks, and small study groups keep you moving.',
    accentLight: 'from-[#e3f7f2] to-[#c0f0e4]',
    accentDark: 'from-[#203a34] to-[#203a30]'
  }
];

const FLOW_STEPS = [
  {
    stage: 'Describe your goal',
    title: 'Tell us what to learn',
    copy: 'Write the skill, exam, or project on your mind. Add how many days you can study.'
  },
  {
    stage: 'See your path',
    title: 'We map the steps',
    copy: 'Modules show up in order with just a handful of strong resources per stop.'
  },
  {
    stage: 'Meet your crew',
    title: 'Join a study group',
    copy: 'We connect you with a few people on the same lesson so you can ask, share, and stay motivated.'
  },
  {
    stage: 'Stay in the loop',
    title: 'Track streaks and wins',
    copy: 'Daily nudges, progress checkpoints, and quick recaps show what to do today and what\'s next.'
  }
];

const SIGNALS = [
  { title: 'Linear Algebra for ML', learners: 213, vibe: 'Deep focus · EU afternoon' },
  { title: 'Quant UX Research', learners: 94, vibe: 'Async thread · AMER evening' },
  { title: 'React + Supabase', learners: 178, vibe: 'Live build · APAC morning' },
  { title: 'Writing for AI tutors', learners: 66, vibe: 'Calm studio · Global hybrid' }
];

type JourneyPreview = {
  courseId: string;
  title: string;
  modules: Array<{
    id: number;
    moduleKey?: string;
    title: string;
    time?: string;
    status: 'completed' | 'pending' | 'current';
    resources: { name: string }[];
  }>;
};

const buildJourneyFromCourse = (
  course: Course,
  statusMap: Record<string, 'completed' | 'pending' | 'current'> = {}
): JourneyPreview => ({
  courseId: course.id,
  title: course.title,
  modules: course.modules.map((module, index) => ({
    id: module.moduleNumber || index + 1,
    moduleKey: module.id,
    title: module.title,
    time: module.estimatedDuration,
    status: statusMap[module.id] || (index === 0 ? 'current' : 'pending'),
    resources: module.topics.slice(0, 3).map((topic) => ({
      name: topic.title || 'Module topic'
    }))
  }))
});

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [navJourney, setNavJourney] = useState<JourneyPreview | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('creoDarkMode');
    setIsDarkMode(savedMode === 'true');
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('creoDarkMode', String(newMode));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const played = localStorage.getItem('creoIntroPlayed');
    if (!played) {
      startTransition(() => setShowIntro(true));
      const timer = setTimeout(() => {
        startTransition(() => setShowIntro(false));
        localStorage.setItem('creoIntroPlayed', 'true');
      }, 4800);
      return () => clearTimeout(timer);
    }
    startTransition(() => setShowIntro(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncJourney = () => {
      const storedCourse = window.localStorage.getItem('creoActiveCourse');
      if (!storedCourse) {
        setNavJourney(null);
        return;
      }
      try {
        const course: Course = JSON.parse(storedCourse);
        const statusRaw = window.localStorage.getItem('creoCourseStatus');
        const statusMap = statusRaw ? JSON.parse(statusRaw) : {};
        setNavJourney(buildJourneyFromCourse(course, statusMap));
      } catch (error) {
        console.error('Failed to hydrate journey preview:', error);
        setNavJourney(null);
      }
    };
    const storageHandler = () => syncJourney();
    syncJourney();
    window.addEventListener('storage', storageHandler);
    window.addEventListener('creo-course-updated', storageHandler as EventListener);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('creo-course-updated', storageHandler as EventListener);
    };
  }, []);

  const words = [
    { text: 'Everyone starts somewhere.', delay: 0 },
    { text: 'Type what you want to learn.', delay: 1.2 },
    { text: 'Watch your path unfold.', delay: 2.4 }
  ];

  return (
    <>
      {/* Floating chat box on landing - bottom left */}
      <div className="fixed bottom-6 left-6 z-50 w-[360px] max-w-[90vw]">
        <LandingChat />
      </div>

      <AnimatePresence>
        {showIntro && showIntro !== null && (
          <motion.div
            className={`fixed inset-0 z-40 flex items-center justify-center ${
              isDarkMode ? 'bg-[#1a120e]' : 'bg-[#fff4ec]'
            }`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ backgroundColor: isDarkMode ? '#1a120e' : '#f6e5da' }}
              animate={{ backgroundColor: isDarkMode ? '#0f0a08' : '#fffaf6' }}
              transition={{ duration: 1.4 }}
            />
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
              className="absolute h-3 w-3 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ff8ab6, #f9a8a8)'
              }}
              initial={{ x: '-20%', y: '10%', opacity: 0 }}
              animate={{ x: ['-20%', '40%', '110%'], y: ['10%', '50%', '80%'], opacity: [0, 1, 0] }}
              transition={{ duration: 3.5, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute h-[3px] w-[120%] rotate-6 bg-gradient-to-r from-transparent via-[#f9a8a8] to-[#ff5f9e]/0 blur-[2px]"
              initial={{ x: '-40%', y: '15%', opacity: 0 }}
              animate={{ x: ['-40%', '60%', '130%'], y: ['15%', '60%', '85%'], opacity: [0, 0.7, 0] }}
              transition={{ duration: 4, ease: 'easeInOut' }}
            />
            </motion.div>
            <div className={`relative z-10 space-y-4 text-center ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#4b2e2b]'}`}>
              {words.map((word) => (
                <motion.p
                  key={word.text}
                  className="text-lg font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: word.delay, duration: 0.6 }}
                >
                  {word.text}
                </motion.p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowIntro(false);
                localStorage.setItem('creoIntroPlayed', 'true');
              }}
              className={`absolute bottom-6 right-6 rounded-full border ${
                isDarkMode 
                  ? 'border-[#3a2f2a] bg-[#1f1410]/80 text-[#f5e6dc]' 
                  : 'border-[#1f120f]/20 bg-white/80 text-[#1f120f]'
              } px-4 py-2 text-xs font-semibold transition-colors duration-300`}
            >
              Skip intro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Hero Section */}
      <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1a120e] via-[#1f1410] to-[#1a0f0c]' 
          : 'bg-gradient-to-br from-[#fffaf6] via-[#fff0e8] to-[#ffe8e8]'
      }`}>
        {/* Soft waves overlay */}
        <Waves
          lineColor={isDarkMode ? 'rgba(194, 79, 99, 0.12)' : 'rgba(194, 79, 99, 0.06)'}
          backgroundColor="transparent"
          waveSpeedX={0.004}
          waveSpeedY={0.002}
          waveAmpX={20}
          waveAmpY={12}
          xGap={18}
          yGap={50}
          friction={0.97}
          tension={0.002}
          maxCursorMove={40}
          style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none' }}
        />

        {/* Subtle floating sparkles - brand colors */}
        <motion.div
          className={`absolute top-[18%] left-[12%] z-10 ${
            isDarkMode ? 'text-[#c24f63] opacity-30' : 'text-[#ffb9c5] opacity-40'
          }`}
          animate={{
            y: [-8, 8, -8],
            rotate: [0, 25, 0],
            opacity: isDarkMode ? [0.25, 0.35, 0.25] : [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Star className="w-6 h-6 fill-current" />
        </motion.div>

        <motion.div
          className={`absolute top-[28%] right-[18%] z-10 ${
            isDarkMode ? 'text-[#d4a574] opacity-30' : 'text-[#ffd6a5] opacity-40'
          }`}
          animate={{
            y: [8, -8, 8],
            rotate: [25, 0, 25],
            opacity: isDarkMode ? [0.3, 0.4, 0.3] : [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>

        <motion.div
          className={`absolute bottom-[35%] left-[15%] z-10 ${
            isDarkMode ? 'text-[#c24f63] opacity-25' : 'text-[#c24f63] opacity-30'
          }`}
          animate={{
            scale: [1, 1.15, 1],
            opacity: isDarkMode ? [0.2, 0.3, 0.2] : [0.25, 0.4, 0.25]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <Star className="w-5 h-5 fill-current" />
        </motion.div>

        {/* Navigation - Phantom-inspired */}
        <nav className={`${bodyFont.className} relative z-30 px-6 py-6`}>
          <div className="max-w-7xl mx-auto flex items-center">
            {/* Logo - Left */}
            <div className="flex-1">
              <Link href="/" className="flex items-center gap-2 w-fit">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isDarkMode ? 'bg-[#f5e6dc] text-[#1f120f]' : 'bg-[#1f120f] text-white'
                } text-base font-bold transition-colors duration-300`}>
                  ∞
                </div>
                <span className={`${headlineFont.className} text-xl font-bold ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>CREO</span>
              </Link>
            </div>

            {/* Center Pills Menu - Absolutely Centered */}
            <div className="flex justify-center">
              <div className={`hidden md:flex items-center gap-1 backdrop-blur-xl rounded-full border px-2 py-2 shadow-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-[#1f1410]/70 border-[#3a2f2a]/50' 
                  : 'bg-white/70 border-white/40'
              }`}>
                <Link
                  href="/course"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isDarkMode 
                      ? 'hover:bg-[#2a1f1a] text-[#f5e6dc]' 
                      : 'hover:bg-[#f2e1d8]/50 text-[#1f120f]'
                  }`}
                >
                  Course Builder
                </Link>
                <Link
                  href="/tutor"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isDarkMode 
                      ? 'hover:bg-[#2a1f1a] text-[#f5e6dc]' 
                      : 'hover:bg-[#f2e1d8]/50 text-[#1f120f]'
                  }`}
                >
                  Learning Coach
                </Link>
                <Link
                  href="/api-test"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isDarkMode 
                      ? 'hover:bg-[#2a1f1a] text-[#f5e6dc]' 
                      : 'hover:bg-[#f2e1d8]/50 text-[#1f120f]'
                  }`}
                >
                  API
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAuth((prev) => !prev)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isDarkMode 
                      ? 'hover:bg-[#2a1f1a] text-[#f5e6dc]' 
                      : 'hover:bg-[#f2e1d8]/50 text-[#1f120f]'
                  }`}
                >
                  Sign in
                </button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex-1 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  isDarkMode 
                    ? 'bg-[#2a1f1a] text-[#f5e6dc] hover:bg-[#3a2f2a]' 
                    : 'bg-[#f2e1d8]/50 text-[#1f120f] hover:bg-[#f2e1d8]'
                }`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              
              <button
                type="button"
                onClick={() => setShowAuth((prev) => !prev)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg ${
                  isDarkMode 
                    ? 'bg-[#c24f63] text-white hover:bg-[#d15f73]' 
                    : 'bg-[#c24f63] text-white hover:bg-[#d15f73]'
                }`}
              >
                Sign in
              </button>
            </div>
            
            {showAuth && (
              <div className="absolute right-6 top-20">
                <AuthDialogue onClose={() => setShowAuth(false)} isDark={isDarkMode} />
              </div>
            )}
          </div>
        </nav>

        {/* Hero - Phantom-inspired structure */}
        <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-100px)] px-6 pb-16">
          <div className="relative max-w-7xl w-full">
            
            {/* Floating elements around headline */}
            <div className="hidden lg:block">
              {HERO_FLOATING_ELEMENTS.map((element) => (
                <FloatingElement
                  key={element.id}
                  config={element}
                  isDarkMode={isDarkMode}
                  parallaxStrength={1}
                />
              ))}
            </div>

            {/* Main headline - centered with CTA */}
            <div className="text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className={`${headlineFont.className} text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-[#f5e6dc] drop-shadow-[0_8px_32px_rgba(194,79,99,0.3)]' 
                    : 'text-[#1f120f] drop-shadow-[0_8px_32px_rgba(194,79,99,0.2)]'
                }`}>
                  Meet Creo
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="mt-12"
              >
                <Link
                  href="/course"
                  className={`${bodyFont.className} inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-2xl ${
                    isDarkMode 
                      ? 'bg-[#c24f63] text-white hover:bg-[#d15f73] shadow-[0_20px_60px_rgba(194,79,99,0.4)]' 
                      : 'bg-[#c24f63] text-white hover:bg-[#d15f73] shadow-[0_20px_60px_rgba(194,79,99,0.3)]'
                  } hover:scale-105 hover:shadow-[0_25px_70px_rgba(194,79,99,0.5)]`}
                >
                  <span>Launch Builder</span>
                  <span className="text-xl">→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Homepage Content Below */}
      <div className={`${bodyFont.className} transition-colors duration-500 ${
        isDarkMode ? 'bg-[#0f0a08] text-[#f5e6dc]' : 'bg-[#fdf8f2] text-[#1f120f]'
      }`}>
        <main className="container mx-auto space-y-16 px-4 py-12">
          {/* Hero */}
          <section className={`relative overflow-hidden rounded-[40px] border p-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-gradient-to-br from-[#1f1410] via-[#2a1820] to-[#1f1410] shadow-[0_40px_120px_rgba(194,79,99,0.2)]' 
              : 'border-[#f2e1d8] bg-gradient-to-br from-[#fff2ea] via-[#ffe8f0] to-[#fce3d8] shadow-[0_40px_120px_rgba(244,206,185,0.6)]'
          }`}>
            <div className="grid gap-10 lg:grid-cols-[3fr,2fr]">
              <div className="space-y-6">
                <p className={`text-xs uppercase tracking-[0.6em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Type it. Get a path.</p>
                <h1 className={`${headlineFont.className} text-4xl md:text-5xl ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>
                  Turn anything you want to learn into a path you can follow
                </h1>
                <p className={`text-base max-w-2xl ${
                  isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
                }`}>
                  CREO builds a step-by-step plan from the best resources, then pairs you with a small study group so you
                  never learn alone.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/course"
                    className={`rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                      isDarkMode ? 'bg-[#f5e6dc] text-[#1f120f]' : 'bg-[#1f120f] text-white'
                    }`}
                  >
                    Start a learning path
                  </Link>
                  <Link
                    href="/course"
                    className={`rounded-full border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                      isDarkMode 
                        ? 'border-[#3a2f2a] text-[#f5e6dc]' 
                        : 'border-[#1f120f]/20 text-[#1f120f]'
                    }`}
                  >
                    See how it works
                  </Link>
                </div>
              </div>

              <div className={`rounded-[32px] border backdrop-blur p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-[#3a2f2a]/70 bg-[#1f1410]/80' 
                  : 'border-white/70 bg-white/80'
              }`}>
                <p className={`text-xs uppercase tracking-[0.4em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Live study groups</p>
                <div className="mt-4 space-y-3">
                  {SIGNALS.map((signal) => (
                    <div
                      key={signal.title}
                      className={`grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border px-4 py-3 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'border-[#3a2f2a] bg-[#1f1410]/80 shadow-[0_10px_30px_rgba(194,79,99,0.15)]' 
                          : 'border-[#f3dcd1] bg-white/80 shadow-[0_10px_30px_rgba(233,182,167,0.3)]'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold ${
                        isDarkMode 
                          ? 'from-[#3a2420] to-[#3a2028] text-[#ff8ab6]' 
                          : 'from-[#fee1d8] to-[#ffd5eb] text-[#9c4c4c]'
                      }`}>
                        {signal.learners}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${
                          isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                        }`}>{signal.title}</p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-[#b8998a]' : 'text-[#7d5c55]'
                        }`}>{signal.vibe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`mt-10 grid gap-4 rounded-[28px] border p-5 shadow-inner transition-colors duration-300 ${
              isDarkMode 
                ? 'border-[#3a2f2a]/60 bg-[#1f1410]/70' 
                : 'border-white/60 bg-white/70'
            }`}>
              <div className="grid gap-4 sm:grid-cols-3">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className={`rounded-2xl p-4 text-center shadow-sm transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#1f1410]' : 'bg-white'
                  }`}>
                    <p className={`text-2xl font-semibold ${
                      isDarkMode ? 'text-[#ff8ab6]' : 'text-[#c24f63]'
                    }`}>{stat.value}</p>
                    <p className={`text-xs uppercase tracking-[0.2em] ${
                      isDarkMode ? 'text-[#b8998a]' : 'text-[#9b867f]'
                    }`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="grid gap-6 lg:grid-cols-3">
            {FEATURE_STACK.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-[28px] border p-6 transition-colors duration-300 ${
                  isDarkMode 
                    ? `border-[#3a2f2a] bg-gradient-to-br ${feature.accentDark} shadow-[0_30px_60px_rgba(194,79,99,0.15)]` 
                    : `border-[#f2e1d8] bg-gradient-to-br ${feature.accentLight} shadow-[0_30px_60px_rgba(246,203,193,0.4)]`
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.4em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Feature</p>
                <h3 className={`${headlineFont.className} mt-2 text-xl ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>{feature.title}</h3>
                <p className={`mt-3 text-sm ${
                  isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
                }`}>{feature.body}</p>
              </div>
            ))}
          </section>

          {/* Flow */}
          <section className={`rounded-[36px] border p-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1f1410] shadow-[0_35px_70px_rgba(0,0,0,0.3)]' 
              : 'border-[#f2e1d8] bg-white shadow-[0_35px_70px_rgba(37,23,19,0.08)]'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.4em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Flow</p>
                <h3 className={`${headlineFont.className} text-3xl ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>How your path comes together</h3>
              </div>
              <p className={`text-sm max-w-xl ${
                isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
              }`}>
                Hover each step to see what happens after you type your goal. It stays simple from idea to study session.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {FLOW_STEPS.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <button
                    key={step.stage}
                    type="button"
                    onMouseEnter={() => setActiveStep(index)}
                    className={`h-full rounded-3xl border p-5 text-left transition-all duration-300 ${
                      isActive 
                        ? isDarkMode 
                          ? 'border-[#c24f63] bg-gradient-to-br from-[#2a1820] to-[#2a1820] shadow-lg' 
                          : 'border-[#c24f63] bg-gradient-to-br from-[#fff0eb] to-[#ffe3f1] shadow-lg'
                        : isDarkMode 
                          ? 'border-[#3a2f2a] bg-[#1f1410]' 
                          : 'border-[#f2e1d8] bg-white'
                    }`}
                  >
                    <p className={`text-xs uppercase tracking-[0.3em] ${
                      isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                    }`}>{step.stage}</p>
                    <h4 className={`mt-2 text-lg font-semibold ${
                      isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                    }`}>{step.title}</h4>
                    <p className={`mt-2 text-sm ${
                      isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
                    }`}>{step.copy}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Pods */}
          <section className={`rounded-[36px] border p-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1a120e] shadow-[0_30px_60px_rgba(194,79,99,0.15)]' 
              : 'border-[#f2e1d8] bg-[#fff8f5] shadow-[0_30px_60px_rgba(230,191,182,0.5)]'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.4em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Study groups</p>
                <h3 className={`${headlineFont.className} text-3xl ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>Pick the vibe that fits</h3>
              </div>
              <p className={`text-sm max-w-xl ${
                isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
              }`}>
                Groups stay small, camera-optional, and matched by pace. Drop in when you need a boost.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {SIGNALS.map((signal) => (
                <div key={signal.title} className={`rounded-3xl border px-5 py-6 shadow-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-[#3a2f2a] bg-[#1f1410]' 
                    : 'border-[#f2d9cf] bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.3em] ${
                        isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                      }`}>Study group</p>
                      <p className={`text-lg font-semibold ${
                        isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                      }`}>{signal.title}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isDarkMode 
                        ? 'bg-[#2a1820] text-[#ff8ab6]' 
                        : 'bg-[#ffe9ea] text-[#c24f63]'
                    }`}>
                      {signal.learners} live
                    </span>
                  </div>
                  <p className={`mt-3 text-sm ${
                    isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
                  }`}>{signal.vibe}</p>
                  <div className={`mt-4 flex items-center gap-2 text-xs ${
                    isDarkMode ? 'text-[#b8998a]' : 'text-[#a37d75]'
                  }`}>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl font-semibold ${
                      isDarkMode 
                        ? 'bg-[#2a1f1a] text-[#ff8ab6]' 
                        : 'bg-[#fff4ef] text-[#c24f63]'
                    }`}>
                      {signal.title
                        .split(' ')
                        .map((word) => word.charAt(0))
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <span>Join learners on this lesson · <strong>Under 30s</strong> wait</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inline Tutor */}
          <section className={`grid gap-6 lg:grid-cols-2 items-start rounded-[36px] border p-8 transition-colors duration-300 ${
            isDarkMode
              ? 'border-[#3a2f2a] bg-[#1f1410]'
              : 'border-[#f2e1d8] bg-white'
          }`}>
            <div className="space-y-3">
              <p className={`text-xs uppercase tracking-[0.5em] ${
                isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
              }`}>Stuck? Try Learning Mode</p>
              <h3 className={`${headlineFont.className} text-3xl ${
                isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
              }`}>Talk to the coach right here</h3>
              <p className={`text-sm max-w-xl ${
                isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
              }`}>
                Type your blocker. The coach detects frustration or repetition and switches to a slower, hint-first mode.
              </p>
              <ul className={`grid gap-2 text-sm ${
                isDarkMode ? 'text-[#c9a89a]' : 'text-[#5b4743]'
              }`}>
                <li>• Quick controls: ask for a hint or simpler explanation.</li>
                <li>• Tracks topic confidence and repeats weak spots.</li>
                <li>• Uses your profile to adapt tone and pacing.</li>
              </ul>
            </div>
            <LandingChat />
          </section>

          {/* CTA */}
          <section className={`rounded-[36px] border p-8 text-center transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1f1410] shadow-[0_30px_70px_rgba(0,0,0,0.3)]' 
              : 'border-[#f2e1d8] bg-white shadow-[0_30px_70px_rgba(37,23,19,0.08)]'
          }`}>
            <p className={`text-xs uppercase tracking-[0.5em] ${
              isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
            }`}>Ready?</p>
            <h3 className={`${headlineFont.className} mt-2 text-3xl ${
              isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
            }`}>Start a path. Learn with your crew.</h3>
            <p className={`mt-3 text-sm max-w-2xl mx-auto ${
              isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
            }`}>
              Type what you want to learn and get a plan in under a minute. We keep the steps, streak, and study group in one calm place.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/course"
                className={`rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  isDarkMode ? 'bg-[#f5e6dc] text-[#1f120f]' : 'bg-[#1f120f] text-white'
                }`}
              >
                Generate my path
              </Link>
              <Link
                href="/api-test"
                className={`rounded-full border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  isDarkMode 
                    ? 'border-[#3a2f2a] text-[#f5e6dc]' 
                    : 'border-[#1f120f]/15 text-[#1f120f]'
                }`}
              >
                View API example
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
