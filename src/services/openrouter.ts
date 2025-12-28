import type { OpenRouterModel } from '../types/conversation';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export const RECOMMENDED_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    pricing: { prompt: 0.1, completion: 0.4 },
    context_length: 1000000,
    description: 'Best cost-performance ratio - Fast and capable',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    pricing: { prompt: 0.8, completion: 4 },
    context_length: 200000,
    description: 'Fast and efficient for most tasks',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    pricing: { prompt: 0.15, completion: 0.6 },
    context_length: 128000,
    description: 'Affordable OpenAI option',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    pricing: { prompt: 0.3, completion: 0.4 },
    context_length: 131072,
    description: 'Open source powerhouse',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    pricing: { prompt: 0.14, completion: 0.28 },
    context_length: 64000,
    description: 'Excellent value for complex reasoning',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    pricing: { prompt: 0.35, completion: 0.4 },
    context_length: 131072,
    description: 'Strong multilingual capabilities',
  },
];

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type MessageMode = 'standard' | 'deepThink' | 'webSearch';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string, thinking?: string, sources?: any[]) => void;
  onError: (error: Error) => void;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  modelId: string,
  apiKey: string,
  callbacks: StreamCallbacks,
  mode: MessageMode = 'standard'
): Promise<void> {
  try {
    const requestBody: any = {
      model: modelId,
      messages,
      stream: true,
    };

    // Add mode-specific parameters
    if (mode === 'deepThink') {
      requestBody.reasoning = { max_tokens: 8000 };
    } else if (mode === 'webSearch') {
      requestBody.tools = [{
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for current information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
            required: ['query'],
          },
        },
      }];
      requestBody.tool_choice = 'auto';
    }

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Swiss Army GPT',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let thinkingContent = '';
    let sources: any[] = [];
    let isInThinkingBlock = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
            
            if (reasoning && mode === 'deepThink') {
              thinkingContent += reasoning;
              isInThinkingBlock = true;
            } else if (content) {
              if (isInThinkingBlock && mode === 'deepThink') {
                // Transition from thinking to response
                isInThinkingBlock = false;
              }
              fullResponse += content;
              callbacks.onToken(content);
            }
            
            // Handle tool calls for web search
            if (parsed.choices?.[0]?.delta?.tool_calls) {
              const toolCall = parsed.choices[0].delta.tool_calls[0];
              if (toolCall.function?.arguments) {
                try {
                  const args = JSON.parse(toolCall.function.arguments);
                  if (args.results) {
                    sources = args.results;
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }

    callbacks.onComplete(fullResponse, thinkingContent, sources);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

export function getModelById(modelId: string): OpenRouterModel | undefined {
  return RECOMMENDED_MODELS.find(m => m.id === modelId);
}

export function formatPrice(pricePerMillion: number): string {
  return `$${pricePerMillion.toFixed(2)}/M`;
}
