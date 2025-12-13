'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Course,
  CourseGenerationRequest,
  CourseGenerationResponse,
  CourseModule,
  CourseTopic,
  FeaturedVideosPayload,
  Video
} from '@/app/types/course';
import FeaturedVideoWorkspace from '@/app/components/FeaturedVideoWorkspace';
import CourseNotesSidebar from '@/app/components/CourseNotesSidebar';
import LearningPathCohortCard from '@/app/components/LearningPathCohortCard';
import ModuleSocialSpace from '@/app/components/ModuleSocialSpace';
import ModuleCarousel from '@/app/components/ModuleCarousel';
import Waves from '@/app/components/Waves';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun, Home } from 'lucide-react';
import Link from 'next/link';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });
const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

// Centralized theme tokens
const LIGHT_THEME = {
  bg: 'bg-[#fdf8f2]',
  surface: 'bg-white',
  surfaceGradient: 'bg-gradient-to-br from-[#fff5ef] to-white',
  card: 'bg-white border-[#f2e7d9]',
  cardSecondary: 'bg-[#fff8f5] border-[#f2e7d9]',
  input: 'bg-white border-[#eaded0]',
  border: 'border-[#f2e7d9]',
  text: 'text-[#111]',
  textMuted: 'text-[#4a4a4a]',
  textLight: 'text-[#c1b6a4]',
  accent: 'text-[#a95757]',
  accentBg: 'bg-[#a95757]',
  button: 'bg-[#111] text-white',
  buttonBorder: 'border-[#111]/20 text-[#111]',
};

const DARK_THEME = {
  bg: 'bg-[#0f0a08]',
  surface: 'bg-[#1f1410]',
  surfaceGradient: 'bg-gradient-to-br from-[#2a1f1a] to-[#1f1410]',
  card: 'bg-[#1f1410] border-[#3a2f2a]',
  cardSecondary: 'bg-[#211712] border-[#3a2f2a]',
  input: 'bg-[#2a1f1a] border-[#3a2f2a]',
  border: 'border-[#3a2f2a]',
  text: 'text-[#f5e6dc]',
  textMuted: 'text-[#b8998a]',
  textLight: 'text-[#c9a89a]',
  accent: 'text-[#ff8ab6]',
  accentBg: 'bg-[#c24f63]',
  button: 'bg-[#f5e6dc] text-[#1f120f]',
  buttonBorder: 'border-[#3a2f2a] text-[#f5e6dc]',
};
type DurationVariant = { label: string; value: string };

const parseDurationToDays = (value?: string) => {
  if (!value || !value.trim()) return 28;
  const match = value.match(/(\d+(?:\.\d+)?)\s*(d|day|w|wk|week|m|mo|month|y|yr|year)s?/i);
  if (!match) {
    // Try to extract just a number
    const numMatch = value.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      // Default to weeks if only number is provided
      return Math.max(1, Math.round(Number(numMatch[1]) * 7));
    }
    return 28;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitToDays: Record<string, number> = { 
    d: 1, day: 1,
    w: 7, wk: 7, week: 7,
    m: 30, mo: 30, month: 30,
    y: 365, yr: 365, year: 365
  };
  return Math.max(1, Math.round(amount * (unitToDays[unit] ?? 7)));
};

const buildDurationVariants = (duration?: string): DurationVariant[] => {
  const days = parseDurationToDays(duration);
  const weekValue = Math.max(1, Math.round(days / 7));
  const yearsRaw = days / 365;
  const yearValue = yearsRaw >= 1 ? yearsRaw.toFixed(1) : yearsRaw.toFixed(2);
  return [
    { label: 'Weeks', value: `${weekValue} wk${weekValue > 1 ? 's' : ''}` },
    { label: 'Days', value: `${days} day${days > 1 ? 's' : ''}` },
    { label: 'Years', value: `${yearValue} yr` }
  ];
};

const collectCourseVideos = (modules: CourseModule[]): Video[] => {
  const seen = new Set<string>();
  const clips: Video[] = [];
  modules.forEach((module) => {
    module.topics.forEach((topic) => {
      topic.videos?.forEach((video) => {
        if (video && !seen.has(video.id)) {
          seen.add(video.id);
          clips.push(video);
        }
      });
    });
  });
  return clips;
};

const toStudySlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'study';

const buildStudyLink = (value: string) => `https://discord.gg/${toStudySlug(value).slice(0, 32)}`;

interface CourseBuilderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function CourseBuilder({ isDarkMode, onToggleDarkMode }: CourseBuilderProps) {
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const [formData, setFormData] = useState<CourseGenerationRequest>({
    topic: '',
    difficulty: 'intermediate',
    duration: '4 weeks',
    includeVideos: true,
    videosPerTopic: 3,
    language: 'English'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideosPayload | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [generationStats, setGenerationStats] = useState<{ time?: number; videos?: number } | null>(null);
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'done'>('idle');
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [durationInput, setDurationInput] = useState(formData.duration);
  
  useEffect(() => {
    setDurationInput(formData.duration);
  }, [formData.duration]);
  
  const activeDurationVariant = useMemo(() => {
    const input = durationInput || formData.duration || '4 weeks';
    const days = parseDurationToDays(input);
    const weeks = Math.max(1, Math.round(days / 7));
    return { label: 'Weeks', value: `${weeks} wk${weeks > 1 ? 's' : ''}` };
  }, [durationInput, formData.duration]);
  const aggregatedCourseVideos = useMemo(() => (course ? collectCourseVideos(course.modules) : []), [course]);
  const hasVideoContent = useMemo(
    () => Boolean(featuredVideos?.popular || featuredVideos?.topRated || aggregatedCourseVideos.length),
    [featuredVideos, aggregatedCourseVideos]
  );

  useEffect(
    () => () => {
      if (completionTimeout.current) {
        clearTimeout(completionTimeout.current);
      }
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const renderStatusBadge = () => (
    <AnimatePresence initial={false} mode="wait">
      {statusState === 'idle' && (
        <motion.div
          key="status-idle"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#2a1f1a] text-[#c9a89a]' 
              : 'border-[#efe7df] bg-[#fffbf7] text-[#a18c82]'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-[#c9a89a]' : 'bg-[#e8d6c9]'}`} />
          Ready
        </motion.div>
      )}
      {statusState === 'loading' && (
        <motion.div
          key="status-loading"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={`flex items-center gap-3 rounded-full border px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] shadow-sm transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#3a2420] bg-[#2a1820] text-[#ff8ab6]' 
              : 'border-[#ffe0d6] bg-[#fff6f2] text-[#a14848]'
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff9a8b]/40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff6b8b]" />
          </span>
          <span>Generating</span>
          <div className={`h-1.5 w-16 overflow-hidden rounded-full ${isDarkMode ? 'bg-[#3a2420]' : 'bg-[#ffe7e0]'}`}>
            <motion.span
              className="block h-full w-full bg-gradient-to-r from-[#ff9a8b] via-[#ff6b8b] to-[#ffb199]"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
      {statusState === 'done' && (
        <motion.div
          key="status-done"
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          className={`flex items-center gap-3 rounded-full border px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] shadow-sm transition-colors duration-300 ${
            isDarkMode 
              ? 'border-[#203a30] bg-[#1a2820] text-[#86efac]' 
              : 'border-[#d7f5df] bg-[#f3fff6] text-[#1d5c34]'
          }`}
        >
          <motion.span
            className="relative inline-flex h-3 w-3 rounded-full bg-[#34d399]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
          <span>Course ready</span>
          <motion.span
            className={`relative inline-flex h-3 w-16 overflow-hidden rounded-full ${isDarkMode ? 'bg-[#203a30]' : 'bg-[#e3ffe9]'}`}
            animate={{ backgroundPositionX: ['0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            style={{
              backgroundImage: 'linear-gradient(120deg, #bbf7d0, #86efac, #bbf7d0)',
              backgroundSize: '200% 100%'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  const generateCourse = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a course topic');
      return;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[${requestId}] Course generation: ${formData.topic} (${formData.difficulty})`);
    
    setLoading(true);
    setError(null);
    setCourse(null);
    setGenerationStats(null);
    setFeaturedVideos(null);
    setStatusState('loading');
    
    if (completionTimeout.current) {
      clearTimeout(completionTimeout.current);
      completionTimeout.current = null;
    }

    let wasSuccessful = false;

    try {
      const payload = { ...formData, requestId };
      
      const response = await fetch('/api/course/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let data: CourseGenerationResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error(`[${requestId}] Failed to parse response`);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate course');
      }

      console.log(`[${requestId}] Success: "${data.course?.title}" (${data.course?.modules.length} modules, ${data.generationTime}ms)`);
      
      // Warn if generation took too long (indicates API retries/fallback)
      if (data.generationTime && data.generationTime > 40000) {
        setError('⚠️ AI generation experienced delays (likely API quota limits). Your course uses a template structure customized for "' + formData.topic + '". For fully AI-generated content, check your Gemini API quota at https://ai.dev/usage');
      }
      
      setCourse(data.course!);
      if (typeof window !== 'undefined' && data.course) {
        try {
          localStorage.setItem('creoActiveCourse', JSON.stringify(data.course));
          const statusRaw = localStorage.getItem('creoCourseStatus');
          const statusPayload: Record<string, Record<string, 'completed' | 'pending' | 'current'>> = statusRaw
            ? JSON.parse(statusRaw)
            : {};
          if (!statusPayload[data.course.id]) {
            statusPayload[data.course.id] = {};
          }
          localStorage.setItem('creoCourseStatus', JSON.stringify(statusPayload));
          window.dispatchEvent(new Event('creo-course-updated'));
        } catch (storageError) {
          console.error('Failed to persist course locally:', storageError);
        }
      }
      setFeaturedVideos(data.featuredVideos ?? null);
      setGenerationStats({
        time: data.generationTime,
        videos: data.videosFetched
      });
      
      wasSuccessful = true;
      setStatusState('done');
      
      completionTimeout.current = setTimeout(() => {
        setStatusState('idle');
        completionTimeout.current = null;
      }, 5000);

      if (data.course && data.course.modules.length > 0) {
        setExpandedModules(new Set([data.course.modules[0].id]));
        setSelectedModuleId(data.course.modules[0].id);
      }
    } catch (err) {
      console.error(`[${requestId}] Error:`, err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatusState('idle');
    } finally {
      setLoading(false);
      if (!wasSuccessful && completionTimeout.current) {
        clearTimeout(completionTimeout.current);
        completionTimeout.current = null;
      }
    }
  };

  const exportCourseJson = () => {
    if (!course) return;
    const dataStr = JSON.stringify(course, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportName = `${course.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const renderVideo = (video: Video) => (
    <div className={`rounded-2xl border p-4 transition-colors duration-300 ${theme.card}`} key={video.id}>
      <div className="flex gap-3">
        <img src={video.thumbnailUrl} alt={video.title} className="w-32 h-20 object-cover rounded-lg" />
        <div className="flex-1">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-semibold hover:underline transition-colors duration-300 ${theme.text}`}
          >
            {video.title}
          </a>
          <p className={`text-xs mt-1 transition-colors duration-300 ${theme.textMuted}`}>
            {video.channelName} · {video.duration}
          </p>
          <p className={`text-xs mt-1 transition-colors duration-300 ${theme.textMuted}`}>
            {video.viewCount.toLocaleString()} views {video.rating && `· ⭐ ${video.rating.toFixed(1)}%`}
          </p>
        </div>
      </div>
    </div>
  );

  const renderTopic = (topic: CourseTopic) => {
    const topicId = topic.id;
    const isExpanded = expandedTopics.has(topicId);
    return (
      <div key={topic.id} className={`rounded-2xl border transition-colors duration-300 ${theme.card}`}>
        <button
          onClick={() => toggleTopic(topicId)}
          className="w-full text-left px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${theme.textLight}`}>Topic {topic.topicNumber}</p>
            <p className={`font-semibold transition-colors duration-300 ${theme.text}`}>{topic.title}</p>
          </div>
          <span className={`transition-colors duration-300 ${theme.text}`}>{isExpanded ? '−' : '+'}</span>
        </button>
        {isExpanded && (
          <div className={`px-4 pb-4 space-y-4 text-sm transition-colors duration-300 ${theme.textMuted}`}>
            <p>{topic.content}</p>
            {topic.keyPoints?.length ? (
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] mb-2 transition-colors duration-300 ${theme.textLight}`}>Key Points</p>
                <ul className="list-disc list-inside space-y-1">
                  {topic.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {topic.practiceQuestions?.length ? (
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] mb-2 transition-colors duration-300 ${theme.textLight}`}>Practice Prompts</p>
                <ol className="list-decimal list-inside space-y-1">
                  {topic.practiceQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {topic.videos?.length ? (
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] mb-2 transition-colors duration-300 ${theme.textLight}`}>Suggested Clips</p>
                <div className="space-y-3">{topic.videos.map((video) => renderVideo(video))}</div>
              </div>
            ) : (
              <p className={`text-xs transition-colors duration-300 ${theme.textLight}`}>No videos surfaced for this topic.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderModule = (module: CourseModule) => {
    const isExpanded = expandedModules.has(module.id);
    return (
      <div key={module.id} className={`rounded-3xl border shadow-sm transition-colors duration-300 ${theme.card}`}>
        <button onClick={() => toggleModule(module.id)} className="w-full text-left p-5 flex justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] transition-colors duration-300 ${theme.textLight}`}>Module {module.moduleNumber}</p>
            <p className={`${headlineFont.className} text-lg transition-colors duration-300 ${theme.text}`}>{module.title}</p>
            <p className={`text-sm transition-colors duration-300 ${theme.textMuted}`}>{module.description}</p>
            <div className={`text-xs flex gap-4 mt-2 transition-colors duration-300 ${theme.textMuted}`}>
              <span>{module.estimatedDuration}</span>
              <span>{module.topics.length} topics</span>
              <span>{module.learningObjectives.length} objectives</span>
            </div>
          </div>
          <span className={`text-2xl transition-colors duration-300 ${theme.text}`}>{isExpanded ? '−' : '+'}</span>
        </button>
        {isExpanded && (
          <div className="p-5 space-y-5">
            <ModuleSocialSpace
              moduleId={module.id}
              moduleTitle={module.title}
              order={module.moduleNumber}
              joinUrl={buildStudyLink(`${course.title}-${module.title}`)}
              isDarkMode={isDarkMode}
            />
            <div>
              <p className={`text-xs uppercase tracking-[0.3em] mb-2 transition-colors duration-300 ${theme.textLight}`}>Objectives</p>
              <ul className={`list-disc list-inside text-sm transition-colors duration-300 ${theme.textMuted}`}>
                {module.learningObjectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
            {module.assessment && (
              <div className={`grid gap-4 rounded-3xl border p-5 md:grid-cols-2 transition-colors duration-300 ${theme.cardSecondary}`}>
                <div className={`rounded-2xl border p-4 transition-colors duration-300 ${theme.card}`}>
                  <p className={`text-xs uppercase tracking-[0.3em] mb-2 transition-colors duration-300 ${theme.textLight}`}>{module.assessment.quizTitle || 'Module quiz'}</p>
                  {module.assessment.quizQuestions.length ? (
                    <ol className={`list-decimal list-inside space-y-1 text-sm transition-colors duration-300 ${theme.textMuted}`}>
                      {module.assessment.quizQuestions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className={`text-xs transition-colors duration-300 ${theme.textLight}`}>Quiz questions coming soon.</p>
                  )}
                </div>
                <div className={`rounded-2xl border p-4 transition-colors duration-300 ${theme.card}`}>
                  <p className={`text-xs uppercase tracking-[0.3em] mb-2 transition-colors duration-300 ${theme.textLight}`}>{module.assessment.problemSetTitle || 'Problem set'}</p>
                  {module.assessment.problemPrompts.length ? (
                    <ul className={`list-disc list-inside space-y-1 text-sm transition-colors duration-300 ${theme.textMuted}`}>
                      {module.assessment.problemPrompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-xs transition-colors duration-300 ${theme.textLight}`}>Practice prompts coming soon.</p>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {module.topics.map((topic) => renderTopic(topic))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${bodyFont.className} relative transition-colors duration-500`}>
      <Waves
        lineColor={isDarkMode ? "rgba(194, 79, 99, 0.12)" : "rgba(169, 87, 87, 0.08)"}
        backgroundColor="transparent"
        waveSpeedX={0.008}
        waveSpeedY={0.003}
        waveAmpX={20}
        waveAmpY={12}
        xGap={12}
        yGap={40}
        friction={0.94}
        tension={0.004}
        maxCursorMove={80}
        style={{ position: 'fixed', zIndex: 0, pointerEvents: 'none' }}
      />
      
      {/* Navbar */}
      <nav className="relative z-30 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all ${
              isDarkMode 
                ? 'bg-[#1f1410]/70 border-[#3a2f2a] text-[#f5e6dc] hover:bg-[#2a1f1a]' 
                : 'bg-white/70 border-[#f2e1d8] text-[#1f120f] hover:bg-white'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
              isDarkMode 
                ? 'bg-[#f5e6dc] text-[#1f120f] border-[#f5e6dc] hover:bg-[#e6d7cd]' 
                : 'bg-[#1f120f] text-white border-[#1f120f] hover:bg-[#2f221f]'
            }`}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      
      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4 space-y-10">
        <div className="space-y-6 text-center">
        <p className={`text-sm tracking-[0.5em] uppercase transition-colors duration-300 ${theme.textLight}`}>Course Builder</p>
        <h1 className={`${headlineFont.className} text-4xl transition-colors duration-300 ${theme.text}`}>
          Compose complete learning journeys with one prompt
        </h1>
        <p className={`text-lg max-w-3xl mx-auto transition-colors duration-300 ${theme.textMuted}`}>
          Describe your topic and pacing. We map the modules, fetch curated YouTube explainers, and package everything
          with objectives and practice prompts—while we handle prerequisites and focus areas for you.
        </p>
      </div>

      <div className={`rounded-3xl border shadow-xl p-6 space-y-6 transition-colors duration-300 ${theme.card}`}>
        <div className="flex flex-col gap-3">
          <div>
            <p className={`text-xs uppercase tracking-[0.4em] transition-colors duration-300 ${theme.textLight}`}>Configuration</p>
            <h2 className={`${headlineFont.className} text-2xl transition-colors duration-300 ${theme.text}`}>Course Parameters</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`text-sm transition-colors duration-300 ${theme.text}`}>
            Course Topic *
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., GenAI Product Design"
              className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${theme.input} ${theme.text} placeholder:${theme.textMuted.replace('text-', 'text-')}`}
            />
          </label>
          <label className={`text-sm transition-colors duration-300 ${theme.text}`}>
            Difficulty
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${theme.input} ${theme.text}`}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className={`text-sm md:col-span-2 transition-colors duration-300 ${theme.text}`}>
            <div className="flex items-center justify-between mb-2">
              <span>Duration</span>
              <motion.div
                animate={{ scale: [1, 1.01, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative group"
              >
                <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-[#c24f63]/15 via-[#c9a89a]/15 to-[#c24f63]/15'
                    : 'bg-gradient-to-r from-[#a95757]/10 via-[#c1b6a4]/10 to-[#a95757]/10'
                }`} />
                <div className={`relative px-3 py-1.5 border rounded-xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-[#2a1f1a] to-[#1f1410] border-[#3a2f2a]'
                    : 'bg-gradient-to-br from-[#fff5ef] to-white border-[#f2e7d9]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.55rem] uppercase tracking-[0.25em] transition-colors duration-300 ${theme.textLight}`}>Time</span>
                    <span className={`text-sm transition-colors duration-300 ${theme.accent}`}>
                      {(() => {
                        const input = durationInput || formData.duration || '4 weeks';
                        const days = parseDurationToDays(input);
                        const weeks = Math.max(1, Math.round(days / 7));
                        return `${weeks} wk${weeks > 1 ? 's' : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={(e) => {
                setDurationInput(e.target.value);
                handleInputChange(e);
              }}
              placeholder="e.g., 4 weeks"
              className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${theme.input} ${theme.text}`}
            />
          </label>
          <label className={`flex items-center gap-2 text-sm transition-colors duration-300 ${theme.text}`}>
            <input
              type="checkbox"
              name="includeVideos"
              checked={formData.includeVideos}
              onChange={handleInputChange}
              className={`rounded transition-colors duration-300 ${isDarkMode ? 'border-[#3a2f2a]' : 'border-[#eaded0]'}`}
            />
            Include curated YouTube videos
          </label>
          <label className={`text-sm transition-colors duration-300 ${theme.text}`}>
            Videos per topic
            <input
              type="number"
              name="videosPerTopic"
              min={1}
              max={10}
              value={formData.videosPerTopic}
              onChange={handleInputChange}
              className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${theme.input} ${theme.text}`}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
          </div>
          <button
            onClick={generateCourse}
            disabled={loading}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide disabled:opacity-50 transition-colors duration-300 ${theme.button}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isDarkMode ? 'bg-[#1f120f]/40' : 'bg-white/40'}`} />
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${isDarkMode ? 'bg-[#1f120f]' : 'bg-white'}`} />
                </span>
                Generating
              </span>
            ) : (
              'Generate course'
            )}
          </button>
        </div>

        {error && <p className={`text-sm ${isDarkMode ? 'text-[#ff8ab6]' : 'text-red-500'}`}>{error}</p>}
      </div>

      {course && (
        <section className="space-y-8">
          <div className={`rounded-3xl border shadow-xl p-6 space-y-4 transition-colors duration-300 ${theme.card}`}>
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
              <div>
                <p className={`text-xs uppercase tracking-[0.4em] transition-colors duration-300 ${theme.textLight}`}>Course Outline</p>
                <h2 className={`${headlineFont.className} text-3xl transition-colors duration-300 ${theme.text}`}>{course.title}</h2>
                <p className={`text-sm max-w-3xl transition-colors duration-300 ${theme.textMuted}`}>{course.description}</p>
              </div>
              <button
                onClick={exportCourseJson}
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-300 ${theme.buttonBorder}`}
              >
                Export JSON
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{ label: 'Difficulty', value: course.difficulty }, { label: 'Duration', value: course.duration }, { label: 'Modules', value: course.modules.length }, { label: 'Topics', value: course.modules.reduce((acc, m) => acc + m.topics.length, 0) }].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-3 transition-colors duration-300 ${theme.card}`}>
                  <p className={`text-xs uppercase tracking-[0.3em] transition-colors duration-300 ${theme.textLight}`}>{item.label}</p>
                  <p className={`text-lg font-semibold capitalize transition-colors duration-300 ${theme.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
            {generationStats && (
              <div className={`rounded-2xl border p-3 text-sm flex flex-wrap gap-4 transition-colors duration-300 ${theme.cardSecondary} ${theme.textMuted}`}>
                <span>✅ Generated successfully</span>
                {generationStats.time && <span>⏱ {(generationStats.time / 1000).toFixed(1)}s</span>}
                {typeof generationStats.videos === 'number' && <span>🎞 {generationStats.videos} videos pulled</span>}
              </div>
            )}
          </div>

          {/* Module Carousel */}
          <ModuleCarousel
            modules={course.modules}
            onModuleSelect={(moduleId, index) => {
              setSelectedModuleId(moduleId);
              setExpandedModules(new Set([moduleId]));
              // Scroll to the module details section
              setTimeout(() => {
                const detailElement = document.getElementById('module-details');
                if (detailElement) {
                  detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
            loop={true}
            isDarkMode={isDarkMode}
          />

          <LearningPathCohortCard
            topic={course.title}
            learnerCount={Math.max(90, course.modules.length * 42 + course.title.length * 3)}
            joinUrl={buildStudyLink(course.title)}
            isDarkMode={isDarkMode}
          />

          {formData.includeVideos !== false && hasVideoContent && (
            <FeaturedVideoWorkspace
              videos={featuredVideos ?? null}
              topic={course.title}
              fallbackVideos={aggregatedCourseVideos}
            />
          )}

          {/* Module Details Section */}
          {selectedModuleId && (
            <div id="module-details" className="scroll-mt-8">
              <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
                <div className="space-y-4">
                  {course.modules
                    .filter((m) => m.id === selectedModuleId)
                    .map((module) => renderModule(module))}
                </div>
                <CourseNotesSidebar 
                  key={`${course.id}-${selectedModuleId}`} 
                  modules={course.modules}
                  selectedModuleId={selectedModuleId}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          )}
        </section>
      )}
      </div>
    </div>
  );
}
