import { useState } from 'react';
import { GitBranch, RotateCcw, User, Bot, Copy, Check, ChevronRight, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/conversation';

interface ChatMessageProps {
  message: Message;
  onBranch: (messageId: string) => void;
  onBacktrack: (messageId: string) => void;
  isLatest: boolean;
  branches?: { id: string; title: string }[];
  onNavigateToBranch?: (nodeId: string) => void;
  onUpdateBranchTitle?: (nodeId: string, title: string) => void;
}

function BranchItem({
  branch,
  onNavigate,
  onUpdateTitle
}: {
  branch: { id: string; title: string };
  onNavigate?: (id: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(branch.title);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (title.trim()) {
      onUpdateTitle?.(branch.id, title.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTitle(branch.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      if (title.trim()) {
         onUpdateTitle?.(branch.id, title.trim());
         setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsEditing(false);
      setTitle(branch.title);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md">
        <Input
           value={title}
           onChange={e => setTitle(e.target.value)}
           onKeyDown={handleKeyDown}
           onClick={e => e.stopPropagation()}
           className="h-6 text-xs bg-[#0A0A0A] border-white/10"
           autoFocus
        />
        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={handleSave}>
           <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={handleCancel}>
           <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
     <div className="group flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-white/5 text-white/80 hover:text-white transition-colors">
       <button
         className="flex-1 flex items-center gap-2 min-w-0 text-left"
         onClick={() => onNavigate?.(branch.id)}
       >
         <GitBranch className="h-3.5 w-3.5 shrink-0 opacity-50" />
         <span className="truncate">{branch.title}</span>
       </button>
       <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
         {onUpdateTitle && (
           <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
           >
             <Pencil className="h-3 w-3 text-muted-foreground hover:text-white" />
           </Button>
         )}
         <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onNavigate?.(branch.id)}
         >
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
         </Button>
       </div>
     </div>
  )
}

export function ChatMessage({
  message,
  onBranch,
  onBacktrack,
  isLatest,
  branches,
  onNavigateToBranch,
  onUpdateBranchTitle
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'group flex gap-4 px-4 py-6 relative',
        isUser ? 'bg-transparent' : 'bg-[#0A0A0A]/30 backdrop-blur-md'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-[#0A0A0A] border border-white/[0.08] text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-white/80" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy message</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onBranch(message.id)}
              >
                <GitBranch className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Branch from here</TooltipContent>
          </Tooltip>

          {!isLatest && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onBacktrack(message.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Backtrack to here</TooltipContent>
            </Tooltip>
          )}

          {branches && branches.length > 0 && (
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>{branches.length}</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>View alternative branches</TooltipContent>
              </Tooltip>

              <PopoverContent className="w-64 p-1 rounded-lg border border-white/10 bg-[#1A1A1A] shadow-xl" align="start">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 mb-1">
                  Alternative Paths
                </div>
                <div className="space-y-0.5">
                  {branches.map((branch) => (
                    <BranchItem 
                      key={branch.id} 
                      branch={branch} 
                      onNavigate={onNavigateToBranch}
                      onUpdateTitle={onUpdateBranchTitle}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}