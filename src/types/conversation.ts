export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  parentId: string | null;
  children: string[];
  modelId?: string;
  mode?: 'standard' | 'deepThink' | 'webSearch';
  sources?: SearchResult[];
  thinking?: string;
}

export interface ConversationNode {
  id: string;
  messages: Message[];
  parentId: string | null;
  children: string[];
  title: string;
  inheritedMessageCount?: number;
  position?: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  rootNodeId: string;
  nodes: Record<string, ConversationNode>;
  currentNodeId: string;
  currentMessagePath: string[];
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  viewMode: 'chat' | 'tree';
  selectedModel: string;
  apiKey: string;
  transitionOrigin: { x: number; y: number };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  description?: string;
}
