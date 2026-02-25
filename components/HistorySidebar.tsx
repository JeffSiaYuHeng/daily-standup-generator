import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, Cog6ToothIcon, PlusIcon, ArrowPathIcon, TrashIcon, XMarkIcon, ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
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
  onUpdate: (entry: StandupEntry) => void;
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
  onUpdate,
  onSync,
  isOpen,
  setIsOpen,
  isLoading = false,
  isSyncing = false
}) => {
  const [view, setView] = useState<SidebarView>('list');
  const [selectedEntry, setSelectedEntry] = useState<StandupEntry | null>(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editRaw, setEditRaw] = useState('');
  const [editOutput, setEditOutput] = useState('');
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
    if (confirm("Are you sure you want to disconnect? This will switch to local storage.")) {
      localStorage.removeItem('supabase_settings');
      window.location.reload();
    }
  };

  const handleExport = () => {
    if (history.length === 0) return;
    const jsonString = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    link.download = `standup-history-${year}-${month}-${day}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEntryClick = (entry: StandupEntry) => {
    setSelectedEntry(entry);
    setIsEditingEntry(false);
    const dateObj = new Date(entry.date);
    setEditDate(dateObj.toISOString().split('T')[0]);
    setEditRaw(entry.rawInput);
    setEditOutput(entry.generatedOutput);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedEntry(null);
    setIsEditingEntry(false);
  };

  const handleRestoreAction = (entry: StandupEntry) => {
    onSelect(entry);
    handleBack();
  };

  const handleEditToggle = () => {
    setIsEditingEntry(!isEditingEntry);
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !editRaw || !editOutput || !editDate) return;

    const dateObj = new Date(editDate + 'T12:00:00');
    const updatedEntry: StandupEntry = {
      ...selectedEntry,
      date: dateObj.toISOString(),
      rawInput: editRaw,
      generatedOutput: editOutput
    };

    onUpdate(updatedEntry);
    setIsEditingEntry(false);
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
                  <ArrowLeftIcon className="w-5 h-5" />
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
                      <Cog6ToothIcon className="w-[18px] h-[18px]" />
                    </button>
                  )}

                  <button
                    onClick={() => setView('add')}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/30"
                    title="Add past standup manually"
                  >
                    <PlusIcon className="w-[18px] h-[18px]" />
                  </button>

                  {isConfigured && (
                    <button
                      onClick={onSync}
                      disabled={isSyncing || isLoading}
                      className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent disabled:opacity-50"
                      title="Sync with Cloud"
                    >
                      <ArrowPathIcon className={`w-[18px] h-[18px] ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </>
              )}
              {history.length > 0 && (
                <button
                  onClick={handleExport}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent"
                  title="Export History to JSON"
                >
                  <ArrowDownTrayIcon className="w-[18px] h-[18px]" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all border border-transparent"
                title="Close Sidebar"
              >
                <XMarkIcon className="w-[18px] h-[18px]" />
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
                      <ClockIcon className="w-6 h-6 text-slate-300" />
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
                          {(() => {
                            const date = new Date(entry.date);
                            const day = date.getDate();
                            const month = date.getMonth() + 1;
                            const year = date.getFullYear();
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                            return `${day}/${month}/${year} ${dayName}`;
                          })()}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestoreAction(entry); }}
                            className="p-1.5 bg-slate-50 dark:bg-slate-900 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Restore into Editor"
                          >
                            <ArrowPathIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                            className="text-slate-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <TrashIcon className="w-3 h-3" />
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
                {isEditingEntry ? (
                  <form onSubmit={handleUpdateEntry} className="flex flex-col h-full">
                    <div className="p-6 space-y-5 overflow-y-auto">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Standup Date</label>
                        <input
                          type="date"
                          required
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Raw Notes</label>
                        <textarea
                          required
                          className="w-full h-32 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                          value={editRaw}
                          onChange={e => setEditRaw(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Generated Output</label>
                        <textarea
                          required
                          className="w-full h-40 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed"
                          value={editOutput}
                          onChange={e => setEditOutput(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-auto p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                      >
                        Save Changes
                      </Button>
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Entry Date</label>
                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                          {(() => {
                            const date = new Date(selectedEntry.date);
                            const day = date.getDate();
                            const month = date.getMonth() + 1;
                            const year = date.getFullYear();
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                            return `${day}/${month}/${year} ${dayName}`;
                          })()}
                        </div>
                      </div>

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
                        onClick={handleEditToggle}
                        className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 bg-amber-600 hover:bg-amber-500"
                      >
                        Edit Entry
                      </Button>
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
                  </>
                )}
              </div>
            ) : view === 'settings' ? (
              <form onSubmit={handleSettingsSave} className="p-6 space-y-5 animate-in slide-in-from-right-4">
                <div className="p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-indigo-900 dark:text-indigo-200 mb-6">
                  <p className="font-bold mb-2 text-sm sm:text-base">Sync your history</p>
                  <p className="opacity-80 leading-relaxed text-xs mb-3">Enter your Supabase project credentials to enable cloud synchronization. This will allow you to access your standup history across devices.</p>
                  <p className="opacity-70 leading-relaxed text-xs border-t border-indigo-200 dark:border-indigo-800 pt-3 mt-3">
                    <strong>Setup required:</strong> Before connecting, run this SQL in your Supabase SQL Editor (Database → SQL Editor):
                  </p>
                  <div className="mt-3 p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-lg text-[9px] sm:text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48 sm:max-h-64 overflow-y-auto border border-indigo-100 dark:border-slate-800 whitespace-pre-wrap break-words">
                    <pre className="text-[9px] sm:text-[10px] leading-tight sm:leading-relaxed">-- Create standups table
                      CREATE TABLE IF NOT EXISTS public.standups (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                      date TIMESTAMP WITH TIME ZONE NOT NULL,
                      raw_input TEXT NOT NULL,
                      generated_output TEXT NOT NULL,
                      consistency_notes JSONB DEFAULT '[]'::jsonb,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                      );

                      -- Create jira_tickets table
                      CREATE TABLE IF NOT EXISTS public.jira_tickets (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                      ticket_key TEXT NOT NULL UNIQUE,
                      title TEXT NOT NULL,
                      status TEXT NOT NULL,
                      link TEXT,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                      );

                      -- Add indexes
                      CREATE INDEX IF NOT EXISTS idx_standups_date
                      ON public.standups(date DESC);
                      CREATE INDEX IF NOT EXISTS idx_tickets_key
                      ON public.jira_tickets(ticket_key);

                      -- Enable RLS
                      ALTER TABLE public.standups ENABLE ROW LEVEL SECURITY;
                      ALTER TABLE public.jira_tickets ENABLE ROW LEVEL SECURITY;

                      -- Create policies
                      CREATE POLICY "Enable all access"
                      ON public.standups FOR ALL USING (true);

                      CREATE POLICY "Enable all access"
                      ON public.jira_tickets FOR ALL USING (true);</pre>
                  </div>
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

          {/* Version Footer */}
          <div className="flex-none py-3 text-center border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              Version V1.3.1
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
