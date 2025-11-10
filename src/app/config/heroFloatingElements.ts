import { LucideIcon, Sparkles, GraduationCap, Video, Users, NotebookPen } from 'lucide-react';

export type FloatingElementType = 'ai-prompt' | 'learning-path' | 'video' | 'study-pod' | 'notes-badge';

export type FloatingElementConfig = {
  id: string;
  type: FloatingElementType;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  animation: {
    initialY: number;
    duration: number;
    delay: number;
  };
  light: {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  };
  dark: {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  };
};

export const HERO_FLOATING_ELEMENTS: FloatingElementConfig[] = [
  {
    id: 'ai-prompt-card',
    type: 'ai-prompt',
    icon: Sparkles,
    title: 'AI Course Builder',
    subtitle: 'From prompt to path',
    position: {
      top: '12%',
      left: '8%',
    },
    animation: {
      initialY: -30,
      duration: 8,
      delay: 0,
    },
    light: {
      bg: 'rgba(255, 250, 246, 0.9)',
      border: '#f2e1d8',
      text: '#3b1f1a',
      iconColor: '#c24f63',
    },
    dark: {
      bg: 'rgba(42, 24, 32, 0.9)',
      border: '#3a2f2a',
      text: '#f5e6dc',
      iconColor: '#ff8ab6',
    },
  },
  {
    id: 'learning-path-node',
    type: 'learning-path',
    icon: GraduationCap,
    title: 'Personalized Paths',
    subtitle: '5 modules · 4 weeks',
    position: {
      bottom: '25%',
      left: '12%',
    },
    animation: {
      initialY: 20,
      duration: 7,
      delay: 0.5,
    },
    light: {
      bg: 'rgba(255, 240, 232, 0.85)',
      border: '#f2d6c4',
      text: '#3b1f1a',
      iconColor: '#b37871',
    },
    dark: {
      bg: 'rgba(31, 20, 16, 0.85)',
      border: '#3a2f2a',
      text: '#f5e6dc',
      iconColor: '#c9a89a',
    },
  },
  {
    id: 'featured-video',
    type: 'video',
    icon: Video,
    title: 'Curated Videos',
    subtitle: '3 explainers per topic',
    position: {
      top: '18%',
      right: '10%',
    },
    animation: {
      initialY: -25,
      duration: 6.5,
      delay: 1,
    },
    light: {
      bg: 'rgba(255, 247, 241, 0.9)',
      border: '#f3e1d8',
      text: '#3b1f1a',
      iconColor: '#c24f63',
    },
    dark: {
      bg: 'rgba(42, 31, 26, 0.9)',
      border: '#3a2f2a',
      text: '#f5e6dc',
      iconColor: '#ff8ab6',
    },
  },
  {
    id: 'study-pod',
    type: 'study-pod',
    icon: Users,
    title: 'Study Pods',
    subtitle: '3-5 learners each',
    position: {
      top: '55%',
      right: '8%',
    },
    animation: {
      initialY: 15,
      duration: 7.5,
      delay: 1.5,
    },
    light: {
      bg: 'rgba(255, 238, 232, 0.85)',
      border: '#f4dfd6',
      text: '#3b1f1a',
      iconColor: '#b37871',
    },
    dark: {
      bg: 'rgba(26, 18, 14, 0.85)',
      border: '#3a2f2a',
      text: '#f5e6dc',
      iconColor: '#c9a89a',
    },
  },
  {
    id: 'notes-badge',
    type: 'notes-badge',
    icon: NotebookPen,
    title: 'Study Stream',
    subtitle: 'Notes & progress',
    position: {
      bottom: '18%',
      right: '15%',
    },
    animation: {
      initialY: 25,
      duration: 8,
      delay: 2,
    },
    light: {
      bg: 'rgba(255, 250, 246, 0.9)',
      border: '#f2e7d9',
      text: '#3b1f1a',
      iconColor: '#c24f63',
    },
    dark: {
      bg: 'rgba(42, 24, 32, 0.9)',
      border: '#3a2f2a',
      text: '#f5e6dc',
      iconColor: '#ff8ab6',
    },
  },
];
