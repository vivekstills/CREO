'use client';

import { useMemo, useState, useEffect } from 'react';
import { CourseModule } from '@/app/types/course';

interface CourseNotesSidebarProps {
  modules: CourseModule[];
  selectedModuleId?: string;
  isDarkMode?: boolean;
}

interface CourseNote {
  id: string;
  moduleId: string;
  topicId: string;
  text: string;
  createdAt: string;
}

export default function CourseNotesSidebar({ modules, selectedModuleId: propModuleId, isDarkMode = false }: CourseNotesSidebarProps) {
  const [selectedModuleId, setSelectedModuleId] = useState(propModuleId || modules[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState(modules.find(m => m.id === (propModuleId || modules[0]?.id))?.topics[0]?.id || '');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<CourseNote[]>([]);

  const moduleOptions = useMemo(() => modules.map((mod) => ({ value: mod.id, label: mod.title })), [modules]);
  const topicOptions = useMemo(() => {
    return modules
      .find((mod) => mod.id === selectedModuleId)?.topics
      .map((topic) => ({ value: topic.id, label: topic.title })) || [];
  }, [modules, selectedModuleId]);

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    const firstTopic = modules.find((mod) => mod.id === moduleId)?.topics[0];
    setSelectedTopicId(firstTopic?.id || '');
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedModuleId || !selectedTopicId) return;
    const newNote: CourseNote = {
      id: `${selectedTopicId}-${Date.now()}`,
      moduleId: selectedModuleId,
      topicId: selectedTopicId,
      text: noteText.trim(),
      createdAt: new Date().toISOString()
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteText('');
  };

  const notesByModule = useMemo(() => {
    const map = new Map<string, CourseNote[]>();
    notes.forEach((note) => {
      const current = map.get(note.moduleId) || [];
      current.push(note);
      map.set(note.moduleId, current);
    });
    return map;
  }, [notes]);

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Update selected module when prop changes
  useEffect(() => {
    if (propModuleId && propModuleId !== selectedModuleId) {
      setSelectedModuleId(propModuleId);
      const firstTopic = modules.find((mod) => mod.id === propModuleId)?.topics[0];
      setSelectedTopicId(firstTopic?.id || '');
    }
  }, [propModuleId, modules, selectedModuleId]);

  return (
    <aside className={`rounded-3xl border shadow-lg p-5 space-y-5 sticky top-6 max-h-[80vh] overflow-y-auto transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#1a120e] border-[#3a2f2a]' 
        : 'bg-white border-[#f2e7d9]'
    }`}>
      <div>
        <p className={`text-xs tracking-[0.4em] uppercase transition-colors duration-300 ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#c1b6a4]'}`}>Notes</p>
        <h3 className={`text-xl font-semibold transition-colors duration-300 ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#111]'}`}>Study stream</h3>
        <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#4a4a4a]'}`}>Capture insights per topic while you explore the modules.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${isDarkMode ? 'text-[#b8998a]' : 'text-[#6f6f6f]'}`}>Module</label>
          <select
            value={selectedModuleId}
            onChange={(e) => handleModuleChange(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${
              isDarkMode 
                ? 'border-[#3a2f2a] bg-[#1f1410] text-[#f5e6dc]' 
                : 'border-[#eaded0] bg-white text-[#111]'
            }`}
          >
            {moduleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${isDarkMode ? 'text-[#b8998a]' : 'text-[#6f6f6f]'}`}>Topic</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${
              isDarkMode 
                ? 'border-[#3a2f2a] bg-[#1f1410] text-[#f5e6dc]' 
                : 'border-[#eaded0] bg-white text-[#111]'
            }`}
          >
            {topicOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Capture what clicked or a link to revisit..."
            className={`w-full h-28 rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30 transition-colors duration-300 ${
              isDarkMode 
                ? 'border-[#3a2f2a] bg-[#1f1410] text-[#f5e6dc] placeholder:text-[#b8998a]' 
                : 'border-[#eaded0] bg-white text-[#111] placeholder:text-[#6f6f6f]'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!noteText.trim() || !selectedModuleId || !selectedTopicId}
          className={`w-full rounded-full text-sm font-semibold tracking-wide py-2 disabled:opacity-40 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-[#f5e6dc] text-[#1f120f] hover:bg-[#e6d7cd]' 
              : 'bg-[#111] text-white hover:bg-[#2f221f]'
          }`}
        >
          Drop note into stream
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const moduleNotes = notesByModule.get(module.id) || [];
          if (moduleNotes.length === 0) return null;
          return (
            <div key={module.id} className="space-y-2">
              <p className={`text-xs tracking-[0.4em] uppercase transition-colors duration-300 ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#c1b6a4]'}`}>{module.title}</p>
              <div className="space-y-2">
                {moduleNotes.map((note) => {
                  const topic = module.topics.find((t) => t.id === note.topicId);
                  return (
                    <div key={note.id} className={`rounded-2xl border p-3 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-[#3a2f2a] bg-[#1f1410]' 
                        : 'border-[#f2e7d9] bg-white'
                    }`}>
                      <p className={`text-xs flex justify-between transition-colors duration-300 ${isDarkMode ? 'text-[#b8998a]' : 'text-[#6f6f6f]'}`}>
                        <span>{topic?.title || 'Topic'}</span>
                        <span>{formatTimestamp(note.createdAt)}</span>
                      </p>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#111]'}`}>
                        {note.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {notes.length === 0 && (
          <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-[#b8998a]' : 'text-[#6f6f6f]'}`}>No notes yet. Start typing to build your personal stream.</p>
        )}
      </div>
    </aside>
  );
}
