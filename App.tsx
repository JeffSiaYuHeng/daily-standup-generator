import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, SunIcon, MoonIcon, ClockIcon, ChartBarIcon, DocumentIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
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
        <div className="max-w-[1920px] mx-auto px-3 sm:px-8 py-2 sm:py-3 flex flex-col gap-2">
          {/* Top Row: Logo and Right Actions */}
          <div className="flex items-center justify-between gap-2 h-10 sm:h-auto">
            <div 
              className="flex items-center gap-2 shrink-0 cursor-pointer group" 
              onClick={() => setView('generator')}
            >
              <img src="/icons/Logo.png" className="shadow-lg shadow-indigo-500/20 transform transition-all rounded-[14px] w-9 h-9 sm:w-12 sm:h-12 group-hover:scale-105 active:scale-95 duration-300" alt="Standup AI Logo" />
              <div className="hidden lg:block">
                <h1 className="text-base font-black text-slate-900 dark:text-white leading-none tracking-tight">Daily Standup AI</h1>
                <p className="text-[9px] uppercase font-black text-indigo-500 dark:text-indigo-400 mt-1 tracking-[0.2em]">Engineering Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setShowApiKeySettings(true)}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all duration-300 focus:outline-none relative"
                title="API Settings"
              >
                <Cog6ToothIcon className="w-[18px] h-[18px]" />
                {!getGeminiApiKey() && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all duration-300 focus:outline-none"
              >
                {darkMode ? (
                  <SunIcon className="w-[18px] h-[18px]" />
                ) : (
                  <MoonIcon className="w-[18px] h-[18px]" />
                )}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-all relative"
              >
                <ClockIcon className="w-[18px] h-[18px]" />
                {history.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Navigation Tabs */}
          <nav className="flex items-center p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-[18px] border border-white/20 dark:border-slate-700/50 shadow-inner">
            <button 
              onClick={() => setView('generator')}
              className={`flex items-center justify-center gap-1.5 flex-1 px-3 sm:px-6 py-2.5 rounded-[14px] text-[11px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${view === 'generator' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <ChartBarIcon className="w-[14px] h-[14px]" />
              <span className="hidden xs:inline">Standup</span>
            </button>
            <button 
              onClick={() => setView('tickets')}
              className={`flex items-center justify-center gap-1.5 flex-1 px-3 sm:px-6 py-2.5 rounded-[14px] text-[11px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${view === 'tickets' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <DocumentIcon className="w-[14px] h-[14px]" />
              <span className="hidden xs:inline">Jira</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-2 sm:p-4 lg:p-6 flex flex-col min-h-0">
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-2xl flex items-center gap-4 flex-none animate-in fade-in shadow-sm">
             <div className="p-2 bg-white dark:bg-red-900/40 rounded-xl shadow-sm">
               <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
             </div>
             <p className="font-bold text-sm flex-1">{errorMsg}</p>
             <button onClick={() => setErrorMsg(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
               <XMarkIcon className="w-[18px] h-[18px]" />
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
