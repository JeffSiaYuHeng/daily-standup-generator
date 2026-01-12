import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { JiraTicket, TicketStatus } from '../types';
import { Button } from './ui/Button';

interface JiraTicketManagerProps {
  tickets: JiraTicket[];
  onSaveTicket: (ticket: JiraTicket) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

const STATUS_OPTIONS: TicketStatus[] = ['In Progress', 'In Review', 'Done', 'Cancel'];

export const JiraTicketManager: React.FC<JiraTicketManagerProps> = ({
  tickets,
  onSaveTicket,
  onDeleteTicket
}) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingTicket, setEditingTicket] = useState<Partial<JiraTicket>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (ticket?: JiraTicket) => {
    if (ticket) {
      setEditingTicket({ ...ticket });
    } else {
      setEditingTicket({
        id: uuidv4(),
        status: 'In Progress',
        ticketKey: '',
        title: '',
        link: ''
      });
    }
    setView('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket.ticketKey || !editingTicket.title) return;
    
    setIsLoading(true);
    try {
      await onSaveTicket(editingTicket as JiraTicket);
      setView('list');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this ticket?")) {
      await onDeleteTicket(id);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'In Progress': return 'text-blue-500';
      case 'In Review': return 'text-amber-500';
      case 'Done': return 'text-emerald-500';
      case 'Cancel': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
      
      {/* Simplified Header */}
      <div className="px-6 py-4 sm:px-8 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {view === 'list' ? 'Sprint Tickets' : (editingTicket.ticketKey ? 'Update Ticket' : 'Add Ticket')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {view === 'list' ? `${tickets.length} total tasks` : 'Fill in the details below'}
          </p>
        </div>
        
        {view === 'list' && (
          <Button onClick={() => handleEdit()} className="h-9 px-4 rounded-xl text-[11px] font-bold tracking-wider">
            ADD TICKET
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 p-4 sm:p-8">
        {view === 'list' ? (
          <div className="max-w-4xl mx-auto">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No tickets added yet.</p>
                <button 
                  onClick={() => handleEdit()}
                  className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Create your first ticket
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="py-4 flex items-center justify-between gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {ticket.ticketKey}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                          • {ticket.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {ticket.title}
                      </h3>
                      {ticket.link && (
                        <a href={ticket.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline mt-1 block">
                          View in Jira
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(ticket)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(ticket.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto py-4">
             <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ticket Key *</label>
                    <input 
                      required
                      placeholder="e.g. CORE-123"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all uppercase"
                      value={editingTicket.ticketKey || ''}
                      onChange={e => setEditingTicket({...editingTicket, ticketKey: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                      value={editingTicket.status}
                      onChange={e => setEditingTicket({...editingTicket, status: e.target.value as TicketStatus})}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Summary *</label>
                  <input 
                    required
                    placeholder="Briefly describe the task..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={editingTicket.title || ''}
                    onChange={e => setEditingTicket({...editingTicket, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL (Optional)</label>
                  <input 
                    type="url"
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={editingTicket.link || ''}
                    onChange={e => setEditingTicket({...editingTicket, link: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setView('list')} className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2 px-4 transition-colors">
                    Cancel
                  </button>
                  <Button type="submit" isLoading={isLoading} className="h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wider">
                    {editingTicket.ticketKey ? 'Save Changes' : 'Create Ticket'}
                  </Button>
                </div>
              </form>
          </div>
        )}
      </div>
    </div>
  );
};
