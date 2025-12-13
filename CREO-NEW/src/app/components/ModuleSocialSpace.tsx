'use client';

import { useMemo } from 'react';
import { MessageCircle, Users } from 'lucide-react';

interface ModuleSocialSpaceProps {
  moduleId: string;
  moduleTitle: string;
  order: number;
  joinUrl?: string;
  isDarkMode?: boolean;
}

const podNames = ['Dawn Squad', 'Night Owls', 'Focus Trio', 'Studio Pod', 'Momentum Crew'];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'module';

export default function ModuleSocialSpace({ moduleId, moduleTitle, order, joinUrl, isDarkMode = false }: ModuleSocialSpaceProps) {
  const cohortSize = useMemo(() => Math.max(12, moduleTitle.length * 5 + 60), [moduleTitle]);
  const podOptions = useMemo(() => {
    return [0, 1, 2].map((index) => {
      const members = 3 + ((moduleId.length + index) % 3);
      return {
        id: `${moduleId}-pod-${index}`,
        name: podNames[(moduleTitle.length + index) % podNames.length],
        members,
        status: index === 0 ? 'Working on this lesson' : index === 1 ? 'Helping in chat' : 'Live check-in'
      };
    });
  }, [moduleId, moduleTitle]);

  const targetLink = joinUrl ?? `https://discord.gg/${slugify(moduleTitle)}`;

  return (
    <div className={`rounded-3xl border p-5 space-y-5 transition-colors duration-300 ${
      isDarkMode 
        ? 'border-[#3a2f2a] bg-[#2a1820]' 
        : 'border-[#f2e7d9] bg-[#fff9f5]'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.35em] transition-colors duration-300 ${
            isDarkMode ? 'text-[#ff8ab6]' : 'text-[#c07a6f]'
          }`}>Module {order}</p>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-[#c9a89a]' : 'text-[#70514a]'
          }`}>{cohortSize} learners on this step right now.</p>
        </div>
        <a
          href={targetLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#c85d5d] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_12px_30px_rgba(200,93,93,0.4)] transition hover:-translate-y-0.5"
        >
          Join study group
        </a>
      </div>

      <div className={`rounded-2xl border p-4 space-y-3 transition-colors duration-300 ${
        isDarkMode 
          ? 'border-[#3a2f2a] bg-[#1f1410]' 
          : 'border-[#f5e3de] bg-white'
      }`}>
        <div className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
          isDarkMode ? 'text-[#f5e6dc]' : 'text-[#3b1f1a]'
        }`}>
          <Users className="h-4 w-4 text-[#c85d5d]" />
          Calm pods · 3-5 people each
        </div>
        <div className="space-y-3">
          {podOptions.map((pod) => (
            <div
              key={pod.id}
              className={`rounded-2xl border px-3 py-3 flex flex-wrap items-center justify-between gap-3 transition-colors duration-300 ${
                isDarkMode ? 'border-[#3a2f2a]' : 'border-[#f6e7e3]'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#3b1f1a]'
                }`}>{pod.name}</p>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-[#b8998a]' : 'text-[#8c6860]'
                }`}>{pod.status}</p>
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-[#c9a89a]' : 'text-[#a17970]'
              }`}>
                <MessageCircle className="h-4 w-4 text-[#c85d5d]" />
                {pod.members} learners
              </div>
              <a
                href={`${targetLink}?pod=${encodeURIComponent(pod.id)}`}
                target="_blank"
                rel="noreferrer"
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isDarkMode 
                    ? 'bg-[#2a1820] text-[#ff8ab6] hover:-translate-y-0.5' 
                    : 'bg-[#fff4f2] text-[#c85d5d] hover:-translate-y-0.5'
                }`}
              >
                Join pod
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
