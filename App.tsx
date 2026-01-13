import React, { useState, useEffect } from 'react';
import { StandupInput } from './components/StandupInput';
import { StandupOutput } from './components/StandupOutput';
import { HistorySidebar } from './components/HistorySidebar';
import { JiraTicketManager } from './components/JiraTicketManager';
import { InstallPrompt } from './components/InstallPrompt';
import { ApiKeySettings } from './components/ApiKeySettings';
import { 
  getHistory, saveEntry, deleteEntry, getLatestEntry, updateEntry, syncLocalToCloud,
  getTickets, saveTicket, deleteTicket, getGeminiApiKey
} from './services/storageService';
import { generateStandup, refineStandup } from './services/geminiService';
import { StandupEntry, GenerationStatus, GenerationResult, JiraTicket } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from './context/ToastContext';

type AppView = 'generator' | 'tickets';

function App() {
  const [view, setView] = useState<AppView>('generator');
  const [rawInput, setRawInput] = useState('');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [consistencyNotes, setConsistencyNotes] = useState<string[]>([]);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [useReference, setUseReference] = useState(true);
  
  const [history, setHistory] = useState<StandupEntry[]>([]);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  
  const toast = useToast();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');

  // Check for API key on mount
  useEffect(() => {
    if (!getGeminiApiKey()) {
      const timer = setTimeout(() => {
        toast.info("Please configure your Gemini API key to get started.");
        setShowApiKeySettings(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsHistoryLoading(true);
      try {
        const [histData, ticketData] = await Promise.all([
          getHistory(),
          getTickets()
        ]);
        setHistory(histData);
        setTickets(ticketData);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSaveTicket = async (ticket: JiraTicket) => {
    try {
      const updated = await saveTicket(ticket);
      setTickets(updated);
      toast.success("Ticket saved");
    } catch (e) {
      toast.error("Failed to save ticket");
    }
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      const updated = await deleteTicket(id);
      setTickets(updated);
      setSelectedTicketIds(prev => prev.filter(tid => tid !== id));
      toast.success("Ticket deleted");
    } catch (e) {
      toast.error("Failed to delete ticket");
    }
  };

  const handleToggleTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) 
        ? prev.filter(tid => tid !== id) 
        : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!rawInput.trim() && selectedTicketIds.length === 0) {
      toast.error("Please provide input or select a ticket.");
      return;
    }

    // Check if API key is configured
    if (!getGeminiApiKey()) {
      toast.error("Please configure your Gemini API key in settings.");
      setShowApiKeySettings(true);
      return;
    }

    setStatus(GenerationStatus.GENERATING);
    setErrorMsg(null);
    setGeneratedOutput('');
    setConsistencyNotes([]);
    
    try {
      let previousContext = undefined;
      const latest = await getLatestEntry();
      if (useReference && latest) previousContext = latest.generatedOutput;

      // Get full ticket objects for the selected IDs
      const selectedTickets = tickets.filter(t => selectedTicketIds.includes(t.id));

      const result: GenerationResult = await generateStandup({ 
        rawInput, 
        previousContext,
        selectedTickets 
      });

      setGeneratedOutput(result.standupText);
      setConsistencyNotes(result.consistencyNotes);
      setStatus(GenerationStatus.SUCCESS);
      
      if (window.innerWidth < 1024) setActiveTab('output');
      toast.success("Standup generated!");
    } catch (error: any) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg(error.message);
      toast.error("Generation failed");
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!getGeminiApiKey()) {
      toast.error("Please configure your Gemini API key in settings.");
      setShowApiKeySettings(true);
      return;
    }
    
    setIsRefining(true);
    try {
      const result = await refineStandup(generatedOutput, instruction);
      setGeneratedOutput(result.standupText);
      setConsistencyNotes(result.consistencyNotes);
      toast.success("Updated!");
    } catch (err: any) {
      toast.error("Refinement failed");
    } finally {
      setIsRefining(false);
    }
  };

  const handlePromote = async () => {
    try {
      const latest = await getLatestEntry();
      if (!latest) return;
      const todayMatch = latest.generatedOutput.match(/\*\*What I am working on today:\*\*\n([\s\S]*?)(?=\n\n|\n$|$)/);
      const tasks = todayMatch ? todayMatch[1].trim() : '';
      setRawInput(`Yesterday: \n${tasks || '(Fetched from history)'}\n\nToday: `);
      setActiveTab('input');
      toast.info("Rolled over tasks");
    } catch (err) {
      toast.error("Failed to roll over");
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const entryToUpdate: StandupEntry = {
          id: editingId,
          date: new Date().toISOString(),
          rawInput,
          generatedOutput,
          consistencyNotes
        };
        const updatedHistory = await updateEntry(entryToUpdate);
        setHistory(updatedHistory);
        toast.success("Entry updated!");
      } else {
        const newEntry: StandupEntry = {
          id: uuidv4(),
          date: new Date().toISOString(),
          rawInput,
          generatedOutput,
          consistencyNotes
        };
        const updatedHistory = await saveEntry(newEntry);
        setHistory(updatedHistory);
        setEditingId(newEntry.id);
        toast.success("Saved to history!");
      }
    } catch (err) {
      toast.error("Failed to save entry");
    }
  };

  const handleManualHistorySave = async (entry: StandupEntry) => {
    try {
      const updated = await saveEntry(entry);
      setHistory(updated);
      toast.success("History record added");
    } catch (err) {
      toast.error("Failed to add record");
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const updated = await deleteEntry(id);
      setHistory(updated);
      if (editingId === id) handleNew();
      toast.success("Deleted from history");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleLoadHistory = (entry: StandupEntry) => {
    setRawInput(entry.rawInput);
    setGeneratedOutput(entry.generatedOutput);
    setConsistencyNotes(entry.consistencyNotes || []);
    setEditingId(entry.id);
    setStatus(GenerationStatus.SUCCESS); 
    setIsSidebarOpen(false);
    setView('generator');
    setActiveTab('output');
    toast.info("Loaded previous entry into workspace");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
       const updatedHistory = await syncLocalToCloud();
       setHistory(updatedHistory);
       const updatedTickets = await getTickets();
       setTickets(updatedTickets);
       toast.success("Synced with Cloud");
    } catch (err: any) {
       toast.error(err.message || "Sync failed");
    } finally {
       setIsSyncing(false);
    }
  };

  const handleNew = () => {
    setRawInput('');
    setGeneratedOutput('');
    setConsistencyNotes([]);
    setEditingId(null);
    setSelectedTicketIds([]);
    setStatus(GenerationStatus.IDLE);
    setActiveTab('input');
    toast.info("New workspace");
  };

  return (
    <div className="h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 flex flex-col font-sans transition-colors duration-500 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full animate-pulse delay-700" />
      </div>

      <header className="flex-none z-30 transition-all duration-300 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-6">
            <div 
              className="flex items-center gap-2.5 shrink-0 cursor-pointer group" 
              onClick={() => setView('generator')}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[14px] flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-indigo-500/20 transform transition-all group-hover:scale-105 active:scale-95 duration-300">
                S
              </div>
              <div className="hidden lg:block">
                <h1 className="text-base font-black text-slate-900 dark:text-white leading-none tracking-tight">Standup AI</h1>
                <p className="text-[9px] uppercase font-black text-indigo-500 dark:text-indigo-400 mt-1 tracking-[0.2em]">Engineering Hub</p>
              </div>
            </div>

            {/* Main Navigation - Bigger for Mobile */}
            <nav className="flex items-center p-1.5 sm:p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-[20px] border border-white/20 dark:border-slate-700/50 shadow-inner">
              <button 
                onClick={() => setView('generator')}
                className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-[16px] text-[12px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${view === 'generator' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-lg transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                <span className="xs:inline">Standup</span>
              </button>
              <button 
                onClick={() => setView('tickets')}
                className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-[16px] text-[12px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${view === 'tickets' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-lg transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>
                <span className="xs:inline">Jira</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              onClick={() => setShowApiKeySettings(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all duration-300 focus:outline-none relative"
              title="API Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243M8.879 8.879L4.636 4.636m10.485 14.728l-4.243-4.243m-6.364 0l-4.243 4.243"></path></svg>
              {!getGeminiApiKey() && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all duration-300 focus:outline-none"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {history.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-2 sm:p-4 lg:p-6 flex flex-col min-h-0">
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-2xl flex items-center gap-4 flex-none animate-in fade-in shadow-sm">
             <div className="p-2 bg-white dark:bg-red-900/40 rounded-xl shadow-sm">
               <svg className="w-5 h-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
             </div>
             <p className="font-bold text-sm flex-1">{errorMsg}</p>
             <button onClick={() => setErrorMsg(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        )}

        {view === 'generator' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Mobile Tab Selector - Bigger UI */}
            <div className="lg:hidden flex bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-[28px] mb-4 flex-none border border-white/20 dark:border-slate-700/50 shadow-inner">
              <button
                onClick={() => setActiveTab('input')}
                className={`flex-1 py-4 text-[13px] font-black uppercase tracking-[0.2em] rounded-[22px] transition-all duration-300 ${activeTab === 'input' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl transform scale-[1.01]' : 'text-slate-500'}`}
              >
                Drafting
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`flex-1 py-4 text-[13px] font-black uppercase tracking-[0.2em] rounded-[22px] transition-all duration-300 ${activeTab === 'output' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl transform scale-[1.01]' : 'text-slate-500'}`}
              >
                Preview
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 min-h-0">
              <div className={`${activeTab === 'input' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-h-0 animate-in fade-in duration-500`}>
                 <StandupInput 
                  value={rawInput}
                  onChange={setRawInput}
                  onGenerate={handleGenerate}
                  onPromote={handlePromote}
                  onAutoDraft={() => {}}
                  isGenerating={status === GenerationStatus.GENERATING}
                  useReference={useReference}
                  setUseReference={setUseReference}
                  hasHistory={history.length > 0}
                  activeTickets={tickets.filter(t => t.status === 'In Progress')}
                  selectedTicketIds={selectedTicketIds}
                  onToggleTicket={handleToggleTicket}
                />
              </div>

              <div className={`${activeTab === 'output' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-h-0 animate-in fade-in duration-500`}>
                 <StandupOutput 
                  value={generatedOutput}
                  consistencyNotes={consistencyNotes}
                  onChange={setGeneratedOutput}
                  onSave={handleSave}
                  onRefine={handleRefine}
                  isGenerating={status === GenerationStatus.GENERATING}
                  isRefining={isRefining}
                  isPlaceholder={status === GenerationStatus.IDLE}
                  isEditing={!!editingId}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 animate-in fade-in zoom-in-95 duration-500">
             <JiraTicketManager
                tickets={tickets}
                onSaveTicket={handleSaveTicket}
                onDeleteTicket={handleDeleteTicket}
              />
          </div>
        )}
      </main>

      <HistorySidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        history={history}
        isLoading={isHistoryLoading}
        onSelect={handleLoadHistory}
        onDelete={handleDeleteHistory}
        onSaveManualEntry={handleManualHistorySave}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      
      {showApiKeySettings && (
        <ApiKeySettings
          onClose={() => setShowApiKeySettings(false)}
          onSave={() => toast.success("API key saved successfully")}
        />
      )}
      
      <InstallPrompt />
    </div>
  );
}

export default App;
