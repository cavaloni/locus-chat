import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MessageSquare, GitBranch, RotateCcw, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Conversation } from '@/types/conversation';
import type { Node, Edge } from 'reactflow';

interface TreeNodeData {
  nodeId: string;
  title: string;
  messageCount: number;
  preview: string;
  isActive: boolean;
  isBranch: boolean;
  onBranch: (nodeId: string) => void;
  onRollback: (nodeId: string) => void;
  onUpdateTitle: (nodeId: string, title: string) => void;
}

function CustomNode({ data }: { data: TreeNodeData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (title.trim()) {
      data.onUpdateTitle(data.nodeId, title.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTitle(data.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      if (title.trim()) {
        data.onUpdateTitle(data.nodeId, title.trim());
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsEditing(false);
      setTitle(data.title);
    }
  };

  // Sync title from props if it changes externally
  useEffect(() => {
    setTitle(data.title);
  }, [data.title]);

  return (
    <div
      className={cn(
        'group px-4 py-3 rounded-xl border border-white/[0.08] shadow-none min-w-[200px] max-w-[280px] bg-[#0A0A0A]/60 backdrop-blur-md transition-colors',
        data.isActive
          ? 'border-white/[0.16]'
          : 'hover:border-white/[0.16]'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2 mb-2 min-h-[28px]">
        {data.isBranch ? (
          <GitBranch className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-6 text-xs bg-[#1A1A1A] border-white/10 px-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={handleSave}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={handleCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
             <span className="font-medium text-sm truncate flex-1 text-white block" title={data.title}>{data.title}</span>
             <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-white" />
              </Button>
          </div>
        )}
        
        {!isEditing && (
          <span className="text-xs text-[#888] bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
            {data.messageCount}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{data.preview}</p>
      <div className="mt-2 flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            data.onBranch(data.nodeId);
          }}
        >
          <GitBranch className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            data.onRollback(data.nodeId);
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

function buildTreeFromConversation(
  conversation: Conversation,
  currentNodeId: string,
  actions: { 
    onBranch: (nodeId: string) => void; 
    onRollback: (nodeId: string) => void;
    onUpdateTitle: (nodeId: string, title: string) => void;
  }
): { nodes: Node<TreeNodeData>[]; edges: Edge[] } {
  const nodes: Node<TreeNodeData>[] = [];
  const edges: Edge[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();

  const calculatePositions = (
    nodeId: string,
    depth: number,
    horizontalIndex: number,
    totalSiblings: number
  ): number => {
    const node = conversation.nodes[nodeId];
    if (!node) return horizontalIndex;

    const horizontalSpacing = 320;
    const verticalSpacing = 150;

    const x = (horizontalIndex - totalSiblings / 2) * horizontalSpacing;
    const y = depth * verticalSpacing;

    nodePositions.set(nodeId, { x, y });

    let currentIndex = horizontalIndex;
    for (const childId of node.children) {
      currentIndex = calculatePositions(
        childId,
        depth + 1,
        currentIndex,
        node.children.length
      );
      currentIndex++;
    }

    return currentIndex;
  };

  const rootNode = conversation.nodes[conversation.rootNodeId];
  if (rootNode) {
    calculatePositions(conversation.rootNodeId, 0, 0, 1);
  }

  for (const [nodeId, node] of Object.entries(conversation.nodes)) {
    const computedPosition = nodePositions.get(nodeId) || { x: 0, y: 0 };
    const position = node.position ?? computedPosition;
    const lastMessage = node.messages[node.messages.length - 1];

    nodes.push({
      id: nodeId,
      type: 'custom',
      position,
      data: {
        nodeId,
        title: node.parentId ? node.title : conversation.title,
        messageCount: node.messages.length,
        preview: lastMessage?.content.slice(0, 80) || 'Empty branch',
        isActive: nodeId === currentNodeId,
        isBranch: !!node.parentId,
        onBranch: actions.onBranch,
        onRollback: actions.onRollback,
        onUpdateTitle: actions.onUpdateTitle,
      },
    });

    if (node.parentId) {
      edges.push({
        id: `${node.parentId}-${nodeId}`,
        source: node.parentId,
        target: nodeId,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        animated: nodeId === currentNodeId,
      });
    }
  }

  return { nodes, edges };
}

export function ConversationTree() {
  const {
    conversations,
    activeConversationId,
    navigateToNodeWithOrigin,
    setViewMode,
    setNodePosition,
    branchFromNode,
    rollbackNode,
    updateNodeTitle,
  } = useChatStore();

  const conversation = activeConversationId
    ? conversations[activeConversationId]
    : null;

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!conversation) {
      return { nodes: [], edges: [] };
    }
    return buildTreeFromConversation(conversation, conversation.currentNodeId, {
      onBranch: (nodeId) => {
        branchFromNode(nodeId);
        setViewMode('chat');
      },
      onRollback: (nodeId) => {
        rollbackNode(nodeId);
      },
      onUpdateTitle: (nodeId, title) => {
        updateNodeTitle(nodeId, title);
      },
    });
  }, [conversation, branchFromNode, rollbackNode, setViewMode, updateNodeTitle]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<TreeNodeData>) => {
      // Calculate click position as percentage of viewport
      const origin = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };
      
      navigateToNodeWithOrigin(node.data.nodeId, origin);
      setViewMode('chat');
    },
    [navigateToNodeWithOrigin, setViewMode]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node<TreeNodeData>) => {
      setNodePosition(node.id, node.position);
    },
    [setNodePosition]
  );

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-white">No Conversation Selected</h3>
          <p className="text-muted-foreground text-sm">
            Select or create a conversation to view its tree structure
          </p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-white">Empty Conversation</h3>
          <p className="text-muted-foreground text-sm">
            Start chatting to build your conversation tree
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255, 255, 255, 0.4)" />
        <Controls />
        <MiniMap
          nodeColor={(node) =>
            node.data.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
          }
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
