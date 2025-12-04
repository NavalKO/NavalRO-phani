export interface FileContext {
  name: string;
  content: string;
  type: 'transcript' | 'schema' | 'template';
}

export interface GenerationResult {
  json: any;
  explanation?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface RagContext {
  transcript: string | null;
  schema: string | null;
  template: string | null;
}

export type IntakeStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
