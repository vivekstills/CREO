'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Video } from '@/app/types/course';

interface ModuleVideoWorkspaceProps {
  moduleId: string;
  moduleTitle: string;
  videos: Video[];
}

type VideoCategory = 'popular' | 'topRated';

interface NoteEntry {
  id: string;
  videoId: string;
  text: string;
  timestampSeconds: number;
  createdAt: string;
}

interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo?: () => void;
  stopVideo?: () => void;
  destroy: () => void;
  getCurrentTime: () => number;
}

interface YTNamespace {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, unknown>;
      events?: Record<string, (...args: unknown[]) => void>;
    }
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ensureYouTubeIframeApi = () => {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });
};

const formatTimestamp = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const pickMostPopular = (videos: Video[]) => {
  return videos.slice().sort((a, b) => b.viewCount - a.viewCount)[0] || null;
};

const pickTopRated = (videos: Video[], fallback?: Video | null) => {
  const rated = videos
    .slice()
    .sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.viewCount - a.viewCount;
    })[0];
  if (rated && rated.rating) return rated;
  return fallback || rated || null;
};

export default function ModuleVideoWorkspace({ moduleId, moduleTitle, videos }: ModuleVideoWorkspaceProps) {
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('popular');
  const [notesByVideo, setNotesByVideo] = useState<Record<string, NoteEntry[]>>({});
  const [noteText, setNoteText] = useState('');
  const playerRef = useRef<YouTubePlayer | null>(null);
  const reactId = useId();
  const playerElementId = useMemo(() => `module-player-${moduleId}-${reactId.replace(/:/g, '-')}`, [moduleId, reactId]);

  const popularVideo = useMemo(() => pickMostPopular(videos), [videos]);
  const topRatedVideo = useMemo(() => pickTopRated(videos, popularVideo), [videos, popularVideo]);

  const hasPopular = Boolean(popularVideo);
  const hasTopRated = Boolean(topRatedVideo);

  const effectiveCategory: VideoCategory = useMemo(() => {
    if (activeCategory === 'popular' && hasPopular) return 'popular';
    if (activeCategory === 'topRated' && hasTopRated) return 'topRated';
    if (hasPopular) return 'popular';
    if (hasTopRated) return 'topRated';
    return activeCategory;
  }, [activeCategory, hasPopular, hasTopRated]);

  const activeVideo = useMemo(() => {
    if (effectiveCategory === 'topRated') {
      return topRatedVideo || popularVideo;
    }
    return popularVideo || topRatedVideo;
  }, [effectiveCategory, popularVideo, topRatedVideo]);

  useEffect(() => {
    let mounted = true;

    if (!activeVideo) {
      playerRef.current?.stopVideo?.();
      return () => {
        mounted = false;
      };
    }

    const load = async () => {
      if (typeof window === 'undefined') return;
      await ensureYouTubeIframeApi();
      if (!mounted || !activeVideo) return;

      if (playerRef.current) {
        playerRef.current.loadVideoById(activeVideo.id);
        return;
      }

      const namespace = window.YT;
      if (!namespace || !namespace.Player) return;

      playerRef.current = new namespace.Player(playerElementId, {
        videoId: activeVideo.id,
        width: '100%',
        height: '320',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          playsinline: 1
        }
      });
    };

    load();

    return () => {
      mounted = false;
    };
  }, [activeVideo, playerElementId]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const activeNotes = activeVideo ? notesByVideo[activeVideo.id] || [] : [];

  const handleAddNote = () => {
    if (!activeVideo || !noteText.trim()) return;
    const timestampSeconds = Math.floor(playerRef.current?.getCurrentTime?.() ?? 0);
    const newNote: NoteEntry = {
      id: `${activeVideo.id}-${Date.now()}`,
      videoId: activeVideo.id,
      text: noteText.trim(),
      timestampSeconds,
      createdAt: new Date().toISOString()
    };
    setNotesByVideo((prev) => ({
      ...prev,
      [activeVideo.id]: [newNote, ...(prev[activeVideo.id] || [])]
    }));
    setNoteText('');
  };

  const handleSeek = (seconds: number) => {
    if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
    playerRef.current.seekTo(seconds, true);
    playerRef.current.playVideo?.();
  };

  return (
    <div className="bg-white rounded-3xl border border-[#f2e7d9] shadow-xl p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c1b6a4]">Topic Spotlight</p>
        <h3 className="text-2xl text-[#111] font-semibold">{moduleTitle} · Live Clips</h3>
        <p className="text-sm text-[#4a4a4a]">Stream the most popular or highest-rated walkthrough without leaving CREO.</p>
      </div>

      <div className="inline-flex rounded-full border border-[#f2e7d9] overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setActiveCategory('popular')}
          disabled={!hasPopular}
          className={`px-4 py-1 ${effectiveCategory === 'popular' ? 'bg-[#111] text-white' : 'text-[#111]'}`}
        >
          Most Popular
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('topRated')}
          disabled={!hasTopRated}
          className={`px-4 py-1 ${effectiveCategory === 'topRated' ? 'bg-[#111] text-white' : 'text-[#111]'}`}
        >
          Highest Rated
        </button>
      </div>

      {activeVideo ? (
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-2xl border border-[#f4dfd6] bg-gradient-to-br from-[#fff2eb] via-[#ffe5f5] to-[#fde8df] shadow-[0_25px_60px_rgba(233,190,186,0.35)] overflow-hidden">
            <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-r from-[#f9a8a8] via-transparent to-[#ff90c2]" />
            <div id={playerElementId} className="relative z-10 h-full w-full rounded-2xl bg-transparent" />
          </div>
          <div className="text-sm text-[#4a4a4a] space-y-1">
            <p className="text-[#111] font-semibold">{activeVideo.title}</p>
            <p>
              {activeVideo.channelName} · {activeVideo.duration}
            </p>
            <p>
              {activeVideo.viewCount.toLocaleString()} views{' '}
              {activeVideo.rating ? `· ⭐ ${activeVideo.rating.toFixed(1)}%` : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-dashed border-[#f2e7d9] bg-[#fffaf6] px-6">
          <p className="font-semibold text-[#111]">Module player ready</p>
          <p className="text-sm text-[#6f6f6f]">
            We couldn&apos;t fetch clips for <span className="font-semibold">{moduleTitle}</span> this run. Keep the
            "Include curated YouTube videos" toggle on, make sure your <code className="font-mono text-xs">YOUTUBE_API_KEY</code>{' '}
            is valid, and regenerate or try a new topic to light up this stream.
          </p>
        </div>
      )}

      <div className="bg-[#fdf8f2] rounded-2xl border border-[#f2e7d9] p-4 space-y-3">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c1b6a4]">Notes & timestamps</p>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={
            activeVideo ? 'Capture what clicked at this moment...' : 'Press play on a module clip to take notes.'
          }
          disabled={!activeVideo}
          className="w-full rounded-2xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!noteText.trim() || !activeVideo}
          className="w-full rounded-full bg-[#111] text-white text-sm font-semibold tracking-wide py-2 disabled:opacity-40"
        >
          Save timestamped note
        </button>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {activeNotes.length === 0 && <p className="text-sm text-[#6f6f6f]">Notes for this clip will appear here.</p>}
          {activeNotes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-[#f2e7d9] p-3 bg-white">
              <button
                type="button"
                onClick={() => handleSeek(note.timestampSeconds)}
                className="text-xs font-semibold text-[#111]"
              >
                {formatTimestamp(note.timestampSeconds)}
              </button>
              <p className="text-sm text-[#4a4a4a] mt-1">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
