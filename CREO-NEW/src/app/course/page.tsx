'use client';

import { useEffect, useState } from 'react';
import CourseBuilder from '@/app/components/CourseBuilder';

export default function CoursePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('creoDarkMode');
    setIsDarkMode(savedMode === 'true');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('creoDarkMode', String(newMode));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0f0a08]' : 'bg-[#fdf8f2]'
    }`}>
      <CourseBuilder isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
    </div>
  );
}
