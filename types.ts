
export interface StandupEntry {
  id: string;
  date: string; // ISO String for sorting, displayed formatted
  rawInput: string;
  generatedOutput: string;
  consistencyNotes?: string[];
}

export interface GenerationResult {
  standupText: string;
  consistencyNotes: string[];
}

export interface GenerationRequest {
  rawInput: string;
  previousContext?: string; // Content of yesterday's standup
  selectedTickets?: JiraTicket[]; // Active tickets selected by user
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// Web Speech API Types Shim
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// Jira / Ticket Types
export type TicketStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Cancel';

export interface JiraTicket {
  id: string;
  ticketKey: string; // e.g. PROJ-123
  title: string;
  status: TicketStatus;
  link?: string;
  updatedAt?: string;
}
