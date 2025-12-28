import { createContext, useContext, useState, type ReactNode } from 'react';
import { getDefaultModel, getModelById, type ModelConfig } from '@/config/models';

interface ModelContextType {
  currentModel: ModelConfig;
  setCurrentModel: (model: ModelConfig) => void;
  setCurrentModelById: (modelId: string) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [currentModel, setCurrentModelState] = useState<ModelConfig>(getDefaultModel());

  const setCurrentModel = (model: ModelConfig) => {
    setCurrentModelState(model);
  };

  const setCurrentModelById = (modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setCurrentModelState(model);
    }
  };

  return (
    <ModelContext.Provider value={{
      currentModel,
      setCurrentModel,
      setCurrentModelById,
    }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
