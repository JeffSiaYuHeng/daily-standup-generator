import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IWindow, JiraTicket } from '../types';
import { Button } from './ui/Button';

interface StandupInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onPromote: () => void;
  onAutoDraft: () => void;
  isGenerating: boolean;
  useReference: boolean;
  setUseReference: (use: boolean) => void;
  hasHistory: boolean;
  activeTickets?: JiraTicket[];
  selectedTicketIds?: string[];
  onToggleTicket?: (id: string) => void;
}

export const StandupInput: React.FC<StandupInputProps> = ({
  value,
  onChange,
  onGenerate,
  onPromote,
  onAutoDraft,
  isGenerating,
  useReference,
  setUseReference,
  hasHistory,
  activeTickets = [],
  selectedTicketIds = [],
  onToggleTicket
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimInput, setInterimInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // We use a ref for value to access the latest state inside the event listener 
  // without triggering a re-initialization of the recognition instance.
  const valueRef = useRef(value);

  // Sync ref with prop
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const iWindow = window as unknown as IWindow;
    const SpeechRecognition = iWindow.SpeechRecognition || iWindow.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimInput('');
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setInterimInput('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
           // Clean the transcript by removing extra whitespace and newlines
           const cleanTranscript = finalTranscript.replace(/\s+/g, ' ').trim();
           // Append to the latest value from ref
           const separator = valueRef.current && !valueRef.current.endsWith('\n') && !valueRef.current.endsWith(' ') ? ' ' : '';
           const newValue = valueRef.current + separator + cleanTranscript;
           onChange(newValue);
           // valueRef update happens in the other useEffect
        }
        
        setInterimInput(currentInterim);
      };

      recognitionRef.current = recognition;
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array ensures we don't recreate the instance

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        textareaRef.current?.focus();
      } catch (e) {
        console.warn("Recognition already started or failed to start");
      }
    }
  }, [isListening]);

  const toggleTicket = (ticket: JiraTicket) => {
    if (onToggleTicket) {
      onToggleTicket(ticket.id);
    }
  };

  const isTicketSelected = (ticket: JiraTicket) => {
    return selectedTicketIds.includes(ticket.id);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all duration-500 relative">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
        <h2 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 uppercase tracking-tighter text-sm">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </div>
          Drafting Area
        </h2>
        <div className="flex items-center gap-2">
          {hasHistory && (
            <button
              onClick={onPromote}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all border border-indigo-500/20 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path></svg>
              Roll
            </button>
          )}
          {speechSupported && (
            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isListening 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              {isListening ? (
                 <span className="flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></span>
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></span>
                 </span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
              )}
              {isListening ? 'Stop' : 'Rec'}
            </button>
          )}
        </div>
      </div>

      {activeTickets.length > 0 && (
         <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-black/20 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-3">
               <span className="shrink-0 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Tasks:</span>
               <div className="flex gap-2">
                 {activeTickets.map(ticket => (
                   <button 
                      key={ticket.id} 
                      onClick={() => toggleTicket(ticket)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 ${isTicketSelected(ticket) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400 opacity-60 hover:opacity-100'}`}
                   >
                      <span className="font-mono tracking-tighter opacity-70">{ticket.ticketKey}</span>
                      {isTicketSelected(ticket) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                   </button>
                 ))}
               </div>
            </div>
         </div>
      )}

      {/* Voice Processing Indicator */}
      {isListening && (
        <div className="absolute bottom-24 left-6 right-6 z-20 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
          <div className="bg-slate-900/90 dark:bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center gap-4 border border-white/10 dark:border-slate-200">
            <div className="flex items-center gap-1 h-6">
               <div className="w-1 h-3 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
               <div className="w-1 h-5 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite_0.1s]"></div>
               <div className="w-1 h-4 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s]"></div>
               <div className="w-1 h-2 bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite_0.3s]"></div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Processing Voice Input...
              </p>
              <p className="text-sm font-medium text-white dark:text-slate-800 italic truncate min-h-[20px]">
                {interimInput || "Listening..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-slate-50/20 dark:bg-slate-900/20">
        <textarea
          ref={textareaRef}
          className="w-full h-full p-8 sm:p-10 resize-none bg-transparent focus:outline-none text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed placeholder:text-slate-400 font-medium"
          placeholder="What's happening? Type or speak your updates..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="px-6 py-6 border-t border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex flex-col sm:flex-row gap-6 items-center justify-between z-10 shrink-0">
        <div className="flex-1 w-full sm:w-auto">
          {hasHistory ? (
            <button 
              className="flex items-center gap-4 p-1.5 pr-6 bg-slate-100 dark:bg-slate-700/50 rounded-full transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
              onClick={() => setUseReference(!useReference)}
            >
              <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${useReference ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-500'}`}>
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all ${useReference ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-700 dark:text-slate-200">Context Reference</span>
            </button>
          ) : null}
        </div>

        <Button 
            onClick={onGenerate} 
            isLoading={isGenerating} 
            disabled={(!value.trim() && selectedTicketIds.length === 0) && !isListening}
            className="w-full sm:w-auto px-12 h-14 rounded-[20px] shadow-2xl shadow-indigo-500/30 text-xs font-black uppercase tracking-[0.2em] transform hover:translate-y-[-2px] transition-transform"
        >
          Synthesize Now
        </Button>
      </div>
    </div>
  );
};
