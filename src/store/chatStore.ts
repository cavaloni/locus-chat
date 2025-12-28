import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Message, ConversationNode, ChatState } from '../types/conversation';

interface ChatActions {
  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  addMessage: (content: string, role: 'user' | 'assistant') => string;
  branchFromMessage: (messageId: string) => void;
  branchFromNode: (nodeId: string) => void;
  navigateToNode: (nodeId: string) => void;
  navigateToNodeWithOrigin: (nodeId: string, origin: { x: number; y: number }) => void;
  backtrack: (steps: number) => void;
  rollbackNode: (nodeId: string) => void;
  updateNodeTitle: (nodeId: string, title: string) => void;
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  setViewMode: (mode: 'chat' | 'tree') => void;
  setSelectedModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  deleteConversation: (id: string) => void;
  getCurrentMessages: () => Message[];
  getCurrentNode: () => ConversationNode | null;
  getMessagePath: (messageId: string) => Message[];
  setTransitionOrigin: (origin: { x: number; y: number }) => void;
}

const createNewNode = (parentId: string | null = null): ConversationNode => ({
  id: uuidv4(),
  messages: [],
  parentId,
  children: [],
  title: 'New Branch',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const createNewConversation = (): Conversation => {
  const rootNode = createNewNode();
  return {
    id: uuidv4(),
    rootNodeId: rootNode.id,
    nodes: { [rootNode.id]: rootNode },
    currentNodeId: rootNode.id,
    currentMessagePath: [],
    title: 'New Conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,
      isLoading: false,
      error: null,
      viewMode: 'chat',
      selectedModel: 'google/gemini-2.0-flash-001',
      apiKey: '',
      transitionOrigin: { x: 50, y: 50 },

      createConversation: () => {
        const conversation = createNewConversation();
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversation.id]: conversation,
          },
          activeConversationId: conversation.id,
        }));
        return conversation.id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (content, role) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return '';

        const conversation = conversations[activeConversationId];
        const currentNode = conversation.nodes[conversation.currentNodeId];

        const message: Message = {
          id: uuidv4(),
          role,
          content,
          timestamp: Date.now(),
          parentId: currentNode.messages.length > 0 
            ? currentNode.messages[currentNode.messages.length - 1].id 
            : null,
          children: [],
        };

        const updatedMessages = [...currentNode.messages, message];
        const updatedNode = {
          ...currentNode,
          messages: updatedMessages,
          updatedAt: Date.now(),
        };

        const title = role === 'user' && conversation.title === 'New Conversation'
          ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
          : conversation.title;

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              nodes: {
                ...conversation.nodes,
                [currentNode.id]: updatedNode,
              },
              currentMessagePath: updatedMessages.map((m) => m.id),
              title,
              updatedAt: Date.now(),
            },
          },
        }));

        return message.id;
      },

      branchFromMessage: (messageId) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const currentNode = conversation.nodes[conversation.currentNodeId];
        
        const messageIndex = currentNode.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const newNode = createNewNode(currentNode.id);
        newNode.messages = currentNode.messages.slice(0, messageIndex + 1);
        newNode.title = `Branch from: ${newNode.messages[0]?.content.slice(0, 20) || 'message'}...`;
        newNode.inheritedMessageCount = newNode.messages.length;

        const updatedCurrentNode = {
          ...currentNode,
          children: [...currentNode.children, newNode.id],
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              nodes: {
                ...conversation.nodes,
                [currentNode.id]: updatedCurrentNode,
                [newNode.id]: newNode,
              },
              currentNodeId: newNode.id,
              currentMessagePath: newNode.messages.map(m => m.id),
              updatedAt: Date.now(),
            },
          },
        }));
      },

      branchFromNode: (nodeId) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const sourceNode = conversation.nodes[nodeId];
        if (!sourceNode) return;

        const newNode = createNewNode(sourceNode.id);
        newNode.messages = [...sourceNode.messages];
        newNode.title = `Branch from: ${sourceNode.title}`;
        newNode.inheritedMessageCount = newNode.messages.length;

        const updatedSourceNode = {
          ...sourceNode,
          children: [...sourceNode.children, newNode.id],
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              nodes: {
                ...conversation.nodes,
                [sourceNode.id]: updatedSourceNode,
                [newNode.id]: newNode,
              },
              currentNodeId: newNode.id,
              currentMessagePath: newNode.messages.map((m) => m.id),
              updatedAt: Date.now(),
            },
          },
        }));
      },

      navigateToNode: (nodeId) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const node = conversation.nodes[nodeId];
        if (!node) return;

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              currentNodeId: nodeId,
              currentMessagePath: node.messages.map((m) => m.id),
            },
          },
        }));
      },

      navigateToNodeWithOrigin: (nodeId, origin) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const node = conversation.nodes[nodeId];
        if (!node) return;

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              currentNodeId: nodeId,
              currentMessagePath: node.messages.map((m) => m.id),
            },
          },
          transitionOrigin: origin,
        }));
      },

      setTransitionOrigin: (origin) => {
        set({ transitionOrigin: origin });
      },

      backtrack: (steps) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const currentNode = conversation.nodes[conversation.currentNodeId];
        
        if (currentNode.messages.length > steps) {
          const newMessages = currentNode.messages.slice(0, -steps);
          const updatedNode = {
            ...currentNode,
            messages: newMessages,
            updatedAt: Date.now(),
          };

          set((state) => ({
            conversations: {
              ...state.conversations,
              [activeConversationId]: {
                ...conversation,
                nodes: {
                  ...conversation.nodes,
                  [currentNode.id]: updatedNode,
                },
                currentMessagePath: newMessages.map(m => m.id),
                updatedAt: Date.now(),
              },
            },
          }));
        } else if (currentNode.parentId) {
          get().navigateToNode(currentNode.parentId);
        }
      },

      rollbackNode: (nodeId) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const node = conversation.nodes[nodeId];
        if (!node) return;
        if (node.messages.length === 0) return;

        const last = node.messages[node.messages.length - 1];
        const prev = node.messages[node.messages.length - 2];
        const steps = last?.role === 'assistant' && prev?.role === 'user' ? 2 : 1;

        const newMessages = node.messages.slice(0, Math.max(0, node.messages.length - steps));
        const updatedNode = {
          ...node,
          messages: newMessages,
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              nodes: {
                ...conversation.nodes,
                [nodeId]: updatedNode,
              },
              currentMessagePath:
                conversation.currentNodeId === nodeId
                  ? newMessages.map((m) => m.id)
                  : conversation.currentMessagePath,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      updateNodeTitle: (nodeId, title) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const node = conversation.nodes[nodeId];
        if (!node) return;

        const updatedNode = {
          ...node,
          title,
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              nodes: {
                ...conversation.nodes,
                [nodeId]: updatedNode,
              },
              updatedAt: Date.now(),
            },
          },
        }));
      },

      setNodePosition: (nodeId, position) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        const node = conversation.nodes[nodeId];
        if (!node) return;

        const updatedNode = {
          ...node,
          position,
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...conversation,
              nodes: {
                ...conversation.nodes,
                [nodeId]: updatedNode,
              },
              updatedAt: Date.now(),
            },
          },
        }));
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setApiKey: (key) => set({ apiKey: key }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      deleteConversation: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.conversations;
          return {
            conversations: rest,
            activeConversationId: state.activeConversationId === id 
              ? Object.keys(rest)[0] || null 
              : state.activeConversationId,
          };
        });
      },

      getCurrentMessages: () => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return [];

        const conversation = conversations[activeConversationId];
        const currentNode = conversation.nodes[conversation.currentNodeId];

        return currentNode?.messages ?? [];
      },

      getCurrentNode: () => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return null;

        const conversation = conversations[activeConversationId];
        return conversation.nodes[conversation.currentNodeId] ?? null;
      },

      getMessagePath: (messageId) => {
        const messages = get().getCurrentMessages();
        const index = messages.findIndex(m => m.id === messageId);
        return index >= 0 ? messages.slice(0, index + 1) : [];
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        selectedModel: state.selectedModel,
        apiKey: state.apiKey,
      }),
    }
  )
);
