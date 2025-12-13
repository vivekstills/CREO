'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Course, CourseModule } from '@/app/types/course';
import { CheckCircle2, Star, Trophy, Zap } from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';

const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface GameifiedRoadmapProps {
  course: Course;
}

const GameifiedRoadmap = ({ course }: GameifiedRoadmapProps) => {
  const modules = course.modules || [];
  const pathRef = useRef<SVGPathElement>(null);
  
  // Calculate absolute pixel positions for each module node
  const getNodePosition = (index: number, total: number) => {
    const progress = index / Math.max(total - 1, 1);
    const containerHeight = 500; // Fixed height for positioning
    
    // Bottom to top positioning
    const y = containerHeight - 50 - (progress * (containerHeight - 100));
    
    // Winding S-curve horizontally
    const amplitude = 120;
    const frequency = 0.6;
    const x = 300 + Math.sin(index * frequency * Math.PI) * amplitude;
    
    return { x, y };
  };

  // Generate smooth quadratic Bezier path connecting all nodes
  const generatePath = () => {
    if (modules.length === 0) return '';
    
    const firstPos = getNodePosition(0, modules.length);
    let d = `M ${firstPos.x} ${firstPos.y}`;
    
    for (let i = 1; i < modules.length; i++) {
      const prev = getNodePosition(i - 1, modules.length);
      const curr = getNodePosition(i, modules.length);
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${midX} ${midY}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const pathData = generatePath();

  // Animate path drawing on mount
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = totalLength.toString();
    path.style.strokeDashoffset = totalLength.toString();

    const animate = () => {
      path.style.transition = 'stroke-dashoffset 2.5s ease-in-out';
      path.style.strokeDashoffset = '0';
    };
    requestAnimationFrame(animate);
  }, [pathData]);

  return (
    <div className={`${bodyFont.className} w-full py-8`}>
      {/* Header */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fff5ef] to-[#f2e7d9] rounded-full border border-[#a95757]/20 mb-2 shadow-sm">
            <Trophy className="w-4 h-4 text-[#a95757]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#a95757] font-semibold">
              Your Learning Journey
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#262626] mb-1">{course.title}</h3>
          <p className="text-sm text-[#666]">{course.description}</p>
        </div>
        
        {/* Progress stats */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full shadow-lg border border-[#f2e7d9]">
          <Star className="w-5 h-5 text-[#a95757] fill-[#a95757]" />
          <span className="text-lg font-bold text-[#262626]">{modules.length}</span>
          <span className="text-sm text-[#666]">modules</span>
        </div>
      </motion.div>

      {/* Gamified Journey Map */}
      <div className="relative w-full h-[500px] bg-gradient-to-br from-[#fffcf9] to-[#fff5ef] rounded-3xl shadow-xl border border-[#f2e7d9]">
        
        {/* Animated SVG Path */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="pathGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ff9a8b" />
              <stop offset="50%" stopColor="#ffd89b" />
              <stop offset="100%" stopColor="#a18cd1" />
            </linearGradient>
            <filter id="pathShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a95757" floodOpacity="0.4" />
            </filter>
          </defs>
          
          <path
            ref={pathRef}
            d={pathData}
            stroke="url(#pathGradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            filter="url(#pathShadow)"
          />
        </svg>

        {/* Floating Module Nodes */}
        {modules.map((module, index) => {
          const pos = getNodePosition(index, modules.length);
          const colors = ['#ff9a8b', '#ffd89b', '#a18cd1'];
          const bgColor = colors[index % colors.length];
          
          return (
            <motion.div
              key={module.id}
              className="absolute flex items-center justify-center w-20 h-20 rounded-full shadow-2xl cursor-pointer border-4 border-white group z-10"
              style={{
                top: `${pos.y}px`,
                left: `${pos.x}px`,
                backgroundColor: bgColor,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                y: [0, -6, 0],
              }}
              transition={{
                scale: {
                  delay: 0.8 + index * 0.3,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20
                },
                y: {
                  delay: 0.8 + index * 0.3,
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut'
                }
              }}
              whileHover={{
                scale: 1.2,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.4 },
              }}
            >
              {/* Icon */}
              <div className="relative z-10 drop-shadow-lg text-white">
                {index === 0 && <Star className="w-9 h-9" fill="currentColor" />}
                {index === modules.length - 1 && <Trophy className="w-9 h-9" />}
                {index > 0 && index < modules.length - 1 && <Zap className="w-9 h-9" />}
              </div>

              {/* Number badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-[#262626] shadow-lg border-2 border-[#a95757]">
                {index + 1}
              </div>

              {/* Checkmark */}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                <div className="bg-[#262626] text-white text-sm px-4 py-2 rounded-xl shadow-2xl">
                  <div className="font-semibold">{module.title}</div>
                  <div className="text-xs text-gray-300">{module.topics?.length || 0} topics</div>
                </div>
              </div>

              {/* Star rating */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i <= Math.min(module.topics?.length || 0, 3)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress stats cards */}
      <div className="hidden relative w-full overflow-x-auto">
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
