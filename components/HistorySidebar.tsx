import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StandupEntry } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { HistoryItemSkeleton } from './ui/Skeleton';
import { Button } from './ui/Button';

interface HistorySidebarProps {
  history: StandupEntry[];
  onSelect: (entry: StandupEntry) => void;
  onDelete: (id: string) => void;
  onSaveManualEntry: (entry: StandupEntry) => void;
  onSync: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLoading?: boolean;
  isSyncing?: boolean;
}

type SidebarView = 'list' | 'add' | 'detail' | 'settings';

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, 
  onSelect, 
  onDelete,
  onSaveManualEntry,
  onSync,
  isOpen, 
  setIsOpen,
  isLoading = false,
  isSyncing = false
}) => {
  const [view, setView] = useState<SidebarView>('list');
  const [selectedEntry, setSelectedEntry] = useState<StandupEntry | null>(null);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualRaw, setManualRaw] = useState('');
  const [manualOutput, setManualOutput] = useState('');
  
  // Settings State
  const [settingsUrl, setSettingsUrl] = useState('');
  const [settingsKey, setSettingsKey] = useState('');
  
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (view === 'settings') {
      const stored = localStorage.getItem('supabase_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettingsUrl(parsed.url || '');
          setSettingsKey(parsed.key || '');
        } catch (e) {
          // ignore
        }
      }
    }
  }, [view]);

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRaw || !manualOutput || !manualDate) return;
    
    const dateObj = new Date(manualDate + 'T12:00:00');

    onSaveManualEntry({
      id: uuidv4(),
      date: dateObj.toISOString(),
      rawInput: manualRaw,
      generatedOutput: manualOutput,
      consistencyNotes: []
    } as StandupEntry);
    
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualRaw('');
    setManualOutput('');
    setView('list');
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('supabase_settings', JSON.stringify({
      url: settingsUrl.trim(),
      key: settingsKey.trim()
    }));
    window.location.reload(); // Reload to re-init supabase client
  };
  
  const handleSettingsDisconnect = () => {
    if(confirm("Are you sure you want to disconnect? This will switch to local storage.")) {
      localStorage.removeItem('supabase_settings');
      window.location.reload();
    }
  };

  const handleEntryClick = (entry: StandupEntry) => {
    setSelectedEntry(entry);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedEntry(null);
  };

  const handleRestoreAction = (entry: StandupEntry) => {
    onSelect(entry);
    handleBack();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`
        fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-3">
              {(view === 'add' || view === 'detail' || view === 'settings') && (
                <button 
                  onClick={handleBack}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
              )}
              <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
                    {view === 'list' ? (isConfigured ? 'History (Synced)' : 'History (Local)') : 
                     view === 'add' ? 'Manual Entry' : 
                     view === 'settings' ? 'Database Config' : 'Review Entry'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-0.5">
                    {view === 'list' ? `${history.length} saved entries` : 
                     view === 'add' ? 'Backfill a past standup' : 
                     view === 'settings' ? 'Connect Supabase' : 'Full details'}
                  </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {view === 'list' && (
                <>
                  {!isConfigured ? (
                    <button 
                      onClick={() => setView('settings')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Connect DB
                    </button>
                  ) : (
                    <button
                      onClick={() => setView('settings')}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Settings"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setView('add')}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/30"
                    title="Add past standup manually"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  
                  {isConfigured && (
                    <button
                      onClick={onSync}
                      disabled={isSyncing || isLoading}
                      className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent disabled:opacity-50"
                      title="Sync with Cloud"
                    >
                       <svg className={`${isSyncing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path></svg>
                    </button>
                  )}
                </>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all border border-transparent"
                title="Close Sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-black/20">
            {view === 'list' ? (
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <>
                    <HistoryItemSkeleton />
                    <HistoryItemSkeleton />
                    <HistoryItemSkeleton />
                  </>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">Your history is empty</p>
                    <button onClick={() => setView('add')} className="text-xs font-bold text-indigo-500 mt-2 hover:underline">Add manually</button>
                  </div>
                ) : (
                  history.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="group relative border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-400 hover:shadow-lg transition-all bg-white dark:bg-slate-800/50 cursor-pointer" 
                      onClick={() => handleEntryClick(entry)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                          {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRestoreAction(entry); }}
                            className="p-1.5 bg-slate-50 dark:bg-slate-900 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Restore into Editor"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                            className="text-slate-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 font-mono leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                        {entry.generatedOutput.replace(/[*#]/g, '').split('\n').filter(l => l.trim().length > 0).slice(0, 2).join(' ')}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View Full Detail
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : view === 'detail' && selectedEntry ? (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Raw Notes History</label>
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {selectedEntry.rawInput}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Generated Standup Preview</label>
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {selectedEntry.generatedOutput}
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                   <Button 
                    onClick={() => handleRestoreAction(selectedEntry)}
                    className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                   >
                     Restore to Editor
                   </Button>
                   <button 
                    onClick={handleBack}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                   >
                     Go Back
                   </button>
                </div>
              </div>
            ) : view === 'settings' ? (
              <form onSubmit={handleSettingsSave} className="p-6 space-y-5 animate-in slide-in-from-right-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-sm text-indigo-900 dark:text-indigo-200 mb-6">
                   <p className="font-bold mb-2">Sync your history</p>
                   <p className="opacity-80 leading-relaxed text-xs">Enter your Supabase project credentials to enable cloud synchronization. This will allow you to access your standup history across devices.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Project URL</label>
                  <input 
                    type="url"
                    required
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={settingsUrl}
                    onChange={e => setSettingsUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Anon Public Key</label>
                  <input 
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={settingsKey}
                    onChange={e => setSettingsKey(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <Button type="submit" className="w-full h-11 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                    Save & Connect
                  </Button>
                  
                  {isConfigured && (
                    <button 
                      type="button" 
                      onClick={handleSettingsDisconnect} 
                      className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                    >
                      Disconnect & Reset
                    </button>
                  )}
                  
                   <button 
                    type="button" 
                    onClick={() => setView('list')} 
                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleManualSave} className="p-6 space-y-5 animate-in slide-in-from-right-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Standup Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Raw Notes (for Context)</label>
                  <textarea 
                    required
                    placeholder="Brief bullet points of what happened..."
                    className="w-full h-32 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                    value={manualRaw}
                    onChange={e => setManualRaw(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Formatted Output</label>
                  <textarea 
                    required
                    placeholder="Paste the final standup content here..."
                    className="w-full h-40 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed"
                    value={manualOutput}
                    onChange={e => setManualOutput(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setView('list')} className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Discard</button>
                  <Button type="submit" className="px-6 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Add Record</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
