import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, SparklesIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { getWeeklyEntries } from '../services/storageService';
import { generateWeeklyLog } from '../services/geminiService';
import { WeeklyLogbookPreview } from './WeeklyLogbookPreview';
import { exportPDF } from '../utils/pdfExport';
import { StandupEntry } from '../types';

interface WeeklyReportGeneratorProps {
  onClose: () => void;
}

export const WeeklyReportGenerator: React.FC<WeeklyReportGeneratorProps> = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekRange, setWeekRange] = useState({ start: '', end: '', label: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);

  useEffect(() => {
    calculateWeek(selectedDate);
  }, [selectedDate]);

  const calculateWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Calculate Monday (1)
    const diffToMon = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diffToMon));
    monday.setHours(0, 0, 0, 0);

    // Calculate Friday (5)
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const startStr = monday.toISOString().split('T')[0];
    const endStr = friday.toISOString().split('T')[0];
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const label = `${monday.toLocaleDateString('en-US', options)} - ${friday.toLocaleDateString('en-US', options)}`;

    setWeekRange({ start: monday.toISOString(), end: friday.toISOString(), label });
    setGeneratedContent(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const entries = await getWeeklyEntries(weekRange.start, weekRange.end);
      setEntryCount(entries.length);
      
      if (entries.length === 0) {
        setError("No standup records found for this week. Please ensure you have saved standups for these dates.");
        setIsGenerating(false);
        return;
      }

      const log = await generateWeeklyLog(entries);
      setGeneratedContent(log);
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!generatedContent) return;
    setIsExporting(true);
    try {
      const filename = `Internship_Log_${weekRange.label.replace(/ /g, '_').replace(/,/g, '')}`;
      await exportPDF('logbook-preview', filename);
    } catch (err: any) {
      setError(err.message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Weekly Logbook Hub</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Report Generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {!generatedContent ? (
            <div className="max-w-md mx-auto space-y-8 py-12">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[28px] mx-auto flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
                  <CalendarIcon className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Select Reporting Week</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Pick any day within the target week, and we'll automatically identify local or cloud records from Monday to Friday.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reference Date</label>
                  <input
                    type="date"
                    className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-base font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Target Range</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">{weekRange.label}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode</p>
                       <p className="text-xs font-bold text-slate-500 mt-1">Mon - Fri</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <Button 
                  className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-[0.2em]" 
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                >
                  Synthesize Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
               <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-full">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                        Synthesized from {entryCount} standup entries
                     </span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setGeneratedContent(null)}
                        className="h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                     >
                        <ArrowPathIcon className="w-4 h-4" />
                        Re-Pick Week
                     </button>
                     <Button 
                        variant="secondary"
                        className="h-10 px-5 rounded-[14px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                        onClick={handleExport}
                        isLoading={isExporting}
                     >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Export PDF
                     </Button>
                  </div>
               </div>
               <div className="shadow-2xl shadow-slate-200 dark:shadow-black/50">
                <WeeklyLogbookPreview 
                  content={generatedContent} 
                  dateRange={weekRange.label} 
                />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
