'use client';

import { useMemo, useState } from 'react';

interface JourneyResource {
  name: string;
}

interface JourneyModule {
  id: number;
  title: string;
  time?: string;
  status: 'completed' | 'pending' | string;
  resources: JourneyResource[];
}

interface Journey {
  title: string;
  modules: JourneyModule[];
}

interface CourseProgressProps {
  journey?: Journey | null;
}

export default function CourseProgress({ journey }: CourseProgressProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const filteredModules = useMemo(() => {
    if (!journey) return [];
    const q = query.trim().toLowerCase();
    if (!q) return journey.modules;
    return journey.modules.filter(
      (module) =>
        module.title.toLowerCase().includes(q) ||
        module.resources.some((resource) => resource.name.toLowerCase().includes(q))
    );
  }, [journey, query]);

  const completedModules = useMemo(() => {
    if (!journey) return 0;
    return journey.modules.filter((module) => module.status === 'completed').length;
  }, [journey]);
  const totalModules = journey?.modules.length ?? 0;
  const rawProgress = totalModules
    ? Math.round((completedModules / totalModules) * 100)
    : 0;
  const progressPct = Math.min(100, Math.max(0, rawProgress));

  const handleToggle = (id: number) => {
    setExpandedModule((prev) => (prev === id ? null : id));
  };

  if (!journey || !journey.modules.length) {
    return (
      <div className="flex min-h-[14rem] flex-col justify-center rounded-3xl border border-rose-100 bg-[#fff4f4] p-6 text-sm text-rose-500 shadow-xl">
        <p className="font-semibold text-rose-600">No learning path saved yet.</p>
        <p className="mt-1 text-rose-400">Generate a course to see your progress here.</p>
      </div>
    );
  }

  return (
    <div className="flex max-h-[70vh] min-h-[24rem] flex-col rounded-[28px] border border-rose-100 bg-[#fff4f4] p-5 shadow-[0_25px_60px_rgba(201,140,140,0.25)]">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-rose-300">Learning path</p>
          <h2 className="text-lg font-semibold text-rose-600">{journey.title}</h2>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search modules or resources"
            className="w-full rounded-full border border-rose-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <span className="text-sm font-semibold text-rose-500 sm:px-3">{progressPct}% complete</span>
        </div>
      </div>

      <div className="mb-4 h-2 shrink-0 rounded-full bg-rose-100">
        <div
          className="h-2 rounded-full bg-rose-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {filteredModules.map((module) => (
          <div key={module.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-rose-300">Module {module.id}</p>
                <h3 className="text-base font-medium text-rose-600">{module.title}</h3>
              </div>
              <span className="text-xs text-rose-400">{module.time}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {module.status === 'completed' ? '✅ Completed' : '🔘 Pending'}
            </p>
            <button
              type="button"
              onClick={() => handleToggle(module.id)}
              className="text-sm mt-2 text-rose-500 hover:underline"
            >
              {expandedModule === module.id ? 'Hide resources' : 'View resources →'}
            </button>
            {expandedModule === module.id && (
              <div className="mt-3 flex flex-wrap gap-2">
                {module.resources.map((resource, index) => (
                  <span
                    key={`${module.id}-${resource.name}-${index}`}
                    className="break-words rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-sm text-rose-600"
                  >
                    {resource.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredModules.length === 0 && (
          <p className="text-center text-sm text-rose-400">No modules match your search yet.</p>
        )}
      </div>
    </div>
  );
}
