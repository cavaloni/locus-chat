import { useState, useRef, useEffect } from 'react';
import { Square, Plus, Search, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/ModelSelector';
import { useMode } from '@/contexts/ModeContext';
import { useModel } from '@/contexts/ModelContext';
import type { MessageMode } from '@/services/openrouter';

interface ChatInputProps {
  onSend: (message: string, mode: MessageMode) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, onStop, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentMode, setMode, getOptimalModel } = useMode();
  const { currentModel, setCurrentModel } = useModel();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Check mode compatibility when model changes
  useEffect(() => {
    if (currentMode === 'deepThink' && !currentModel.supportsThinking) {
      setMode('standard');
    } else if (currentMode === 'webSearch' && !currentModel.supportsWebSearch) {
      setMode('standard');
    }
  }, [currentModel, currentMode, setMode]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim(), currentMode);
      setInput('');
    }
  };

  const handleModeToggle = (mode: MessageMode) => {
    if (mode === currentMode) {
      setMode('standard');
    } else {
      setMode(mode);
      // Auto-switch to optimal model for the mode
      const optimalModel = getOptimalModel(mode, currentModel);
      if (optimalModel.id !== currentModel.id) {
        setCurrentModel(optimalModel);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && currentMode !== 'standard') {
      setMode('standard');
    }
  };

  return (
    <div className="w-full space-y-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a Message"
        className="min-h-[44px] max-h-[200px] w-full resize-none border-0 bg-transparent text-white placeholder:text-[#666] focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled}
        rows={1}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentMode === 'webSearch' ? 'secondary' : 'ghost'}
            className={`h-8 px-3 transition-colors ${
              currentMode === 'webSearch' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            disabled={disabled}
            onClick={() => handleModeToggle('webSearch')}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            size="sm"
            variant={currentMode === 'deepThink' ? 'secondary' : 'ghost'}
            className={`h-8 px-3 transition-colors ${
              currentMode === 'deepThink' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            disabled={disabled}
            onClick={() => handleModeToggle('deepThink')}
          >
            <Brain className="h-4 w-4 mr-2" />
            Deep Think
          </Button>
          <ModelSelector />
        </div>
        {isLoading ? (
          <Button
            onClick={onStop}
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            size="icon"
            disabled={!input.trim() || disabled}
            className="h-8 w-8 shrink-0 bg-white text-black hover:bg-white/90"
          >
            <span className="text-sm font-medium">A</span>
          </Button>
        )}
      </div>
    </div>
  );
}
