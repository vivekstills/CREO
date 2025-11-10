'use client';

import { motion } from 'framer-motion';
import { Course, CourseModule } from '@/app/types/course';
import { CheckCircle2, Lock, Star, Trophy, Zap } from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';

const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface GameifiedRoadmapProps {
  course: Course;
}

const GameifiedRoadmap = ({ course }: GameifiedRoadmapProps) => {
  const modules = course.modules || [];
  
  // Create winding path coordinates for nodes
  const getNodePosition = (index: number, total: number) => {
    const baseY = 150 + index * 180;
    const amplitude = 200;
    const frequency = 0.5;
    const offsetX = Math.sin(index * frequency) * amplitude;
    const centerX = 300;
    return {
      x: centerX + offsetX,
      y: baseY
    };
  };

  // Generate SVG path through all nodes
  const generatePath = () => {
    if (modules.length === 0) return '';
    
    let path = '';
    modules.forEach((_, index) => {
      const pos = getNodePosition(index, modules.length);
      if (index === 0) {
        path += `M ${pos.x} ${pos.y}`;
      } else {
        const prevPos = getNodePosition(index - 1, modules.length);
        const midY = (prevPos.y + pos.y) / 2;
        path += ` Q ${prevPos.x} ${midY}, ${pos.x} ${pos.y}`;
      }
    });
    return path;
  };

  const pathData = generatePath();
  const totalLength = pathData ? 1000 * modules.length : 0;

  return (
    <div className={`${bodyFont.className} w-full py-8`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fff5ef] to-[#f2e7d9] rounded-full border border-[#a95757]/20 mb-3">
          <Trophy className="w-4 h-4 text-[#a95757]" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#a95757] font-semibold">
            Your Learning Journey
          </span>
        </div>
        <h3 className="text-2xl font-bold text-[#262626] mb-2">{course.title}</h3>
        <p className="text-sm text-[#666] max-w-2xl mx-auto">{course.description}</p>
      </motion.div>

      {/* Modules displayed as connected journey */}
      <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto px-4">
        {modules.map((module, index) => {
          const gradientColors = [
            'from-[#ff9a8b] to-[#a95757]',
            'from-[#ffd89b] to-[#c1b6a4]',
            'from-[#a18cd1] to-[#a95757]'
          ];
          const gradient = gradientColors[index % gradientColors.length];
          
          return (
            <div key={index} className="w-full">
              {index > 0 && (
                <div className="h-12 w-1 bg-gradient-to-b from-[#c1b6a4]/40 to-[#a95757]/40 mx-auto" />
              )}
              
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.3 + index * 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
                className="relative"
              >
                <div className="flex items-center gap-4">
                  {/* Module node */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    whileFocus={{ scale: 1.1 }}
                    className={`relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#a95757] focus:ring-offset-2 rounded-full flex-shrink-0`}
                    aria-label={`Module ${index + 1}: ${module.title} - ${module.topics?.length || 0} topics`}
                    tabIndex={0}
                  >
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#a95757]/20 to-[#c1b6a4]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition duration-300" />
                    
                    <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white bg-gradient-to-br ${gradient}`}>
                      <div className="relative z-10 text-white">
                        {index === 0 && <Star className="w-8 h-8" fill="currentColor" aria-hidden="true" />}
                        {index === modules.length - 1 && <Trophy className="w-8 h-8" aria-hidden="true" />}
                        {index > 0 && index < modules.length - 1 && <Zap className="w-8 h-8" aria-hidden="true" />}
                      </div>
                      
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-[#a95757] shadow-md border-2 border-[#a95757]" aria-hidden="true">
                        {index + 1}
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Module info */}
                  <div className="flex-1 bg-white rounded-xl shadow-lg border border-[#f2e7d9] p-4">
                    <h4 className="font-semibold text-base text-[#262626] mb-1">{module.title}</h4>
                    <p className="text-xs text-[#666] mb-2 line-clamp-2">{module.description}</p>
                    <div className="flex items-center gap-2 text-xs text-[#a95757]">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      <span>{module.topics?.length || 0} topics</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="relative w-full overflow-x-auto hidden">
        <svg 
          width="600" 
          height={200 + modules.length * 180}
          className="mx-auto"
          style={{ minHeight: '400px' }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a95757" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#c1b6a4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#a95757" stopOpacity="0.3" />
            </linearGradient>
            
            <linearGradient id="nodeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9a8b" />
              <stop offset="100%" stopColor="#a95757" />
            </linearGradient>
            
            <linearGradient id="nodeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd89b" />
              <stop offset="100%" stopColor="#c1b6a4" />
            </linearGradient>
            
            <linearGradient id="nodeGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a18cd1" />
              <stop offset="100%" stopColor="#a95757" />
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Module nodes positioned absolutely */}
        <div className="relative" style={{ marginTop: `-${200 + modules.length * 180}px`, height: `${200 + modules.length * 180}px` }}>
          {modules.map((module, index) => {
            const pos = getNodePosition(index, modules.length);
            const gradientColors = [
              'linear-gradient(135deg, #ff9a8b 0%, #a95757 100%)',
              'linear-gradient(135deg, #ffd89b 0%, #c1b6a4 100%)',
              'linear-gradient(135deg, #a18cd1 0%, #a95757 100%)'
            ];
            const gradient = gradientColors[index % gradientColors.length];
            
            return (
              <motion.div
                key={index}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.5 + index * 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  whileFocus={{ scale: 1.1 }}
                  className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#a95757] focus:ring-offset-2 rounded-full"
                  aria-label={`Module ${index + 1}: ${module.title} - ${module.topics?.length || 0} topics`}
                  tabIndex={0}
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#a95757]/20 to-[#c1b6a4]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition duration-300" />
                  
                  {/* Node circle */}
                  <div 
                    className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                    style={{
                      background: gradient
                    }}
                  >
                    <div className="relative z-10 text-white">
                      {index === 0 && <Star className="w-6 h-6" fill="currentColor" aria-hidden="true" />}
                      {index === modules.length - 1 && <Trophy className="w-6 h-6" aria-hidden="true" />}
                      {index > 0 && index < modules.length - 1 && <Zap className="w-6 h-6" aria-hidden="true" />}
                    </div>
                    
                    {/* Module number badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-[#a95757] shadow-md border-2 border-[#a95757]" aria-hidden="true">
                      {index + 1}
                    </div>
                  </div>

                  {/* Module info card */}
                  <div
                    className="absolute left-20 top-0 w-64 bg-white rounded-xl shadow-xl border border-[#f2e7d9] p-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-20"
                    role="tooltip"
                  >
                    <h4 className="font-semibold text-sm text-[#262626] mb-1">{module.title}</h4>
                    <p className="text-xs text-[#666] mb-3 line-clamp-2">{module.description}</p>
                    <div className="flex items-center gap-2 text-xs text-[#a95757]">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      <span>{module.topics?.length || 0} topics</span>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-12 flex justify-center gap-6"
      >
        <div className="px-6 py-3 bg-gradient-to-br from-[#fff5ef] to-white rounded-xl border border-[#f2e7d9] shadow-sm">
          <div className="text-2xl font-bold text-[#a95757]">{modules.length}</div>
          <div className="text-xs text-[#c1b6a4] uppercase tracking-wider">Modules</div>
        </div>
        <div className="px-6 py-3 bg-gradient-to-br from-[#fff5ef] to-white rounded-xl border border-[#f2e7d9] shadow-sm">
          <div className="text-2xl font-bold text-[#a95757]">
            {modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0)}
          </div>
          <div className="text-xs text-[#c1b6a4] uppercase tracking-wider">Topics</div>
        </div>
        <div className="px-6 py-3 bg-gradient-to-br from-[#fff5ef] to-white rounded-xl border border-[#f2e7d9] shadow-sm">
          <div className="text-2xl font-bold text-[#a95757]">{course.difficulty}</div>
          <div className="text-xs text-[#c1b6a4] uppercase tracking-wider">Level</div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameifiedRoadmap;
