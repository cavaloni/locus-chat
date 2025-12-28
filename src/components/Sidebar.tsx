import { Plus, MessageSquare, Trash2, Settings, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';
import type { Conversation } from '@/types/conversation';

interface SidebarProps {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    viewMode,
    createConversation,
    setActiveConversation,
    deleteConversation,
    setViewMode,
    setTransitionOrigin,
  } = useChatStore();

  const sortedConversations = Object.values(conversations).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  const handleNewChat = () => {
    createConversation();
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv.id);
    setViewMode('chat');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/[0.08] bg-[#0A0A0A]/40 backdrop-blur-md">
      <div className="flex items-center gap-2 p-3 border-b border-white/[0.08]">
        <Button
          onClick={handleNewChat}
          className="flex-1 justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Locus
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => {
                // Set transition origin from the sidebar button area
                setTransitionOrigin({ x: 15, y: 50 }); // Left side of screen
                setViewMode(viewMode === 'tree' ? 'chat' : 'tree');
              }}
            >
              <Network className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {viewMode === 'tree' ? 'Exit tree view' : 'View conversation tree'}
          </TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No conversations yet
            </p>
          ) : (
            sortedConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                  activeConversationId === conv.id
                    ? 'bg-white/[0.06] text-white'
                    : 'text-[#888] hover:bg-white/[0.04] hover:text-white'
                )}
                onClick={() => handleSelectConversation(conv)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-white/[0.08] p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
