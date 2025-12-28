import { createContext, useContext, useState, type ReactNode } from 'react';
import { MODELS, getDefaultModel, type ModelConfig } from '@/config/models';
import type { MessageMode } from '@/services/openrouter';

interface ModeContextType {
  currentMode: MessageMode;
  setMode: (mode: MessageMode) => void;
  getOptimalModel: (mode: MessageMode, currentModel: ModelConfig) => ModelConfig;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [currentMode, setCurrentMode] = useState<MessageMode>('standard');

  const setMode = (mode: MessageMode) => {
    setCurrentMode(mode);
  };

  const getOptimalModel = (mode: MessageMode, currentModel: ModelConfig): ModelConfig => {
    // If current model supports the requested mode, keep it
    if (mode === 'deepThink' && currentModel.supportsThinking) {
      return currentModel;
    }
    if (mode === 'webSearch' && currentModel.supportsWebSearch) {
      return currentModel;
    }
    if (mode === 'standard') {
      return currentModel;
    }

    // Otherwise, find the best model for the mode
    if (mode === 'deepThink') {
      const thinkingModel = MODELS.find(m => m.supportsThinking);
      if (thinkingModel) {
        return thinkingModel;
      }
    }
    
    if (mode === 'webSearch') {
      const searchModel = MODELS.find(m => m.supportsWebSearch);
      if (searchModel) {
        return searchModel;
      }
    }

    // Fallback to default model
    return getDefaultModel();
  };

  return (
    <ModeContext.Provider value={{
      currentMode,
      setMode,
      getOptimalModel,
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
