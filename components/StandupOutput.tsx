import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { useToast } from '../context/ToastContext';
import { Skeleton } from './ui/Skeleton';

interface StandupOutputProps {
  value: string;
  consistencyNotes?: string[];
  onChange: (val: string) => void;
  onSave: () => void;
  onRefine: (instruction: string) => void;
  isPlaceholder: boolean;
  isGenerating?: boolean;
  isRefining?: boolean;
  isEditing?: boolean;
}

export const StandupOutput: React.FC<StandupOutputProps> = ({
  value,
  consistencyNotes = [],
  onChange,
  onSave,
  onRefine,
  isPlaceholder,
  isGenerating = false,
  isRefining = false,
  isEditing = false
}) => {
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState('');
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Standup copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;
    onRefine(instruction);
    setInstruction('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-[32px] lg:rounded-[32px] rounded-b-none shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all duration-500 relative">
      <div className="flex-1 relative flex flex-col min-h-0 bg-slate-50/20 dark:bg-slate-900/20">
        
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl z-50">
             <div className="w-full max-w-sm flex flex-col items-center animate-pulse">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[28px] mb-8 flex items-center justify-center text-white shadow-2xl">
                  <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-[0.2em] mb-3">Synthesizing...</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Polishing your update</p>
             </div>
          </div>
        ) : isPlaceholder ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-[40px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl flex items-center justify-center mb-8 rotate-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 opacity-50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </div>
                <h3 className="font-black text-slate-700 dark:text-slate-300 text-lg uppercase tracking-[0.2em]">Awaiting Synthesis</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-4 max-w-[280px] leading-relaxed font-medium">
                    Your professional standup will appear here once you provide draft notes.
                </p>
            </div>
        ) : (
            <div className="flex flex-col h-full min-h-0 overflow-hidden relative">
                
                {/* Immersive Floating Action Bar (Top) */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-40 pointer-events-none">
                  <div className="px-5 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-[20px] shadow-2xl flex items-center gap-3 pointer-events-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-200">Standup Preview</span>
                  </div>
                  
                  <div className="flex gap-3 pointer-events-auto">
                    <button 
                      onClick={handleCopy}
                      className={`w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[20px] shadow-2xl border border-white/20 dark:border-slate-700/50 transition-all active:scale-90 ${copied ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-300 hover:text-indigo-600'}`}
                      title="Copy to clipboard"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button 
                      onClick={onSave}
                      className="px-8 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all"
                    >
                      {isEditing ? 'Update Entry' : 'Commit Entry'}
                    </button>
                  </div>
                </div>

                {/* Content Area - Full height scrolling */}
                <div className="flex-1 overflow-y-auto px-8 sm:px-12 py-32 lg:py-36 space-y-10 scroll-smooth no-scrollbar selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
                  {consistencyNotes.length > 0 && (
                     <div className="p-6 rounded-[28px] bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Consistency Check</p>
                             <ul className="text-sm font-bold text-amber-900/80 dark:text-amber-200/80 space-y-1.5 leading-relaxed">
                                {consistencyNotes.map((note, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="opacity-40">•</span> {note}
                                  </li>
                                ))}
                             </ul>
                          </div>
                        </div>
                     </div>
                  )}

                  <textarea
                    className="w-full h-full min-h-[600px] lg:min-h-full resize-none focus:outline-none text-slate-800 dark:text-slate-100 leading-[1.8] font-mono text-base bg-transparent transition-opacity duration-300"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    spellCheck={false}
                    placeholder="Resulting standup..."
                  />
                </div>

                {/* Floating Refinement Bar (Bottom) */}
                <div className="absolute bottom-8 left-6 right-6 z-40">
                    <form onSubmit={handleRefineSubmit} className="max-w-2xl mx-auto relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                        </div>
                        <input
                          ref={inputRef}
                          type="text"
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                          placeholder="Suggest a tweak... (e.g. 'more casual', 'add technical detail')"
                          className="w-full pl-14 pr-36 py-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-100 dark:border-slate-700/50 rounded-[32px] text-base font-bold focus:ring-[12px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)]"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <button 
                            type="submit"
                            disabled={!instruction.trim() || isRefining}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-50 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2"
                          >
                            {isRefining ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ...
                              </>
                            ) : 'Update'}
                          </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};