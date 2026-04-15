/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Heart, Search, Calendar, User, Settings, AlertCircle, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SCHEDULE, STAGES, GROUPS } from './data';
import { Slot, AppState } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('kagayaki_fest_state');
    if (saved) return JSON.parse(saved);
    return {
      favorites: [],
      notes: {},
      oshi: null,
    };
  });

  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'idols'>('all');
  const [activeDay, setActiveDay] = useState<'18' | '19'>('18');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('kagayaki_fest_state', JSON.stringify(state));
  }, [state]);

  const toggleFavorite = (slotId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(slotId)
        ? prev.favorites.filter(id => id !== slotId)
        : [...prev.favorites, slotId],
    }));
  };

  const updateNote = (slotId: string, note: string) => {
    setState(prev => ({
      ...prev,
      notes: { ...prev.notes, [slotId]: note },
    }));
  };

  const setOshi = (group: string | null) => {
    setState(prev => {
      const oshiSlots = group ? SCHEDULE.filter(s => s.group === group).map(s => s.id) : [];
      const newFavorites = Array.from(new Set([...prev.favorites, ...oshiSlots]));
      return { ...prev, oshi: group, favorites: newFavorites };
    });
  };

  const toggleStage = (stage: string) => {
    setExpandedStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const favoriteSlots = useMemo(() => {
    return SCHEDULE.filter(s => state.favorites.includes(s.id));
  }, [state.favorites]);

  const getConflict = (slot: Slot) => {
    const mySlotsOnSameDay = favoriteSlots.filter(s => s.day === slot.day && s.id !== slot.id);
    const conflict = mySlotsOnSameDay.find(s => {
      const start1 = slot.start;
      const end1 = slot.end;
      const start2 = s.start;
      const end2 = s.end;
      return (start1 < end2) && (start2 < end1);
    });
    return conflict ? conflict.group : null;
  };

  const filteredGroups = useMemo(() => {
    return GROUPS.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-24 bg-white">
      <main className="max-w-md mx-auto p-6 space-y-10">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              <span className="text-[#f472b6]">KAGAYAKI</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Festival Schedule 2026</p>
          </div>
          
          <div className="flex items-center justify-between py-4 border-y border-slate-100">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Current Oshi</p>
              <p className="text-sm font-bold text-slate-900">{state.oshi || 'None'}</p>
            </div>
            <button 
              onClick={() => setActiveTab('idols')}
              className="px-5 py-2 bg-slate-900 text-white rounded-full font-bold text-[11px] active:scale-95 transition-transform"
            >
              Select Oshi
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <NavButton
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              label="Schedule"
            />
            <NavButton
              active={activeTab === 'my'}
              onClick={() => setActiveTab('my')}
              label="My List"
            />
            <NavButton
              active={activeTab === 'idols'}
              onClick={() => setActiveTab('idols')}
              label="Artists"
            />
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-6 px-1">
          {(['18', '19'] as const).map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`pb-2 font-black text-xs transition-all border-b-2 tracking-widest ${
                activeDay === day
                  ? 'border-[#f472b6] text-slate-900'
                  : 'border-transparent text-slate-300'
              }`}
            >
              DAY {day === '18' ? '01' : '02'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {STAGES.map((stage) => (
                <StageAccordion
                  key={stage}
                  stage={stage}
                  isOpen={expandedStages.includes(stage)}
                  onToggle={() => toggleStage(stage)}
                  slots={SCHEDULE.filter(s => s.stage === stage && s.day === activeDay)}
                  state={state}
                  toggleFavorite={toggleFavorite}
                  updateNote={updateNote}
                  getConflict={getConflict}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'my' && (
            <motion.div
              key="my"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="divide-y divide-slate-50">
                {favoriteSlots.filter(s => s.day === activeDay).length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Empty List</p>
                  </div>
                ) : (
                  favoriteSlots
                    .filter(s => s.day === activeDay)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map(slot => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(slot.id)}
                        note={state.notes[slot.id] || ''}
                        onUpdateNote={(note) => updateNote(slot.id, note)}
                        conflictWith={getConflict(slot)}
                        isOshi={state.oshi === slot.group}
                      />
                    ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'idols' && (
            <motion.div
              key="idols"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Artists</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-200 text-sm font-bold"
                />
              </div>

              <div className="divide-y divide-slate-50">
                {filteredGroups.map(group => {
                  const isOshi = state.oshi === group;

                  return (
                    <div
                      key={group}
                      className="flex items-center justify-between py-4"
                    >
                      <span className={`font-bold text-sm ${isOshi ? 'text-[#f472b6]' : 'text-slate-600'}`}>
                        {group}
                      </span>
                      
                      <button
                        onClick={() => setOshi(isOshi ? null : group)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                          isOshi 
                            ? 'bg-[#f472b6] text-white' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {isOshi ? 'OSHI' : 'SET OSHI'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StageAccordion({ 
  stage, 
  isOpen, 
  onToggle, 
  slots, 
  state, 
  toggleFavorite, 
  updateNote, 
  getConflict
}: { 
  stage: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  slots: Slot[]; 
  state: AppState; 
  toggleFavorite: (id: string) => void; 
  updateNote: (id: string, note: string) => void; 
  getConflict: (slot: Slot) => string | null;
  key?: string;
}) {
  return (
    <div className="border-b border-slate-100 transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-slate-900 text-xs uppercase tracking-widest">{stage}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-200 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-white overflow-hidden border-t border-slate-50"
          >
            <div className="px-5 pb-2 divide-y divide-slate-50">
              {slots.map(slot => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isFavorite={state.favorites.includes(slot.id)}
                  onToggleFavorite={() => toggleFavorite(slot.id)}
                  note={state.notes[slot.id] || ''}
                  onUpdateNote={(note) => updateNote(slot.id, note)}
                  isOshi={state.oshi === slot.group}
                  conflictWith={getConflict(slot)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 ${
        active 
          ? 'border-slate-900 text-slate-900' 
          : 'border-transparent text-slate-300 hover:text-slate-400'
      }`}
    >
      {label}
    </button>
  );
}

interface SlotCardProps {
  slot: Slot;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  note: string;
  onUpdateNote: (note: string) => void;
  conflictWith?: string | null;
  isOshi?: boolean;
  key?: string;
}

function SlotCard({
  slot,
  isFavorite,
  onToggleFavorite,
  note,
  onUpdateNote,
  conflictWith,
  isOshi,
}: SlotCardProps) {
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  return (
    <div className={`py-5 group ${conflictWith ? 'bg-red-50/30 -mx-5 px-5' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-[10px] font-black text-slate-300 mb-1 tracking-widest uppercase">
            {slot.start} — {slot.end}
          </div>
          <h3 className={`font-bold text-sm leading-tight mb-1 ${conflictWith ? 'text-red-600' : 'text-slate-900'}`}>
            {slot.group}
          </h3>
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{slot.stage}</span>
              {isOshi && <span className="text-[#f472b6] tracking-widest">OSHI</span>}
            </div>
            {slot.benefitStart && (
              <div className="text-[9px] font-bold text-slate-400">
                特典会: {slot.benefitStart}-{slot.benefitEnd} @ {slot.benefitLocation}
              </div>
            )}
          </div>

          {conflictWith && (
            <div className="mt-2 text-[10px] font-black text-red-600 bg-red-100/50 px-2 py-1 rounded inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {conflictWith} と重複しています
            </div>
          )}

          {note && !isNoteOpen && (
            <p className="mt-2 text-[11px] text-slate-400 italic line-clamp-1 font-medium">
              {note}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={`p-2 rounded-lg transition-all ${
              note ? 'text-slate-900 bg-slate-100' : 'text-slate-200 hover:text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-lg transition-all ${
              isFavorite ? 'text-[#f472b6]' : 'text-slate-200 hover:text-slate-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isNoteOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <textarea
              value={note}
              onChange={(e) => onUpdateNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full mt-3 p-3 bg-slate-50 rounded-lg text-xs outline-none min-h-[80px] font-medium text-slate-600"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
