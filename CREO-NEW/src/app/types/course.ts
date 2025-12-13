/**
 * Type definitions for the course generation system
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  channelName: string;
  channelId: string;
  publishedAt: string;
  rating?: number;
  relevanceScore?: number;
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  learningObjectives: string[];
  estimatedDuration: string;
  topics: CourseTopic[];
  assessment?: ModuleAssessment;
}

export interface CourseTopic {
  id: string;
  topicNumber: number;
  title: string;
  content: string;
  keyPoints: string[];
  practiceQuestions?: string[];
  searchKeywords?: string[];
  videos: Video[];
  resources?: Resource[];
}

export interface ModuleAssessment {
  quizTitle: string;
  quizQuestions: string[];
  problemSetTitle: string;
  problemPrompts: string[];
}

export interface Resource {
  title: string;
  url: string;
  type: 'article' | 'documentation' | 'tool' | 'book' | 'other';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  prerequisites: string[];
  learningOutcomes: string[];
  modules: CourseModule[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseGenerationRequest {
  topic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string; // e.g., "4 weeks", "30 hours"
  targetAudience?: string;
  prerequisites?: string[];
  focusAreas?: string[];
  includeVideos?: boolean;
  videosPerTopic?: number;
  language?: string;
  cacheBuster?: number;
}

export interface CourseGenerationResponse {
  success: boolean;
  course?: Course;
  error?: string;
  generationTime?: number;
  videosFetched?: number;
  featuredVideos?: FeaturedVideosPayload;
}

export interface FeaturedVideosPayload {
  popular?: Video | null;
  topRated?: Video | null;
}
