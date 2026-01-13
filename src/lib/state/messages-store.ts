/**
 * Messages Store
 * State management for in-app messaging system
 */

import { create } from 'zustand';

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
  getUnreadCount: () => number;
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

  getUnreadCount: () => {
    const state = get();
    return state.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  },
}));

// Demo data for testing
export const initializeDemoMessages = () => {
  const store = useMessagesStore.getState();

  // Create demo conversations
  store.createConversation({
    type: 'direct',
    name: 'Sarah Johnson',
    participants: [
      { id: 'user1', name: 'Sarah Johnson', role: 'Founder' },
      { id: 'user2', name: 'You', role: 'FractionalExec' },
    ],
  });

  store.createConversation({
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
