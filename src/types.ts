export interface Memory {
  id: string;
  buyer_id: string;
  type: 'world_facts' | 'experiences' | 'mental_models';
  content: string;
  confidence: number; // between 0 and 1
  timestamp: string;
  source: string;
  tags?: string[];
}

export interface Buyer {
  id: string;
  name: string;
  company: string;
  role: string;
  avatar: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isBeforeAfter?: boolean;
  beforeContent?: string; // Standard LLM response
  afterContent?: string;  // SalesIQ with Memory response
}

export interface DebriefData {
  buyer_id: string;
  call_summary: string;
  objections_raised: string;
  positive_signals: string;
  next_steps: string;
  outcome: 'Won' | 'Lost' | 'Progressed';
}

export interface DatabaseState {
  buyers: Buyer[];
  memories: Memory[];
  chatHistory: Record<string, Message[]>;
}
