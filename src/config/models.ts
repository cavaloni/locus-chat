import { Sparkles, Brain, Zap, Globe, Rocket, Flame, Star, Bolt, Diamond, CloudLightning } from 'lucide-react';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  category: 'sota' | 'budget';
  icon: any;
  color: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  description: string;
  supportsThinking?: boolean;
  supportsWebSearch?: boolean;
}

export const MODELS: ModelConfig[] = [
  // SOTA Models
  {
    id: 'openai/gpt-4-turbo-preview',
    name: 'ChatGPT 5.2',
    provider: 'OpenAI',
    category: 'sota',
    icon: Sparkles,
    color: '#10a37f',
    pricing: { prompt: 10.0, completion: 30.0 },
    context_length: 128000,
    description: 'Latest flagship model with advanced reasoning',
    supportsThinking: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    category: 'sota',
    icon: Brain,
    color: '#d97757',
    pricing: { prompt: 3.0, completion: 15.0 },
    context_length: 200000,
    description: 'Balanced performance for complex tasks',
    supportsThinking: true,
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 3',
    provider: 'Google',
    category: 'sota',
    icon: Globe,
    color: '#4285f4',
    pricing: { prompt: 3.5, completion: 10.5 },
    context_length: 2000000,
    description: 'Multimodal powerhouse with native tool use',
    supportsThinking: true,
    supportsWebSearch: true,
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Opus 4.5',
    provider: 'Anthropic',
    category: 'sota',
    icon: Star,
    color: '#cc785c',
    pricing: { prompt: 15.0, completion: 75.0 },
    context_length: 200000,
    description: 'Maximum capability for most complex tasks',
    supportsThinking: true,
  },
  {
    id: 'x-ai/grok-beta',
    name: 'Grok 3',
    provider: 'xAI',
    category: 'sota',
    icon: CloudLightning,
    color: '#ff6b35',
    pricing: { prompt: 5.0, completion: 15.0 },
    context_length: 131072,
    description: 'Real-time knowledge with witty personality',
    supportsWebSearch: true,
  },
  
  // Budget Models
  {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    category: 'budget',
    icon: Zap,
    color: '#34a853',
    pricing: { prompt: 0.075, completion: 0.3 },
    context_length: 1000000,
    description: 'Fast and affordable for most tasks',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    category: 'budget',
    icon: Flame,
    color: '#f59e0b',
    pricing: { prompt: 0.8, completion: 4.0 },
    context_length: 200000,
    description: 'Fast and efficient for everyday tasks',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'budget',
    icon: Bolt,
    color: '#10a37f',
    pricing: { prompt: 0.15, completion: 0.6 },
    context_length: 128000,
    description: 'Affordable OpenAI option with good performance',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    category: 'budget',
    icon: Diamond,
    color: '#6366f1',
    pricing: { prompt: 0.88, completion: 0.88 },
    context_length: 131072,
    description: 'Open source powerhouse for complex reasoning',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    category: 'budget',
    icon: Rocket,
    color: '#06b6d4',
    pricing: { prompt: 0.14, completion: 0.28 },
    context_length: 64000,
    description: 'Excellent value for coding and math',
  },
];

export const getModelById = (modelId: string): ModelConfig | undefined => {
  return MODELS.find(m => m.id === modelId);
};

export const getDefaultModel = (): ModelConfig => {
  return MODELS[0]; // ChatGPT 5.2 as default
};

export const formatPrice = (pricePerMillion: number): string => {
  return `$${pricePerMillion.toFixed(2)}/M`;
};
