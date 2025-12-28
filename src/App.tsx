import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/Sidebar';
import { ChatView } from '@/components/ChatView';
import { ConversationTree } from '@/components/ConversationTree';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ModelProvider } from '@/contexts/ModelContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { useChatStore } from '@/store/chatStore';
import './index.css';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { viewMode, error, setError, transitionOrigin } = useChatStore();

  return (
    <ModelProvider>
      <ModeProvider>
        <TooltipProvider>
      <div
        className="fixed inset-0 -z-10 overflow-hidden bg-[#030303]"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-0 h-[400px] w-[1400px] rounded-[50%] bg-[#0a4f4f] opacity-40 blur-[140px] animate-aurora-1 rotate-12" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[1400px] rounded-[50%] bg-[#2d2470] opacity-40 blur-[140px] animate-aurora-2 -rotate-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[700px] rounded-[50%] bg-[#6b1a1a] opacity-30 blur-[100px] animate-aurora-3" />
      </div>

      <div className="relative isolate flex h-screen bg-transparent text-[#888]">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        
        <main className="flex-1 flex flex-col">
          {error && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80"
              >
                ✕
              </button>
            </div>
          )}
          
          <div 
            className="flex-1 h-full min-h-0 overflow-hidden transition-all duration-[375ms] ease-out"
            style={{
              transform: viewMode === 'tree' ? 'scale(0.98)' : 'scale(1)',
              transformOrigin: `${transitionOrigin.x}% ${transitionOrigin.y}%`,
            }}
          >
            {viewMode === 'chat' ? <ChatView /> : <ConversationTree />}
          </div>
        </main>

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
      </TooltipProvider>
      </ModeProvider>
    </ModelProvider>
  );
}

export default App;
