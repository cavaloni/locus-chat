import { Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
}

export function ThinkingBlock({ thinking, isStreaming = false }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
          <Brain className="h-4 w-4" />
          <span>Thinking Process</span>
          {isStreaming && (
            <Sparkles className="h-3 w-3 animate-pulse" />
          )}
        </div>
        {thinking.length > 500 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 ${
        isExpanded || thinking.length <= 500 ? '' : 'relative overflow-hidden'
      }`}>
        <div className={`prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words text-purple-300/80 text-sm ${
          !isExpanded && thinking.length > 500 ? 'max-h-32' : ''
        }`}>
          {thinking}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse" />
          )}
        </div>
        {!isExpanded && thinking.length > 500 && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
