/**
 * Messages Store
 * State management for in-app messaging system
 *
 * DATA SEPARATION:
 * - conversations = COMPANY DATA (each conversation has workspaceId)
 * - messages = COMPANY DATA (linked to conversations which have workspaceId)
 */

import { create } from 'zustand';

// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Founder' | 'FractionalExec' | 'Apprentice';
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }[];
}

export interface Conversation {
  id: string;
  workspaceId: string; // 🔑 Multi-tenancy key - links conversation to specific company
  type: 'direct' | 'group';
  name: string;
  participants: {
    id: string;
    name: string;
    role: 'Founder' | 'FractionalExec' | 'Apprentice';
    avatar?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  isTyping: string[]; // User IDs currently typing
  createdAt: Date;
  updatedAt: Date;
}

interface MessagesStore {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  activeConversation: string | null;
  isTyping: boolean;

  // Actions
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  markAsRead: (conversationId: string) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  createConversation: (conversation: Omit<Conversation, 'id' | 'unreadCount' | 'isTyping' | 'createdAt' | 'updatedAt'>) => void;
  getUnreadCount: (workspaceId: string) => number;

  // Multi-tenancy methods
  getConversationsByWorkspace: (workspaceId: string) => Conversation[];
  getAllConversations: () => Conversation[]; // For government users
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversation: null,
  isTyping: false,

  setActiveConversation: (id) => {
    set({ activeConversation: id });
    if (id) {
      get().markAsRead(id);
    }
  },

  addMessage: (message) => {
    const conversationId = message.conversationId;

    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const updatedMessages = {
        ...state.messages,
        [conversationId]: [...existingMessages, message],
      };

      const conversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: state.activeConversation === conversationId ? 0 : conv.unreadCount + 1,
            updatedAt: message.timestamp,
          };
        }
        return conv;
      });

      return {
        messages: updatedMessages,
        conversations,
      };
    });
  },

  markAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) => ({
          ...msg,
          read: true,
        })),
      },
    }));
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          const typingUsers = isTyping
            ? [...conv.isTyping, userId]
            : conv.isTyping.filter((id) => id !== userId);
          return { ...conv, isTyping: typingUsers };
        }
        return conv;
      }),
    }));
  },

  createConversation: (conversation) => {
    const newConversation: Conversation = {
      ...conversation,
      id: Date.now().toString(),
      unreadCount: 0,
      isTyping: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
    }));
  },

  // Get unread count for a specific workspace
  getUnreadCount: (workspaceId) => {
    const state = get();
    return state.conversations
      .filter((conv) => conv.workspaceId === workspaceId)
      .reduce((total, conv) => total + conv.unreadCount, 0);
  },

  // Get conversations for a specific workspace
  getConversationsByWorkspace: (workspaceId) => {
    return get().conversations.filter((conv) => conv.workspaceId === workspaceId);
  },

  // Get all conversations (for government users)
  getAllConversations: () => {
    return get().conversations;
  },
}));

// Selector hooks for efficient access
export const useConversationsByWorkspace = (workspaceId: string) =>
  useMessagesStore((s) => s.conversations.filter((c) => c.workspaceId === workspaceId));
export const useActiveConversation = () => useMessagesStore((s) => s.activeConversation);

// Demo data for testing
export const initializeDemoMessages = (workspaceId: string = DEFAULT_WORKSPACE_ID) => {
  const store = useMessagesStore.getState();

  // Create demo conversations with workspaceId
  store.createConversation({
    workspaceId,
    type: 'direct',
    name: 'Sarah Johnson',
    participants: [
      { id: 'user1', name: 'Sarah Johnson', role: 'Founder' },
      { id: 'user2', name: 'You', role: 'FractionalExec' },
    ],
  });

  store.createConversation({
    workspaceId,
    type: 'group',
    name: 'Marketing Team',
    participants: [
      { id: 'user1', name: 'Sarah Johnson', role: 'Founder' },
      { id: 'user2', name: 'Priya Sharma', role: 'FractionalExec' },
      { id: 'user3', name: 'Emily Carter', role: 'Apprentice' },
      { id: 'user4', name: 'David Kim', role: 'Apprentice' },
    ],
  });

  // Add demo messages
  const conv1Id = store.conversations[0]?.id;
  if (conv1Id) {
    store.addMessage({
      id: '1',
      conversationId: conv1Id,
      senderId: 'user1',
      senderName: 'Sarah Johnson',
      senderRole: 'Founder',
      content: 'Hi! Can you review the Q1 OKRs for Marketing?',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    });

    store.addMessage({
      id: '2',
      conversationId: conv1Id,
      senderId: 'user2',
      senderName: 'You',
      senderRole: 'FractionalExec',
      content: 'Absolutely! I\'ll review them this afternoon and provide feedback.',
      timestamp: new Date(Date.now() - 1800000),
      read: true,
    });
  }
};
