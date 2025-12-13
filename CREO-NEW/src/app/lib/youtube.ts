/**
 * YouTube API integration for fetching educational videos
 */

import { Video } from '@/app/types/course';
import { getYouTubeApiKey } from '@/lib/apiKeys';

export interface FeaturedVideoResult {
  popular?: Video | null;
  topRated?: Video | null;
}

interface YouTubeSearchResult {
  items: Array<{
    id: { videoId: string } | string;
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default: { url: string };
      };
      channelTitle: string;
      channelId: string;
      publishedAt: string;
    };
  }>;
  error?: any;
}

interface YouTubeVideoDetails {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

/**
 * Parse ISO 8601 duration to human-readable format
 */
function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return duration;

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !hours) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

/**
 * Calculate video rating score based on engagement metrics
 */
function calculateRating(viewCount: number, likeCount: number): number {
  if (viewCount === 0) return 0;
  
  // Base rating on like ratio with view count weight
  const likeRatio = likeCount / viewCount;
  const viewWeight = Math.log10(viewCount + 1) / 10; // Logarithmic scale for views
  
  // Combine like ratio (70%) with view popularity (30%)
  const rating = (likeRatio * 0.7 + viewWeight * 0.3) * 100;
  
  // Cap at 100
  return Math.min(rating, 100);
}

/**
 * Search YouTube for educational videos on a topic
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 5,
  orderBy: 'relevance' | 'viewCount' | 'rating' = 'relevance'
): Promise<Video[]> {
  let apiKey: string | null = null;
  try {
    apiKey = await getYouTubeApiKey();
  } catch (error) {
    console.warn('YouTube API key unavailable, skipping video fetch:', error);
    return [];
  }

  try {
    // Add educational keywords to improve results
    const educationalQuery = `${query} tutorial explanation "how to" learn`;
    
    // Search for videos
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: educationalQuery,
      type: 'video',
      maxResults: String(maxResults * 2), // Get extra to filter
      order: orderBy,
      videoDuration: 'medium', // 4-20 minutes
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      relevanceLanguage: 'en',
      key: apiKey
    });

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('YouTube search error:', error);
      return [];
    }

    const searchData: YouTubeSearchResult = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Extract video IDs
    const videoIds = searchData.items
      .map(item => {
        if (typeof item.id === 'string') return item.id;
        return item.id?.videoId;
      })
      .filter(Boolean)
      .slice(0, maxResults * 2);

    if (videoIds.length === 0) {
      return [];
    }

    // Get detailed statistics for videos
    const statsParams = new URLSearchParams({
      part: 'contentDetails,statistics',
      id: videoIds.join(','),
      key: apiKey
    });

    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${statsParams}`
    );

    if (!statsResponse.ok) {
      console.error('YouTube stats error:', await statsResponse.text());
      // Return basic info without stats
      return searchData.items.slice(0, maxResults).map((item, index) => ({
        id: typeof item.id === 'string' ? item.id : item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description.substring(0, 200),
        url: `https://www.youtube.com/watch?v=${typeof item.id === 'string' ? item.id : item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails.high?.url || 
                     item.snippet.thumbnails.medium?.url || 
                     item.snippet.thumbnails.default.url,
        duration: 'Unknown',
        viewCount: 0,
        likeCount: 0,
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        rating: 0,
        relevanceScore: maxResults - index
      }));
    }

    const statsData: YouTubeVideoDetails = await statsResponse.json();

    // Combine search results with statistics
    const videos: Video[] = searchData.items
      .map(searchItem => {
        const videoId = typeof searchItem.id === 'string' ? searchItem.id : searchItem.id.videoId;
        const statsItem = statsData.items.find(item => item.id === videoId);
        
        if (!statsItem) return null;
        
        const viewCount = parseInt(statsItem.statistics.viewCount || '0');
        const likeCount = parseInt(statsItem.statistics.likeCount || '0');
        const rating = calculateRating(viewCount, likeCount);
        
        return {
          id: videoId,
          title: searchItem.snippet.title,
          description: searchItem.snippet.description.substring(0, 200),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl: searchItem.snippet.thumbnails.high?.url || 
                       searchItem.snippet.thumbnails.medium?.url || 
                       searchItem.snippet.thumbnails.default.url,
          duration: parseDuration(statsItem.contentDetails.duration),
          viewCount,
          likeCount,
          channelName: searchItem.snippet.channelTitle,
          channelId: searchItem.snippet.channelId,
          publishedAt: searchItem.snippet.publishedAt,
          rating,
          relevanceScore: 0
        };
      })
      .filter((video): video is Video => video !== null);

    // Sort by combined score (rating + relevance)
    const sortedVideos = videos
      .map((video, index) => ({
        ...video,
        relevanceScore: videos.length - index // Higher score for earlier results
      }))
      .sort((a, b) => {
        // Combine rating (60%) and relevance (40%)
        const scoreA = (a.rating || 0) * 0.6 + a.relevanceScore * 0.4;
        const scoreB = (b.rating || 0) * 0.6 + b.relevanceScore * 0.4;
        return scoreB - scoreA;
      });

    return sortedVideos.slice(0, maxResults);

  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
}

/**
 * Fetch multiple video sets for different topics in parallel
 */
export async function fetchVideosForTopics(
  topics: Array<{ id: string; query: string }>,
  videosPerTopic: number = 3
): Promise<Map<string, Video[]>> {
  const videoMap = new Map<string, Video[]>();
  
  // Fetch videos in parallel with rate limiting
  const batchSize = 5; // Process 5 topics at a time
  
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize);
    const promises = batch.map(({ id, query }) =>
      searchYouTubeVideos(query, videosPerTopic, 'relevance')
        .then((videos) => ({ topicId: id, videos }))
        .catch(err => {
          console.error(`Error fetching videos for ${query}:`, err);
          return { topicId: id, videos: [] };
        })
    );
    
    const results = await Promise.all(promises);
    results.forEach(({ topicId, videos }) => {
      videoMap.set(topicId, videos);
    });
    
    // Small delay to avoid rate limiting
    if (i + batchSize < topics.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return videoMap;
}

/**
 * Fetch global featured videos for the user's topic (popular + top rated)
 */
export async function fetchFeaturedVideos(
  topic: string
): Promise<FeaturedVideoResult | null> {
  const trimmedTopic = topic.trim();
  if (!trimmedTopic) {
    return null;
  }

  const [popularList, ratedList] = await Promise.all([
    searchYouTubeVideos(trimmedTopic, 5, 'viewCount'),
    searchYouTubeVideos(trimmedTopic, 5, 'rating')
  ]);

  const popular = popularList[0] || null;
  let topRated = ratedList.find(video => video.id !== popular?.id) || ratedList[0] || null;

  if (!popular && !topRated) {
    return null;
  }

  return {
    popular,
    topRated
  };
}
