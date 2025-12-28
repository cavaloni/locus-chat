import { useState } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useModel } from '@/contexts/ModelContext';
import { MODELS, formatPrice, type ModelConfig } from '@/config/models';

interface ModelOptionProps {
  model: ModelConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelOption({ model, isSelected, onSelect }: ModelOptionProps) {
  const Icon = model.icon;
  
  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
        ${isSelected 
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'hover:bg-white/5 text-white/80 hover:text-white'
        }
      `}
    >
      <div 
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ backgroundColor: `${model.color}20` }}
      >
        <Icon 
          className="w-4 h-4" 
          style={{ color: model.color }}
        />
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{model.name}</span>
          {model.supportsThinking && (
            <Sparkles className="w-3 h-3 text-yellow-500" />
          )}
        </div>
        <div className="text-xs text-white/60 mt-0.5">
          {model.description}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-white/40">
            {formatPrice(model.pricing.prompt)}
          </span>
          <span className="text-xs text-white/40">
            {model.context_length.toLocaleString()} ctx
          </span>
        </div>
      </div>
      
      {isSelected && (
        <Check className="w-4 h-4 text-primary" />
      )}
    </button>
  );
}

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const { currentModel, setCurrentModel } = useModel();
  
  const sotaModels = MODELS.filter(m => m.category === 'sota');
  const budgetModels = MODELS.filter(m => m.category === 'budget');
  
  const CurrentModelIcon = currentModel.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 gap-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
        >
          <div 
            className="flex items-center justify-center w-5 h-5 rounded"
            style={{ backgroundColor: `${currentModel.color}20` }}
          >
            <CurrentModelIcon 
              className="w-3 h-3" 
              style={{ color: currentModel.color }}
            />
          </div>
          <span className="truncate max-w-[100px]">{currentModel.name}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 border border-white/10 bg-[#1A1A1A] shadow-xl"
        align="start"
        sideOffset={4}
      >
        <div className="p-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-white">Select Model</h3>
          <p className="text-xs text-white/60 mt-0.5">
            Choose different models for each message
          </p>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {/* SOTA Models Section */}
          <div className="p-3">
            <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
              State-of-the-Art
            </h4>
            <div className="space-y-1">
              {sotaModels.map(model => (
                <ModelOption
                  key={model.id}
                  model={model}
                  isSelected={model.id === currentModel.id}
                  onSelect={() => {
                    setCurrentModel(model);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Budget Models Section */}
          <div className="p-3 border-t border-white/10">
            <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
              Budget Options
            </h4>
            <div className="space-y-1">
              {budgetModels.map(model => (
                <ModelOption
                  key={model.id}
                  model={model}
                  isSelected={model.id === currentModel.id}
                  onSelect={() => {
                    setCurrentModel(model);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
