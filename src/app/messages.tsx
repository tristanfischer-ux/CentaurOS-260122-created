/**
 * Messages Screen
 * Full-featured in-app messaging with conversations list and chat view
 */

import { View, Text, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MessageSquare, Users as UsersIcon, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMessagesStore, initializeDemoMessages } from '@/lib/state/messages-store';
import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { HapticPressable } from '@/components/HapticPressable';
import { useCurrentUser } from '@/lib/state/app-store';
import { format, isToday, isYesterday } from 'date-fns';

// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const [view, setView] = useState<'list' | 'chat'>('list');

  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    addMessage,
    getUnreadCount,
  } = useMessagesStore();

  // Initialize demo messages on mount
  useEffect(() => {
    if (conversations.length === 0) {
      initializeDemoMessages();
    }
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConversation);
  const activeMessages = activeConversation ? messages[activeConversation] || [] : [];

  const handleSendMessage = (content: string, attachments?: any[]) => {
    if (!activeConversation || !currentUser) return;

    const newMessage = {
      id: Date.now().toString(),
      conversationId: activeConversation,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'FractionalExec' as const,
      content,
      timestamp: new Date(),
      read: false,
      attachments: attachments?.map((att, idx) => ({
        id: `${Date.now()}-${idx}`,
        name: att.name || 'Attachment',
        type: att.type || att.mimeType || 'application/octet-stream',
        url: att.uri,
        size: att.size || 0,
      })),
    };

    addMessage(newMessage);
  };

  const formatLastMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Conversations List View
  if (view === 'list') {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-700">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <HapticPressable
                onPress={() => router.back()}
                className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
              >
                <ArrowLeft size={20} color="#64748b" />
              </HapticPressable>
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">Messages</Text>
            </View>

            {getUnreadCount(DEFAULT_WORKSPACE_ID) > 0 && (
              <View className="bg-blue-500 px-3 py-1 rounded-full">
                <Text className="text-white font-bold text-sm">{getUnreadCount(DEFAULT_WORKSPACE_ID)}</Text>
              </View>
            )}
          </View>

          {/* Search (placeholder) */}
          <Pressable className="flex-row items-center bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3">
            <Search size={20} color="#94a3b8" />
            <Text className="text-gray-500 dark:text-slate-400 ml-3">Search conversations...</Text>
          </Pressable>
        </View>

        {/* Conversations List */}
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HapticPressable
              onPress={() => {
                setActiveConversation(item.id);
                setView('chat');
              }}
              className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-900"
            >
              <View className="flex-row items-center">
                {/* Avatar */}
                <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-3">
                  {item.type === 'group' ? (
                    <UsersIcon size={20} color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      {item.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  )}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      {item.name}
                    </Text>
                    {item.lastMessage && (
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                        {formatLastMessageTime(item.lastMessage.timestamp)}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-gray-600 dark:text-slate-400 text-sm flex-1"
                      numberOfLines={1}
                    >
                      {item.isTyping.length > 0
                        ? 'Typing...'
                        : item.lastMessage?.content || 'No messages yet'}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View className="bg-blue-500 w-5 h-5 rounded-full items-center justify-center ml-2">
                        <Text className="text-white font-bold text-xs">
                          {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </HapticPressable>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <MessageSquare size={48} color="#94a3b8" />
              <Text className="text-gray-900 dark:text-white text-xl font-bold mt-4">
                No conversations yet
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-center mt-2 px-8">
                Start a conversation with your team members
              </Text>
            </View>
          }
        />

        {/* New Message FAB */}
        <HapticPressable
          onPress={() => {/* TODO: Open new conversation modal */}}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg active:opacity-80"
          style={{ marginBottom: insets.bottom }}
        >
          <MessageSquare size={24} color="#fff" />
        </HapticPressable>
      </View>
    );
  }

  // Chat View
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-slate-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {/* Chat Header */}
      <View
        className="px-6 py-4 border-b border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center">
          <HapticPressable
            onPress={() => {
              setActiveConversation(null);
              setView('list');
            }}
            className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
          >
            <ArrowLeft size={20} color="#64748b" />
          </HapticPressable>

          {activeConv && (
            <>
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                {activeConv.type === 'group' ? (
                  <UsersIcon size={20} color="#fff" />
                ) : (
                  <Text className="text-white font-bold">
                    {activeConv.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold text-base">
                  {activeConv.name}
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  {activeConv.type === 'group'
                    ? `${activeConv.participants.length} members`
                    : activeConv.participants[0]?.role}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={activeMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwnMessage={item.senderId === currentUser?.id}
            showSender={activeConv?.type === 'group'}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        inverted={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <MessageSquare size={48} color="#94a3b8" />
            <Text className="text-gray-600 dark:text-slate-400 text-center mt-4">
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        placeholder="Type a message..."
      />
    </KeyboardAvoidingView>
  );
}
