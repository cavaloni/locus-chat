import { useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import type { ConversationNode } from '@/types/conversation';

interface MapNode {
  id: string;
  isCurrent: boolean;
  isAncestor: boolean;
  hasSiblings: boolean;
  siblingCount: number;
  title: string;
  childrenCount: number;
  x: number;
  y: number;
  depth: number;
  children: MapNode[];
}

export function ConversationMiniMap() {
  const { activeConversationId, conversations, navigateToNode } = useChatStore();
  const conversation = activeConversationId ? conversations[activeConversationId] : null;
  const currentNodeId = conversation?.currentNodeId;

  const treeData = useMemo(() => {
    if (!conversation || !currentNodeId) return { nodes: null, pathIds: null };

    // First, identify the active path from root to current
    const pathIds = new Set<string>();
    let currId: string | null = currentNodeId;
    while (currId) {
      pathIds.add(currId);
      const node: ConversationNode = conversation.nodes[currId];
      if (!node) break;
      currId = node.parentId;
    }

    const horizontalSpacing = 24;
    const verticalSpacing = 32;
    
    // Build tree structure with positions
    const buildTree = (nodeId: string, depth: number = 0, horizontalIndex: number = 0, parentX: number = 0): MapNode => {
      const node: ConversationNode = conversation.nodes[nodeId];
      if (!node) return null as any;
      
      const x = parentX + (horizontalIndex * horizontalSpacing);
      const y = depth * verticalSpacing;
      
      const isCurrent = nodeId === currentNodeId;
      const isAncestor = pathIds.has(nodeId) && !isCurrent;
      
      let siblingCount = 0;
      if (node.parentId) {
        const parent = conversation.nodes[node.parentId];
        siblingCount = Math.max(0, (parent?.children.length || 0) - 1);
      }
      
      const children: MapNode[] = [];
      node.children.forEach((childId, index) => {
        const childNode = buildTree(childId, depth + 1, index - (node.children.length - 1) / 2, x);
        if (childNode) {
          children.push(childNode);
        }
      });
      
      return {
        id: nodeId,
        isCurrent,
        isAncestor,
        hasSiblings: siblingCount > 0,
        siblingCount,
        title: node.title,
        childrenCount: node.children.length,
        x,
        y,
        depth,
        children
      };
    };
    
    const rootId = conversation.rootNodeId;
    const tree = buildTree(rootId);
    
    // Flatten tree for rendering while maintaining positions
    const flattenTree = (node: MapNode, nodes: MapNode[] = []): MapNode[] => {
      nodes.push(node);
      node.children.forEach(child => flattenTree(child, nodes));
      return nodes;
    };
    
    const nodes = flattenTree(tree).sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.x - b.x;
    });
    
    return { nodes, pathIds };
  }, [conversation, currentNodeId]);
  
  const { nodes: mapData, pathIds } = treeData;

  if (!mapData || !pathIds || mapData.length === 0) return null;

  // Calculate canvas bounds
  const minX = Math.min(...mapData.map((n: MapNode) => n.x));
  const maxX = Math.max(...mapData.map((n: MapNode) => n.x));
  const minY = Math.min(...mapData.map((n: MapNode) => n.y));
  const maxY = Math.max(...mapData.map((n: MapNode) => n.y));
  
  const canvasWidth = maxX - minX + 100;
  const canvasHeight = maxY - minY + 100;
  
  // Build connections map for drawing lines
  const connections = new Map<string, string[]>();
  mapData.forEach((node: MapNode) => {
    node.children.forEach((child: MapNode) => {
      if (!connections.has(node.id)) {
        connections.set(node.id, []);
      }
      connections.get(node.id)!.push(child.id);
    });
  });

  return (
    <div className="absolute top-16 right-4 z-50 flex flex-col items-end gap-1 pointer-events-none">
      <div className="bg-[#0A0A0A]/90 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] shadow-xl pointer-events-auto min-w-[300px] min-h-[200px] animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="relative overflow-hidden" style={{ width: '100%', height: '200px' }}>
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Draw connection lines */}
            {mapData.map((node: MapNode) => {
              const parentX = node.x - minX + 50;
              const parentY = node.y - minY + 50;
              const children = connections.get(node.id) || [];
              
              return children.map(childId => {
                const child = mapData.find((n: MapNode) => n.id === childId);
                if (!child) return null;
                const childX = child.x - minX + 50;
                const childY = child.y - minY + 50;
                
                return (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={parentX}
                    y1={parentY}
                    x2={childX}
                    y2={childY}
                    stroke={pathIds.has(childId) ? "hsl(var(--primary))" : "rgba(255,255,255,0.1)"}
                    strokeWidth="1"
                  />
                );
              });
            })}
            
            {/* Draw nodes */}
            {mapData.map((node: MapNode) => {
              const x = node.x - minX + 50;
              const y = node.y - minY + 50;
              const isActive = node.isCurrent || node.isAncestor;
              
              return (
                <g key={node.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={node.isCurrent ? "4" : "3"}
                    fill={node.isCurrent ? "hsl(var(--primary))" : isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}
                    stroke={node.isCurrent ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)"}
                    strokeWidth="1"
                    className="cursor-pointer transition-all hover:r-5"
                    onClick={() => navigateToNode(node.id)}
                  />
                  {node.isCurrent && (
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/60"></div>
            <span>Path</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <span>Branches</span>
          </div>
        </div>
      </div>
    </div>
  );
}