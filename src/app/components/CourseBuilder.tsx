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
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });
const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });
type DurationVariant = { label: string; value: string };

const parseDurationToDays = (value?: string) => {
  if (!value) return 28;
  const match = value.match(/(\d+(?:\.\d+)?)\s*(day|week|month|year)s?/i);
  if (!match) return 28;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitToDays: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
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

export default function CourseBuilder() {
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
  const [generationStats, setGenerationStats] = useState<{ time?: number; videos?: number } | null>(null);
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'done'>('idle');
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cadenceIndex, setCadenceIndex] = useState(0);
  const durationVariants = useMemo(() => buildDurationVariants(formData.duration), [formData.duration]);
  const activeDurationVariant =
    durationVariants.length > 0 ? durationVariants[cadenceIndex % durationVariants.length] : { label: 'Weeks', value: '—' };
  const aggregatedCourseVideos = useMemo(() => (course ? collectCourseVideos(course.modules) : []), [course]);
  const hasVideoContent = useMemo(
    () => Boolean(featuredVideos?.popular || featuredVideos?.topRated || aggregatedCourseVideos.length),
    [featuredVideos, aggregatedCourseVideos]
  );

  useEffect(() => {
    const count = durationVariants.length || 1;
    const interval = setInterval(() => {
      setCadenceIndex((prev) => (prev + 1) % count);
    }, 2600);
    return () => clearInterval(interval);
  }, [durationVariants.length]);

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
          className="flex items-center gap-2 rounded-full border border-[#efe7df] bg-[#fffbf7] px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[#a18c82]"
        >
          <span className="h-2 w-2 rounded-full bg-[#e8d6c9]" />
          Ready
        </motion.div>
      )}
      {statusState === 'loading' && (
        <motion.div
          key="status-loading"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-3 rounded-full border border-[#ffe0d6] bg-[#fff6f2] px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[#a14848] shadow-sm"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff9a8b]/40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff6b8b]" />
          </span>
          <span>Generating</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#ffe7e0]">
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
          className="flex items-center gap-3 rounded-full border border-[#d7f5df] bg-[#f3fff6] px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[#1d5c34] shadow-sm"
        >
          <motion.span
            className="relative inline-flex h-3 w-3 rounded-full bg-[#34d399]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
          <span>Course ready</span>
          <motion.span
            className="relative inline-flex h-3 w-16 overflow-hidden rounded-full bg-[#e3ffe9]"
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
    <div className="rounded-2xl border border-[#f2e7d9] p-4 bg-white" key={video.id}>
      <div className="flex gap-3">
        <img src={video.thumbnailUrl} alt={video.title} className="w-32 h-20 object-cover rounded-lg" />
        <div className="flex-1">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#111] hover:underline"
          >
            {video.title}
          </a>
          <p className="text-xs text-[#6f6f6f] mt-1">
            {video.channelName} · {video.duration}
          </p>
          <p className="text-xs text-[#6f6f6f] mt-1">
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
      <div key={topic.id} className="rounded-2xl border border-[#f2e7d9] bg-white">
        <button
          onClick={() => toggleTopic(topicId)}
          className="w-full text-left px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#c1b6a4]">Topic {topic.topicNumber}</p>
            <p className="text-[#111] font-semibold">{topic.title}</p>
          </div>
          <span className="text-[#111]">{isExpanded ? '−' : '+'}</span>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 text-sm text-[#4a4a4a]">
            <p>{topic.content}</p>
            {topic.keyPoints?.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#c1b6a4] mb-2">Key Points</p>
                <ul className="list-disc list-inside space-y-1">
                  {topic.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {topic.practiceQuestions?.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#c1b6a4] mb-2">Practice Prompts</p>
                <ol className="list-decimal list-inside space-y-1">
                  {topic.practiceQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {topic.videos?.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#c1b6a4] mb-2">Suggested Clips</p>
                <div className="space-y-3">{topic.videos.map((video) => renderVideo(video))}</div>
              </div>
            ) : (
              <p className="text-xs text-[#a1a1a1]">No videos surfaced for this topic.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderModule = (module: CourseModule) => {
    const isExpanded = expandedModules.has(module.id);
    return (
      <div key={module.id} className="rounded-3xl border border-[#f2e7d9] bg-white shadow-sm">
        <button onClick={() => toggleModule(module.id)} className="w-full text-left p-5 flex justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c1b6a4]">Module {module.moduleNumber}</p>
            <p className={`${headlineFont.className} text-lg text-[#111]`}>{module.title}</p>
            <p className="text-sm text-[#4a4a4a]">{module.description}</p>
            <div className="text-xs text-[#6f6f6f] flex gap-4 mt-2">
              <span>{module.estimatedDuration}</span>
              <span>{module.topics.length} topics</span>
              <span>{module.learningObjectives.length} objectives</span>
            </div>
          </div>
          <span className="text-2xl text-[#111]">{isExpanded ? '−' : '+'}</span>
        </button>
        {isExpanded && (
          <div className="p-5 space-y-5">
            <ModuleSocialSpace
              moduleId={module.id}
              moduleTitle={module.title}
              order={module.moduleNumber}
              joinUrl={buildStudyLink(`${course.title}-${module.title}`)}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#c1b6a4] mb-2">Objectives</p>
              <ul className="list-disc list-inside text-sm text-[#4a4a4a]">
                {module.learningObjectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
            {module.assessment && (
              <div className="grid gap-4 rounded-3xl border border-[#f2e7d9] bg-[#fff8f5] p-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#f6dcd2] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c1b6a4] mb-2">{module.assessment.quizTitle || 'Module quiz'}</p>
                  {module.assessment.quizQuestions.length ? (
                    <ol className="list-decimal list-inside space-y-1 text-sm text-[#4a4a4a]">
                      {module.assessment.quizQuestions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-[#a1a1a1]">Quiz questions coming soon.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-[#f6dcd2] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c1b6a4] mb-2">{module.assessment.problemSetTitle || 'Problem set'}</p>
                  {module.assessment.problemPrompts.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#4a4a4a]">
                      {module.assessment.problemPrompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#a1a1a1]">Practice prompts coming soon.</p>
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
    <div className={`${bodyFont.className} max-w-6xl mx-auto py-10 px-4 space-y-10`}>
      <div className="space-y-6 text-center">
        <p className="text-sm tracking-[0.5em] uppercase text-[#c1b6a4]">Course Builder</p>
        <h1 className={`${headlineFont.className} text-4xl text-[#111]`}>
          Compose complete learning journeys with one prompt
        </h1>
        <p className="text-lg text-[#4a4a4a] max-w-3xl mx-auto">
          Describe your topic and pacing. We map the modules, fetch curated YouTube explainers, and package everything
          with objectives and practice prompts—while we handle prerequisites and focus areas for you.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#f2e7d9] shadow-xl p-6 space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#c1b6a4]">Configuration</p>
              <h2 className={`${headlineFont.className} text-2xl text-[#111]`}>Course Parameters</h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={generateCourse}
                disabled={loading}
                className="rounded-full bg-[#111] text-white px-6 py-2 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                    </span>
                    Generating
                  </span>
                ) : (
                  'Generate course'
                )}
              </button>
              <div className="min-h-[2.75rem] min-w-[12rem] flex items-center justify-end">{renderStatusBadge()}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-[#111]">
            Course Topic *
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., GenAI Product Design"
              className="mt-1 w-full rounded-2xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
            />
          </label>
          <label className="text-sm text-[#111]">
            Difficulty
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="text-sm text-[#111] md:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <span>Duration</span>
              <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-[#c1b6a4]">
                Time cadence
                <div className="relative h-12 w-28 overflow-hidden rounded-2xl border border-[#f2e7d9] bg-[#fff5ef] px-2">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={`${activeDurationVariant.label}-${activeDurationVariant.value}`}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex h-full flex-col items-center justify-center text-[#a95757]"
                    >
                      <span className="text-[0.55rem] tracking-[0.2em]">{activeDurationVariant.label}</span>
                      <span className="text-xs font-semibold">{activeDurationVariant.value}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="e.g., 4 weeks"
              className="mt-1 w-full rounded-2xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111]">
            <input
              type="checkbox"
              name="includeVideos"
              checked={formData.includeVideos}
              onChange={handleInputChange}
              className="rounded border-[#eaded0]"
            />
            Include curated YouTube videos
          </label>
          <label className="text-sm text-[#111]">
            Videos per topic
            <input
              type="number"
              name="videosPerTopic"
              min={1}
              max={10}
              value={formData.videosPerTopic}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {course && (
        <section className="space-y-8">
          <div className="bg-white rounded-3xl border border-[#f2e7d9] shadow-xl p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#c1b6a4]">Course Outline</p>
                <h2 className={`${headlineFont.className} text-3xl text-[#111]`}>{course.title}</h2>
                <p className="text-sm text-[#4a4a4a] max-w-3xl">{course.description}</p>
              </div>
              <button
                onClick={exportCourseJson}
                className="rounded-full border border-[#111]/20 px-5 py-2 text-sm font-semibold text-[#111]"
              >
                Export JSON
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{ label: 'Difficulty', value: course.difficulty }, { label: 'Duration', value: course.duration }, { label: 'Modules', value: course.modules.length }, { label: 'Topics', value: course.modules.reduce((acc, m) => acc + m.topics.length, 0) }].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#f2e7d9] p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c1b6a4]">{item.label}</p>
                  <p className="text-lg text-[#111] font-semibold capitalize">{item.value}</p>
                </div>
              ))}
            </div>
            {generationStats && (
              <div className="rounded-2xl border border-[#f2e7d9] bg-[#fdf8f2] p-3 text-sm text-[#4a4a4a] flex flex-wrap gap-4">
                <span>✅ Generated successfully</span>
                {generationStats.time && <span>⏱ {(generationStats.time / 1000).toFixed(1)}s</span>}
                {typeof generationStats.videos === 'number' && <span>🎞 {generationStats.videos} videos pulled</span>}
              </div>
            )}
          </div>

          <LearningPathCohortCard
            topic={course.title}
            learnerCount={Math.max(90, course.modules.length * 42 + course.title.length * 3)}
            joinUrl={buildStudyLink(course.title)}
          />

          {formData.includeVideos !== false && hasVideoContent && (
            <FeaturedVideoWorkspace
              videos={featuredVideos ?? null}
              topic={course.title}
              fallbackVideos={aggregatedCourseVideos}
            />
          )}

          <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
            <div className="space-y-4">
              {course.modules.map((module) => renderModule(module))}
            </div>
            <CourseNotesSidebar key={course.id} modules={course.modules} />
          </div>
        </section>
      )}
    </div>
  );
}
