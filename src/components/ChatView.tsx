import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { useChatStore } from '@/store/chatStore';
import { sendChatMessage } from '@/services/openrouter';
import { Bot, GitBranch, ArrowUpCircle, Pencil, Check, X, Sparkles, Brain, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConversationMiniMap } from './ConversationMiniMap';
import { useModel } from '@/contexts/ModelContext';
import { useMode } from '@/contexts/ModeContext';
import type { MessageMode } from '@/services/openrouter';
import type { SearchResult } from '@/types/conversation';

export function ChatView() {
  const { currentModel } = useModel();
  const { currentMode } = useMode();
  const {
    activeConversationId,
    isLoading,
    apiKey,
    getCurrentMessages,
    getCurrentNode,
    addMessage,
    branchFromMessage,
    setLoading,
    setError,
    createConversation,
    navigateToNode,
    updateNodeTitle,
  } = useChatStore();

  const conversation = useChatStore(state => 
    state.activeConversationId ? state.conversations[state.activeConversationId] : null
  );

  const [streamingContent, setStreamingContent] = useState('');
  const [streamingThinking, setStreamingThinking] = useState('');
  const [streamingSources, setStreamingSources] = useState<SearchResult[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  const messages = getCurrentMessages();
  const currentNode = getCurrentNode();

  useEffect(() => {
    if (currentNode) {
      setTempTitle(currentNode.title);
    }
  }, [currentNode?.title]);

  const handleUpdateTitle = () => {
    if (currentNode && tempTitle.trim()) {
      updateNodeTitle(currentNode.id, tempTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(currentNode?.title || '');
    }
  };

  const branchesByMessageId = useMemo(() => {
    if (!conversation || !currentNode) return new Map();
    
    const map = new Map();
    
    currentNode.children.forEach((childId: string) => {
      const childNode = conversation.nodes[childId];
      if (!childNode || typeof childNode.inheritedMessageCount === 'undefined') return;
      
      const branchPointIndex = childNode.inheritedMessageCount - 1;
      if (branchPointIndex >= 0 && branchPointIndex < childNode.messages.length) {
        const messageId = childNode.messages[branchPointIndex].id;
        const branches = map.get(messageId) || [];
        branches.push({
          id: childNode.id,
          title: childNode.title,
        });
        map.set(messageId, branches);
      }
    });
    
    return map;
  }, [conversation, currentNode]);

  const parentNode = useMemo(() => {
    if (!conversation || !currentNode?.parentId) return null;
    return conversation.nodes[currentNode.parentId];
  }, [conversation, currentNode]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, streamingThinking, scrollToBottom]);

  const handleSend = async (content: string, mode: MessageMode) => {
    if (!apiKey) {
      setError('Please set your OpenRouter API key in settings');
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = createConversation();
    }

    addMessage(content, 'user');
    setLoading(true);
    setStreamingContent('');
    abortRef.current = false;

    const chatMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content },
    ];

    await sendChatMessage(chatMessages, currentModel.id, apiKey, {
      onToken: (token) => {
        if (!abortRef.current) {
          setStreamingContent((prev) => prev + token);
        }
      },
      onComplete: (fullResponse, thinking, sources) => {
        if (!abortRef.current) {
          addMessage(fullResponse, 'assistant', currentModel.id, mode, sources, thinking);
          setStreamingContent('');
          setStreamingThinking('');
          setStreamingSources([]);
        }
        setLoading(false);
      },
      onError: (error) => {
        setError(error.message);
        setLoading(false);
        setStreamingContent('');
        setStreamingThinking('');
        setStreamingSources([]);
      },
    }, mode);
  };

  const handleStop = () => {
    abortRef.current = true;
    if (streamingContent) {
      addMessage(streamingContent, 'assistant', currentModel.id, currentMode, streamingSources, streamingThinking);
      setStreamingContent('');
      setStreamingThinking('');
      setStreamingSources([]);
    }
    setLoading(false);
  };

  const handleBranch = (messageId: string) => {
    branchFromMessage(messageId);
  };

  const handleBacktrack = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex >= 0) {
      const stepsBack = messages.length - messageIndex - 1;
      if (stepsBack > 0) {
        useChatStore.getState().backtrack(stepsBack);
      }
    }
  };

  if (!activeConversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2 text-white">Welcome to Locus</h1>
          <p className="text-muted-foreground mb-6">
            A nonlinear chat interface with conversation branching and tree visualization.
            Create a new locus to get started.
          </p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• <strong className="text-white">Branch</strong> from any message to explore alternatives</p>
            <p>• <strong className="text-white">Backtrack</strong> to undo messages</p>
            <p>• <strong className="text-white">Tree View</strong> to visualize your conversation branches</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col relative">
      <ConversationMiniMap />
      
      {currentNode && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0A0A0A]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-sm bg-[#1A1A1A] border-white/10"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                  onClick={handleUpdateTitle}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setTempTitle(currentNode.title);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onClick={() => setIsEditingTitle(true)}
              >
                <h2 className="text-sm font-medium text-white truncate max-w-md group-hover:text-primary transition-colors">
                  {currentNode.title}
                </h2>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2 text-white">How can I help you today?</h2>
                <p className="text-sm text-muted-foreground">
                  Send a message to start the conversation
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const showDivider = currentNode?.inheritedMessageCount 
                  ? index === currentNode.inheritedMessageCount - 1 
                  : false;
                
                return (
                  <div key={message.id}>
                    <ChatMessage
                      message={message}
                      onBranch={handleBranch}
                      onBacktrack={handleBacktrack}
                      isLatest={index === messages.length - 1}
                      branches={branchesByMessageId.get(message.id)}
                      onNavigateToBranch={navigateToNode}
                      onUpdateBranchTitle={updateNodeTitle}
                    />
                    {showDivider && parentNode && (
                      <div className="relative py-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-dashed border-white/20"></div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="relative z-10 h-7 gap-2 bg-[#0A0A0A] border border-white/20 text-muted-foreground hover:text-white"
                          onClick={() => parentNode && navigateToNode(parentNode.id)}
                        >
                          <GitBranch className="h-3.5 w-3.5 rotate-180" />
                          <span className="text-xs">Branched from {parentNode.title}</span>
                          <ArrowUpCircle className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {streamingThinking && (
                <div className="group flex gap-4 px-4 py-6 bg-purple-500/5 border-b border-purple-500/10">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Brain className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-purple-400">Thinking</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap break-words text-purple-300/80">
                        {streamingThinking}
                        <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {streamingContent && (
                <div className="group flex gap-4 px-4 py-6 bg-[#0A0A0A]/30 backdrop-blur-md">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] border border-white/[0.08] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Assistant</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5">
                        <div 
                          className="w-3 h-3 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${currentModel.color}20` }}
                        >
                          <currentModel.icon 
                            className="w-2 h-2" 
                            style={{ color: currentModel.color }}
                          />
                        </div>
                        <span className="text-xs text-white/60">{currentModel.name}</span>
                        {currentModel.supportsThinking && currentMode === 'deepThink' && (
                          <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                        )}
                        {currentMode === 'webSearch' && (
                          <Search className="w-2.5 h-2.5 text-blue-500" />
                        )}
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap break-words">
                        {streamingContent}
                        <span className="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-white/[0.08] bg-[#030303]/40 backdrop-blur-md p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-xl border border-[#222] bg-[#0A0A0A] p-3 shadow-none transition-[box-shadow,border-color] focus-within:border-[#555] focus-within:shadow-[0_0_60px_-15px_rgba(255,255,255,0.1)]">
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
              disabled={!apiKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}