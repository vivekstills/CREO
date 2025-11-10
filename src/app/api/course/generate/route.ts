import { NextResponse } from 'next/server';
import { Course, CourseGenerationRequest, CourseGenerationResponse, CourseModule, CourseTopic, Video } from '@/app/types/course';
import { safeJsonParse } from '@/app/utils/jsonHelpers';
import { callGeminiWithRetry } from '@/app/utils/geminiClient';
import { fetchVideosForTopics, fetchFeaturedVideos, searchYouTubeVideos } from '@/app/lib/youtube';
import { getGeminiApiKey } from '@/lib/apiKeys';

const QUIZ_MODEL = 'gemini-2.0-flash-exp';
const QUIZ_GENERATION_CONFIG = {
  temperature: 0.35,
  maxOutputTokens: 512,
  topP: 0.9,
  topK: 32
};

/**
 * Generate a structured course prompt for Gemini
 */
function generateCoursePrompt(request: CourseGenerationRequest): string {
  const { topic, difficulty, duration, targetAudience, prerequisites, focusAreas } = request;
  
  return `Create a comprehensive online course about "${topic}".

Requirements:
- Difficulty: ${difficulty || 'intermediate'}
- Duration: ${duration || '4 weeks'}
- Target Audience: ${targetAudience || 'General learners'}

Output ONLY valid JSON with this exact structure (no markdown, no other text):

{
  "title": "Clear course title",
  "description": "Course description in 100 words",
  "difficulty": "${difficulty || 'intermediate'}",
  "duration": "${duration || '4 weeks'}",
  "prerequisites": ["prereq1", "prereq2"],
  "learningOutcomes": ["outcome1", "outcome2", "outcome3", "outcome4", "outcome5"],
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module 1 title",
      "description": "Module description",
      "learningObjectives": ["objective1", "objective2", "objective3"],
      "estimatedDuration": "1 week",
      "assessment": {
        "quizTitle": "Quiz name",
        "quizQuestions": ["Question 1", "Question 2"],
        "problemSetTitle": "Problem set name",
        "problemPrompts": ["Prompt 1", "Prompt 2"]
      },
      "topics": [
        {
          "topicNumber": 1,
          "title": "Topic title",
          "content": "Topic explanation in 100-200 words",
          "keyPoints": ["point1", "point2", "point3"],
          "practiceQuestions": ["question1", "question2"],
          "searchKeywords": ["keyword1", "keyword2", "keyword3"]
        }
      ]
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Create 3-4 modules with 2-3 topics each. Each module MUST end with a short quiz (2-3 questions) and a problem set (2-3 prompts) in the assessment object. Return ONLY the JSON object, nothing else.`;
}

/**
 * Extract course JSON from Gemini response
 */
function extractCourseJson(response: string): any {
  // Try direct parse first
  const directParse = safeJsonParse(response);
  if (directParse.success) {
    return directParse.data;
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    const extracted = safeJsonParse(jsonMatch[1]);
    if (extracted.success) {
      return extracted.data;
    }
  }

  // Try to find JSON object in the response
  const objectMatch = response.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const extracted = safeJsonParse(objectMatch[0]);
    if (extracted.success) {
      return extracted.data;
    }
  }

  throw new Error('Could not extract valid JSON from response');
}

type TopicContext = {
  core: string;
  secondary?: string;
  domain: string;
  artifact: string;
  practice: string;
  reflection: string;
};

const TOPIC_DOMAINS: Array<{ regex: RegExp; domain: string; artifact: string; practice: string; reflection: string }> = [
  { regex: /(ai|machine learning|ml|data|analytics)/i, domain: 'Data & AI systems', artifact: 'model demo', practice: 'lab sprint', reflection: 'post-experiment brief' },
  { regex: /(design|ux|ui|creative|brand|product)/i, domain: 'Product & design craft', artifact: 'prototype', practice: 'studio loop', reflection: 'crit notes' },
  { regex: /(marketing|growth|content|copy|story)/i, domain: 'Growth & storytelling', artifact: 'campaign', practice: 'creative sprint', reflection: 'retro journal' },
  { regex: /(cloud|devops|infra|platform|security)/i, domain: 'Systems & infrastructure', artifact: 'runbook', practice: 'simulation block', reflection: 'incident notes' },
  { regex: /(leadership|strategy|management|operations)/i, domain: 'Leadership & operations', artifact: 'operating doc', practice: 'alignment cadence', reflection: 'decision memo' }
];

const hashString = (value: string) =>
  value
    .split('')
    .reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);

const pickVariant = (seed: string, options: string[]) => options[Math.abs(hashString(seed)) % options.length];

const DIFFICULTY_TONES: Record<
  NonNullable<CourseGenerationRequest['difficulty']>,
  { voice: string; focus: string; cadence: string }
> = {
  beginner: {
    voice: 'gentle ramp',
    focus: 'confidence-first reps',
    cadence: 'short bursts with frequent check-ins'
  },
  intermediate: {
    voice: 'momentum build',
    focus: 'applied practice blocks',
    cadence: 'balanced weekly loops'
  },
  advanced: {
    voice: 'deep dive studio',
    focus: 'complex briefs and critical reviews',
    cadence: 'long-form immersion windows'
  }
};

type DurationMeta = {
  value: number;
  unit: 'day' | 'week' | 'month' | 'year';
  totalDays: number;
  label: string;
};

const parseDurationInput = (duration?: string): DurationMeta => {
  if (!duration) {
    return { value: 2, unit: 'week', totalDays: 14, label: '2 weeks' };
  }
  const match = duration.match(/(\d+(?:\.\d+)?)\s*(day|week|month|year)s?/i);
  if (!match) {
    return { value: 2, unit: 'week', totalDays: 14, label: duration };
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase() as DurationMeta['unit'];
  const unitToDays: Record<DurationMeta['unit'], number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365
  };
  return {
    value,
    unit,
    totalDays: Math.max(1, Math.round(value * unitToDays[unit])),
    label: `${value} ${unit}${value > 1 ? 's' : ''}`
  };
};

const formatDurationSlice = (days: number) => {
  if (days >= 30) {
    return `${Math.max(1, Math.round(days / 30))} mo`;
  }
  if (days >= 7) {
    return `${Math.max(1, Math.round(days / 7))} wk`;
  }
  return `${Math.max(1, Math.round(days))} d`;
};

const assignModuleDurations = (totalDays: number, slices: number[]) => {
  const allocations = slices.map((slice) => Math.max(1, Math.round(totalDays * slice)));
  const sum = allocations.reduce((acc, curr) => acc + curr, 0);
  if (sum !== totalDays && allocations.length) {
    const diff = totalDays - sum;
    allocations[allocations.length - 1] = Math.max(1, allocations[allocations.length - 1] + diff);
  }
  return allocations.map(formatDurationSlice);
};

const deriveTopicContext = (topic: string): TopicContext => {
  const normalized = topic.trim();
  const secondary = normalized.split(/[:\-|,\/]/).map((part) => part.trim()).filter(Boolean)[1];
  for (const bucket of TOPIC_DOMAINS) {
    if (bucket.regex.test(normalized)) {
      return {
        core: normalized,
        secondary,
        domain: bucket.domain,
        artifact: bucket.artifact,
        practice: bucket.practice,
        reflection: bucket.reflection
      };
    }
  }
  return {
    core: normalized || 'Learning goal',
    secondary,
    domain: 'Independent study',
    artifact: 'project',
    practice: 'practice block',
    reflection: 'study journal'
  };
};

type TopicDetails = {
  title: string;
  narrative: string;
  keyPoints: string[];
  practice: string[];
  seeds?: string[];
};

const makeTopic = (topicNumber: number, details: TopicDetails, searchSeeds?: string[]) => ({
  topicNumber,
  title: details.title,
  content: details.narrative,
  keyPoints: details.keyPoints,
  practiceQuestions: details.practice,
  searchKeywords: searchSeeds ?? details.seeds ?? [],
  videos: [],
  resources: []
});

function buildFallbackCourseData(request: CourseGenerationRequest) {
  const topic = (request.topic || 'Your Topic').trim();
  const context = deriveTopicContext(topic);
  const friendlyTopic = context.core;
  const variantSeed = topic.toLowerCase();
  const difficulty = request.difficulty || 'intermediate';
  const tone = DIFFICULTY_TONES[difficulty];
  const durationMeta = parseDurationInput(request.duration);
  const moduleDurations = assignModuleDurations(durationMeta.totalDays, [0.3, 0.4, 0.3]);
  const focusLabel = context.secondary ? `${context.core} & ${context.secondary}` : context.core;
  const baseDescription = `A ${tone.voice} for ${focusLabel}. Navigate ${context.domain.toLowerCase()}, ship a ${context.artifact}, and capture reflections after every ${context.practice}. Expect ${tone.cadence}.`;
  const difficultyCue = pickVariant(variantSeed + difficulty, [
    `Tune your ${context.practice} cadence to suit this ${difficulty} focus.`,
    `Lean into ${tone.focus} so ${friendlyTopic} compounds weekly.`,
    `Use every checkpoint to pressure-test ${friendlyTopic} decisions.`
  ]);

  const keywords = friendlyTopic.split(/\s+/).map((word) => word.trim()).filter(Boolean);
  const primaryKeyword = keywords[0] || friendlyTopic;
  const accentKeyword = keywords[1] || context.secondary || friendlyTopic;

  const moduleBlueprints = [
    {
      slug: 'scan',
      title: `${primaryKeyword} Signal Scan`,
      description: `Audit how ${friendlyTopic} shows up today across ${context.domain.toLowerCase()}. Capture the vocabulary, pain points, and wild success stories feeding your ${tone.voice}.`,
      objectives: [
        `Identify three ${friendlyTopic} wins in your space.`,
        `Translate ${friendlyTopic} jargon into your team's language.`,
        `Outline stakeholders who feel the impact of ${friendlyTopic}.`
      ],
      topics: [
        {
          title: `${friendlyTopic} field log`,
          narrative: `Collect raw notes from practitioners applying ${friendlyTopic} right now. Pay attention to constraints unique to ${context.domain}.`,
          keyPoints: ['Who benefits most', 'Where work slows down', 'What “good” sounds like'],
          practice: [
            `Write a one-pager summarizing a ${friendlyTopic} case study relevant to you.`,
            `Highlight the KPIs leaders track when ${friendlyTopic} is working.`
          ],
          seeds: [`${friendlyTopic} case study`, `${friendlyTopic} KPI`]
        },
        {
          title: `${accentKeyword} lexicon`,
          narrative: `Create a shared glossary so future modules reuse the same cues. Keep it simple enough for cross-functional partners to follow.`,
          keyPoints: ['Critical definitions', 'Supporting analogies', 'Common confusions'],
          practice: [
            `Record a 60-second voice note explaining ${friendlyTopic} to a teammate.`,
            `Draft flash cards for five ${friendlyTopic} patterns you want to remember.`
          ],
          seeds: [`${friendlyTopic} glossary`, `${friendlyTopic} fundamentals`]
        }
      ],
      assessment: {
        quizTitle: `Compass check · ${friendlyTopic}`,
        quizQuestions: [
          `What outcomes prove ${friendlyTopic} is adding value?`,
          `Which ${context.domain.toLowerCase()} role mentions ${friendlyTopic} most often?`,
          `Name a risk that appears when ${friendlyTopic} is rushed.`
        ],
        problemSetTitle: `${friendlyTopic} intent journal`,
        problemPrompts: [
          `Capture why ${friendlyTopic} matters to you over the next ${durationMeta.label}.`,
          `List two metrics you’ll watch as you progress.`
        ]
      }
    },
    {
      slug: 'build',
      title: `${pickVariant(variantSeed + 'm2title', ['Systems Studio', 'Pattern Lab', 'Workflow Forge'])} · ${friendlyTopic} mechanics`,
      description: `Blend guided walkthroughs with tighter reps so ${friendlyTopic} feels natural. Layer ${tone.focus} using your ${context.practice}.`,
      objectives: [
        `Follow a trusted ${friendlyTopic} walkthrough and annotate each decision.`,
        `Prototype a lightweight ${context.artifact} in your environment.`,
        `Document blockers tied to ${difficulty} learners and suggest fixes.`
      ],
      topics: [
        {
          title: `Guided ${friendlyTopic} reps`,
          narrative: `Shadow an expert shipping ${friendlyTopic}. Pause to map the tools, prompts, and review loops they rely on.`,
          keyPoints: ['Trigger points for reviews', 'Non-negotiable quality bars', 'How they recover from mistakes'],
          practice: [
            `Transcribe the workflow you observed into a checklist for your team.`,
            `Suggest two swaps to localize the walkthrough for your stack.`
          ],
          seeds: [`${friendlyTopic} tutorial`, `${friendlyTopic} workflow`]
        },
        {
          title: `${context.artifact} micro build`,
          narrative: `Transfer the walkthrough into a reality check. Keep scope tiny but force yourself to make explicit ${friendlyTopic} decisions.`,
          keyPoints: ['Set success criteria before starting', 'Track every assumption', 'Borrow critique rubrics from peers'],
          practice: [
            `Publish a 2-slide or repo readme showing your ${context.artifact}.`,
            `Run a 15-minute async critique focusing on one ${friendlyTopic} decision.`
          ],
          seeds: [`${friendlyTopic} practice`, `${friendlyTopic} prototype`]
        }
      ],
      assessment: {
        quizTitle: `${friendlyTopic} systems pulse`,
        quizQuestions: [
          `Which part of the build demanded the deepest ${friendlyTopic} reasoning?`,
          `How would you coach a teammate through the trickiest step?`,
          `What metric would confirm your ${context.artifact} is production ready?`
        ],
        problemSetTitle: 'Retro snapshot',
        problemPrompts: [
          `Run a Start / Stop / Continue retro on your ${friendlyTopic} routine.`,
          `List blockers you need help removing before the next sprint.`
        ]
      }
    },
    {
      slug: 'ship',
      title: `${pickVariant(variantSeed + 'm3title', ['Impact Sprint', 'Launch Studio', 'Signals Launch'])} · ${friendlyTopic} release`,
      description: `Apply ${friendlyTopic} to a scenario you care about, gather feedback, and plan the next rev. Document insights in your ${context.reflection}.`,
      objectives: [
        `Design a scoped ${context.artifact} tied tightly to ${friendlyTopic}.`,
        'Collect critique from at least one user or peer.',
        'Translate lessons into a roadmap for the next cycle.'
      ],
      topics: [
        {
          title: `${friendlyTopic} pilot`,
          narrative: `Define the user, promise, and guardrails for your pilot. Make the impact measurable so ${tone.cadence} stays on track.`,
          keyPoints: ['Success metrics', 'Risk plan', 'Demo storyline'],
          practice: [
            `Draft a mini brief describing your ${friendlyTopic} pilot in one page.`,
            `Set up a scoreboard to track progress each ${durationMeta.unit}.`
          ],
          seeds: [`${friendlyTopic} pilot`, `${friendlyTopic} metrics`]
        },
        {
          title: `Reflection + runway`,
          narrative: `Synthesize everything you learned and choose the next leap. Decide whether to stretch scope, bring in collaborators, or change the pace.`,
          keyPoints: ['Wins worth repeating', 'Signals to watch', 'Partnership opportunities'],
          practice: [
            `Write a ${context.reflection} summarizing what changed in your ${friendlyTopic} practice.`,
            `Plan the first deliverable of your next ${durationMeta.label} sprint.`
          ],
          seeds: [`${friendlyTopic} roadmap`, `${friendlyTopic} reflection`]
        }
      ],
      assessment: {
        quizTitle: 'Forward view',
        quizQuestions: [
          `Which evidence proves your ${friendlyTopic} pilot worked?`,
          `Who will you loop in to keep ${friendlyTopic} momentum high?`,
          `How will you measure success over the next ${durationMeta.label}?`
        ],
        problemSetTitle: `${friendlyTopic} next sprint`,
        problemPrompts: [
          `Draft a backlog of three follow-on moves for ${friendlyTopic}.`,
          `Map the rituals that will keep the practice alive after this course.`
        ]
      }
    }
  ];

  const modules = moduleBlueprints.map((blueprint, index) => ({
    moduleNumber: index + 1,
    title: blueprint.title,
    description: blueprint.description,
    learningObjectives: blueprint.objectives,
    estimatedDuration: moduleDurations[index] || moduleDurations[moduleDurations.length - 1],
    topics: blueprint.topics.map((topic, topicIndex) =>
      makeTopic(topicIndex + 1, topic, topic.seeds)
    ),
    assessment: blueprint.assessment
  }));

  return {
    title: `${friendlyTopic} learning studio`,
    description: baseDescription,
    difficulty,
    duration: durationMeta.label,
    prerequisites: request.prerequisites || [],
    learningOutcomes: [
      `Explain where ${friendlyTopic} creates leverage.`,
      `Prototype a ${context.artifact} with confident decisions.`,
      difficultyCue
    ],
    modules,
    tags: [friendlyTopic.toLowerCase(), context.domain.toLowerCase(), 'creo']
  };
}

/**
 * Process and enrich course with videos
 */
async function enrichCourseWithVideos(
  courseData: any, 
  includeVideos: boolean,
  videosPerTopic: number
): Promise<Course> {
  console.log(`Enriching course - Include videos: ${includeVideos}, Videos per topic: ${videosPerTopic}`);
  const courseId = `course_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  // Build the course structure
  const course: Course = {
    id: courseId,
    title: courseData.title || 'Untitled Course',
    description: courseData.description || '',
    difficulty: courseData.difficulty || 'intermediate',
    duration: courseData.duration || 'Self-paced',
    prerequisites: Array.isArray(courseData.prerequisites) ? courseData.prerequisites : [],
    learningOutcomes: Array.isArray(courseData.learningOutcomes) ? courseData.learningOutcomes : [],
    modules: [],
    tags: Array.isArray(courseData.tags) ? courseData.tags : [],
    createdAt: now,
    updatedAt: now
  };

  // Process modules
  if (Array.isArray(courseData.modules)) {
    for (const moduleData of courseData.modules) {
      const moduleId = `module_${courseId}_${moduleData.moduleNumber || Math.random().toString(36).substring(7)}`;
      
      const module: CourseModule = {
        id: moduleId,
        moduleNumber: moduleData.moduleNumber || course.modules.length + 1,
        title: moduleData.title || `Module ${course.modules.length + 1}`,
        description: moduleData.description || '',
        learningObjectives: Array.isArray(moduleData.learningObjectives) 
          ? moduleData.learningObjectives 
          : [],
        estimatedDuration: moduleData.estimatedDuration || '1 week',
        topics: [],
        assessment: moduleData.assessment
          ? {
              quizTitle: moduleData.assessment.quizTitle || 'Quick check-in',
              quizQuestions: Array.isArray(moduleData.assessment.quizQuestions)
                ? moduleData.assessment.quizQuestions
                : [],
              problemSetTitle: moduleData.assessment.problemSetTitle || 'Practice set',
              problemPrompts: Array.isArray(moduleData.assessment.problemPrompts)
                ? moduleData.assessment.problemPrompts
                : []
            }
          : undefined
      };

      // Process topics
      if (Array.isArray(moduleData.topics)) {
        // Collect all search queries for batch video fetching
        const topicSearchQueries: Map<string, string> = new Map();
        
        for (const topicData of moduleData.topics) {
          const topicId = `topic_${moduleId}_${topicData.topicNumber || Math.random().toString(36).substring(7)}`;
          
          // Build search query from keywords or title
          let searchQuery = topicData.title || '';
          if (Array.isArray(topicData.searchKeywords) && topicData.searchKeywords.length > 0) {
            searchQuery = topicData.searchKeywords.join(' ');
          }
          
          topicSearchQueries.set(topicId, searchQuery);
        }

        // Fetch videos for all topics in this module
        let videoResults: Map<string, Video[]> = new Map();
        if (includeVideos && topicSearchQueries.size > 0) {
          try {
            const queries = Array.from(topicSearchQueries.entries()).map(([topicId, query]) => ({
              id: topicId,
              query
            }));
            console.log(`Fetching videos for ${queries.length} topics...`);
            videoResults = await fetchVideosForTopics(queries, videosPerTopic);
            console.log(`Fetched videos for ${videoResults.size} topics`);
          } catch (videoError) {
            console.error('Error fetching videos:', videoError);
            // Continue without videos rather than failing
          }
        }

        // Build topics with videos
        for (const topicData of moduleData.topics) {
          const topicId = `topic_${moduleId}_${topicData.topicNumber || Math.random().toString(36).substring(7)}`;
          const searchQuery = topicSearchQueries.get(topicId) || '';
          
          let topicVideos = includeVideos ? (videoResults.get(topicId) || []) : [];

          if (includeVideos && topicVideos.length === 0) {
            const fallbackQuery = [course.title, module.title, topicData.title]
              .filter(Boolean)
              .join(' ');
            try {
              topicVideos = await searchYouTubeVideos(fallbackQuery, Math.max(3, videosPerTopic));
            } catch (fallbackError) {
              console.error('Fallback video search failed:', fallbackError);
            }
          }

          const topic: CourseTopic = {
            id: topicId,
            topicNumber: topicData.topicNumber || module.topics.length + 1,
            title: topicData.title || `Topic ${module.topics.length + 1}`,
            content: topicData.content || '',
            keyPoints: Array.isArray(topicData.keyPoints) ? topicData.keyPoints : [],
            practiceQuestions: Array.isArray(topicData.practiceQuestions)
              ? topicData.practiceQuestions
              : undefined,
            videos: topicVideos,
            resources: Array.isArray(topicData.resources) ? topicData.resources : undefined
          };

          module.topics.push(topic);
        }
      }

      course.modules.push(module);
    }
  }

  return course;
}

async function extractGeminiText(response: Response): Promise<string> {
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || !Array.isArray(parts)) return '';
  return parts
    .map((part: any) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

function parseQuizQuestions(raw: string): string[] {
  if (!raw) return [];
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const jsonAttempt = safeJsonParse<string[]>(cleaned);
  if (jsonAttempt.success && Array.isArray(jsonAttempt.data)) {
    return jsonAttempt.data.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  }

  return cleaned
    .split(/\n+/)
    .map((line) => line.replace(/^[\d\-\*\.)\s]+/, '').trim())
    .filter(Boolean);
}

async function generateQuizQuestionsForModule(module: CourseModule, apiKey: string): Promise<string[]> {
  if (!module.topics?.length) {
    return module.assessment?.quizQuestions || [];
  }

  const topicSummaries = module.topics
    .map((topic) => {
      const summary = topic.content?.replace(/\s+/g, ' ').slice(0, 180) || '';
      return `• ${topic.title}: ${summary}`;
    })
    .join('\n');

  const prompt = `You are a calm tutor at Creo. Write 3-4 short quiz questions that check understanding of the module below.

Keep the tone friendly and encouraging. Avoid giving the answers. Return ONLY a JSON array of strings, for example:
["What is ...?", "How would you ...?"]

Module title: ${module.title}
Module description: ${module.description}
Topics covered:
${topicSummaries}

Each question should reference the ideas above and stay under 25 words.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: QUIZ_GENERATION_CONFIG
  };

  const { response } = await callGeminiWithRetry({
    apiKey,
    model: QUIZ_MODEL,
    body: payload,
    maxRetries: 2
  });

  if (!response) {
    return module.assessment?.quizQuestions || [];
  }

  const text = await extractGeminiText(response);
  const questions = parseQuizQuestions(text);
  if (questions.length === 0) {
    return module.assessment?.quizQuestions || [];
  }

  return questions.slice(0, 4);
}

async function enrichModulesWithQuizzes(modules: CourseModule[], apiKey: string) {
  for (const module of modules) {
    try {
      const quizQuestions = await generateQuizQuestionsForModule(module, apiKey);
      if (!quizQuestions.length) continue;

      if (!module.assessment) {
        module.assessment = {
          quizTitle: `Checkpoint · ${module.title}`,
          quizQuestions: [],
          problemSetTitle: 'Practice set',
          problemPrompts: []
        };
      }

      module.assessment.quizTitle = module.assessment.quizTitle || `Checkpoint · ${module.title}`;
      module.assessment.quizQuestions = quizQuestions;
    } catch (error) {
      console.error(`Failed to fetch quiz for module ${module.title}`, error);
    }
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.text();
    const parseResult = safeJsonParse<CourseGenerationRequest>(body);
    
    if (!parseResult.success) {
      return NextResponse.json<CourseGenerationResponse>(
        {
          success: false,
          error: `Invalid request format: ${parseResult.error}`
        },
        { status: 400 }
      );
    }

    const courseRequest = parseResult.data!;
    const requestId = (courseRequest as any).requestId || `gen_${startTime}`;
    
    console.log(`[${requestId}] Request: "${courseRequest.topic}" (${courseRequest.difficulty}, ${courseRequest.duration})`);
    
    // Validate required fields
    if (!courseRequest.topic) {
      return NextResponse.json<CourseGenerationResponse>(
        {
          success: false,
          error: 'Topic is required'
        },
        { status: 400 }
      );
    }

    // Get API key
    const geminiApiKey = await getGeminiApiKey();
    if (!geminiApiKey) {
      return NextResponse.json<CourseGenerationResponse>(
        {
          success: false,
          error: 'Gemini API key not configured'
        },
        { status: 500 }
      );
    }

    // Generate course structure prompt
    const prompt = generateCoursePrompt(courseRequest);
    
    // Try different models if one fails, including latest 2.x versions
    // Priority order: newest/best models first
    const models = [
      'gemini-2.0-flash-exp',        // Latest 2.0 Flash experimental
      'gemini-exp-1206',              // Latest experimental model (Dec 2024)
      'gemini-exp-1121',              // Previous experimental model
      'gemini-1.5-flash-002',         // Latest stable Flash
      'gemini-1.5-flash',             // Standard Flash
      'gemini-1.5-pro-002',           // Latest stable Pro
      'gemini-1.5-pro',               // Standard Pro
      'gemini-2.0-pro-exp'            // 2.0 Pro experimental (if available)
    ];
    
    const generationPayload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
        topP: 0.95,
        topK: 40
      }
    };
    
    let geminiResponse: Response | null = null;
    let lastError: string = '';
    
    // Helper function to wait between model attempts
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < models.length; i += 1) {
      const model = models[i];
      console.log(`Trying model: ${model}`);
      
      const { response, errorMessage, status, wasRateLimited } = await callGeminiWithRetry({
        apiKey: geminiApiKey,
        model,
        body: generationPayload,
        maxRetries: 3
      });
      
      if (response) {
        geminiResponse = response;
        console.log(`Success with model: ${model}`);
        break;
      }
      
      lastError = errorMessage || `Model ${model} failed with status ${status}`;
      console.error(lastError);
      
      let shouldTryNextModel = false;
      
      if (status === 404) {
        console.warn(`Model ${model} not available. Trying next option...`);
        shouldTryNextModel = true;
      } else if ((status === 429 || status === 503) && wasRateLimited) {
        console.warn(`Rate limit persisted for model ${model}. Trying next model...`);
        shouldTryNextModel = true;
      }
      
      if (shouldTryNextModel) {
        if (i < models.length - 1) {
          await wait(500);
        }
        continue;
      }
      
      // For other status codes, stop trying additional models
      break;
    }

    let courseData: any = null;

    if (!geminiResponse || !geminiResponse.ok) {
      console.warn(`[${requestId}] Gemini failed, using fallback (${lastError})`);
      courseData = buildFallbackCourseData(courseRequest);
    } else {
      const geminiData = await geminiResponse.json();
      
      // Extract response text
      let responseText = '';
      if (geminiData.candidates && geminiData.candidates[0]) {
        const candidate = geminiData.candidates[0];
        if (candidate.content && candidate.content.parts) {
          responseText = candidate.content.parts
            .map((part: any) => part.text || '')
            .join('');
        }
      }

      if (!responseText) {
        console.warn(`[${requestId}] Empty Gemini response, using fallback`);
        courseData = buildFallbackCourseData(courseRequest);
      } else {
        try {
          courseData = extractCourseJson(responseText);
          console.log(`[${requestId}] Gemini success: "${courseData.title}" (${courseData.modules?.length} modules)`);
        } catch (error) {
          console.error(`[${requestId}] JSON extraction failed, using fallback`);
          courseData = buildFallbackCourseData(courseRequest);
        }
      }
    }

    // Enrich course with videos
    const includeVideos = courseRequest.includeVideos !== false;
    let course: Course;
    try {
      course = await enrichCourseWithVideos(
        courseData,
        includeVideos,
        courseRequest.videosPerTopic || 3
      );
    } catch (videoError) {
      console.warn('Video enrichment failed, continuing without YouTube clips:', videoError);
      course = await enrichCourseWithVideos(
        courseData,
        false,
        courseRequest.videosPerTopic || 3
      );
    }
    await enrichModulesWithQuizzes(course.modules, geminiApiKey);

    // Calculate total videos fetched
    let totalVideos = 0;
    course.modules.forEach(module => {
      module.topics.forEach(topic => {
        totalVideos += topic.videos.length;
      });
    });

    let featuredVideos = null;
    if (includeVideos) {
      try {
        featuredVideos = await fetchFeaturedVideos(courseRequest.topic);
      } catch (featuredError) {
        console.error('Failed to fetch featured videos:', featuredError);
      }
    }

    const generationTime = Date.now() - startTime;

    return NextResponse.json<CourseGenerationResponse>(
      {
        success: true,
        course,
        generationTime,
        videosFetched: totalVideos,
        featuredVideos: featuredVideos || undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Course generation error:', error);
    return NextResponse.json<CourseGenerationResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Course Generation API',
    endpoints: {
      POST: {
        description: 'Generate a structured course with AI',
        body: {
          topic: 'Required: The main topic of the course',
          difficulty: 'Optional: beginner, intermediate, or advanced',
          duration: 'Optional: Course duration (e.g., "4 weeks")',
          targetAudience: 'Optional: Description of target learners',
          prerequisites: 'Optional: Array of prerequisites',
          focusAreas: 'Optional: Array of specific areas to focus on',
          includeVideos: 'Optional: Whether to fetch YouTube videos (default: true)',
          videosPerTopic: 'Optional: Number of videos per topic (default: 3)'
        }
      }
    },
    example: {
      topic: 'React Development',
      difficulty: 'intermediate',
      duration: '6 weeks',
      includeVideos: true,
      videosPerTopic: 3
    }
  });
}
