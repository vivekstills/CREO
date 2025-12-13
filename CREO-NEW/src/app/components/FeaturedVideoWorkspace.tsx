'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FeaturedVideosPayload, Video } from '@/app/types/course';

interface FeaturedVideoWorkspaceProps {
  videos: FeaturedVideosPayload | null;
  topic: string;
  fallbackVideos?: Video[];
}

type VideoCategory = 'popular' | 'topRated';

interface NoteEntry {
  id: string;
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

const formatTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (safeSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

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

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
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

const pickMostPopularVideo = (videos: Video[]): Video | null => {
  if (!videos || videos.length === 0) {
    return null;
  }
  return videos
    .slice()
    .sort((a, b) => b.viewCount - a.viewCount)[0];
};

const pickTopRatedVideo = (videos: Video[], fallback?: Video | null): Video | null => {
  if (!videos || videos.length === 0) {
    return fallback ?? null;
  }
  const sorted = videos
    .slice()
    .sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.viewCount - a.viewCount;
    });
  return sorted[0] || fallback || null;
};

export default function FeaturedVideoWorkspace({ videos, topic, fallbackVideos = [] }: FeaturedVideoWorkspaceProps) {
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('popular');
  const [notesByVideo, setNotesByVideo] = useState<Record<string, NoteEntry[]>>({});
  const [noteText, setNoteText] = useState('');
  const playerRef = useRef<YouTubePlayer | null>(null);
  const reactId = useId();
  const playerElementId = useMemo(() => `featured-player-${reactId.replace(/:/g, '-')}`, [reactId]);

  const fallbackPopular = useMemo(() => pickMostPopularVideo(fallbackVideos), [fallbackVideos]);
  const fallbackTopRated = useMemo(
    () => pickTopRatedVideo(fallbackVideos, fallbackPopular),
    [fallbackVideos, fallbackPopular]
  );

  const availablePopular = videos?.popular ?? fallbackPopular ?? null;
  const availableTopRated = videos?.topRated ?? fallbackTopRated ?? null;

  const hasPopular = Boolean(availablePopular);
  const hasTopRated = Boolean(availableTopRated);

  const effectiveCategory: VideoCategory = useMemo(() => {
    if (activeCategory === 'popular' && hasPopular) return 'popular';
    if (activeCategory === 'topRated' && hasTopRated) return 'topRated';
    if (hasPopular) return 'popular';
    if (hasTopRated) return 'topRated';
    return activeCategory;
  }, [activeCategory, hasPopular, hasTopRated]);

  const activeVideo = useMemo(() => {
    if (effectiveCategory === 'topRated') {
      return availableTopRated || availablePopular;
    }
    return availablePopular || availableTopRated;
  }, [availablePopular, availableTopRated, effectiveCategory]);

  const activeVideoId = activeVideo?.id;
  const activeNotes = activeVideoId ? notesByVideo[activeVideoId] || [] : [];

  useEffect(() => {
    let isMounted = true;

    if (!activeVideo) {
      playerRef.current?.stopVideo?.();
      return () => {
        isMounted = false;
      };
    }

    const loadPlayer = async () => {
      if (typeof window === 'undefined') return;
      await ensureYouTubeIframeApi();

      if (!isMounted || !activeVideo) return;

      if (playerRef.current) {
        playerRef.current.loadVideoById(activeVideo.id);
        return;
      }

      const youTubeNamespace = window.YT;
      if (!youTubeNamespace || !youTubeNamespace.Player) {
        return;
      }

      playerRef.current = new youTubeNamespace.Player(playerElementId, {
        videoId: activeVideo.id,
        width: '100%',
        height: '360',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          playsinline: 1
        }
      });
    };

    loadPlayer();

    return () => {
      isMounted = false;
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

  const handleAddNote = () => {
    if (!noteText.trim() || !activeVideoId) return;
    const timestampSeconds = Math.floor(playerRef.current?.getCurrentTime?.() ?? 0);

    const newNote: NoteEntry = {
      id: `${activeVideoId}-${Date.now()}`,
      text: noteText.trim(),
      timestampSeconds,
      createdAt: new Date().toISOString()
    };

    setNotesByVideo(prev => ({
      ...prev,
      [activeVideoId]: [...(prev[activeVideoId] || []), newNote]
    }));

    setNoteText('');
  };

  const handleSeek = (seconds: number) => {
    if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
    playerRef.current.seekTo(seconds, true);
    playerRef.current.playVideo?.();
  };

  const renderVideoMeta = (video: Video) => (
    <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{video.title}</div>
      <div>{video.channelName}</div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span>{video.duration}</span>
        <span>•</span>
        <span>{video.viewCount.toLocaleString()} views</span>
        {video.rating && (
          <>
            <span>•</span>
            <span>⭐ {video.rating.toFixed(1)}%</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-blue-600 dark:text-blue-300 tracking-wide mb-1">
                Topic Spotlight
              </p>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Learn with YouTube: {topic || 'Select a topic'}
              </h3>
            </div>
            <div className="inline-flex rounded-full border border-zinc-200 dark:border-zinc-700 divide-x divide-zinc-200 dark:divide-zinc-700 overflow-hidden">
              <button
                onClick={() => setActiveCategory('popular')}
                disabled={!hasPopular}
                className={`px-3 py-1 text-sm ${effectiveCategory === 'popular' ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-300'} ${!hasPopular ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Most Popular
              </button>
              <button
                onClick={() => setActiveCategory('topRated')}
                disabled={!hasTopRated}
                className={`px-3 py-1 text-sm ${effectiveCategory === 'topRated' ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-300'} ${!hasTopRated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Highest Rated
              </button>
            </div>
          </div>

          {activeVideo ? (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <div id={playerElementId} className="w-full h-full" />
              </div>
              {renderVideoMeta(activeVideo)}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center text-sm text-zinc-500 px-6">
              <p className="font-semibold text-zinc-700 dark:text-zinc-200">Waiting on curated clips</p>
              <p className="text-zinc-500 dark:text-zinc-400">
                No highlight videos were returned for this topic. Make sure "Include curated YouTube videos" stays on, confirm your{' '}
                <code className="font-mono text-xs">YOUTUBE_API_KEY</code> is configured (see <span className="font-semibold">YOUTUBE_SETUP.md</span>), and regenerate or try a new topic.
              </p>
              <p className="text-zinc-400">We&apos;ll surface streams here as soon as they arrive.</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
            Notes & Timestamps
          </h4>
          <div className="space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={activeVideo ? 'Write a note about this moment...' : 'Play a video to start taking notes.'}
              className="w-full h-24 rounded-md border border-zinc-200 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!activeVideo}
            />
            <button
              onClick={handleAddNote}
              disabled={!activeVideo || !noteText.trim()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add timestamped note
            </button>
          </div>

          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
            {activeNotes.length === 0 && (
              <p className="text-sm text-zinc-500">
                Your timestamps will appear here for quick review.
              </p>
            )}
            {activeNotes.map(note => (
              <div key={note.id} className="bg-white dark:bg-zinc-900 rounded-md p-3 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => handleSeek(note.timestampSeconds)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {formatTimestamp(note.timestampSeconds)}
                </button>
                <p className="text-sm text-zinc-700 dark:text-zinc-200 mt-1">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
