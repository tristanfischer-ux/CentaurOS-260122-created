/**
 * Brainstorm Conversation Modal
 * Chat-like interface for AI brainstorming conversation
 */

import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader, Sparkles, CheckCircle2 } from 'lucide-react-native';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BrainstormConversationModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  initialMessage?: string;
  onSynthesize: () => void;
}

export function BrainstormConversationModal({
  visible,
  onClose,
  sessionId,
  initialMessage,
  onSynthesize,
}: BrainstormConversationModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Add initial message when modal opens
  useEffect(() => {
    if (visible && initialMessage && messages.length === 0) {
      setMessages([{ role: 'user', content: initialMessage }]);
      // Trigger first AI response
      handleSendMessage(initialMessage, true);
    }
  }, [visible, initialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async (messageText?: string, isInitial = false) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Add user message if not initial
    if (!isInitial) {
      setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    }
    setInput('');
    setIsLoading(true);

    try {
      // Call the turn API
      const response = await fetch('/api/why/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage: textToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[BrainstormConversation] AI response:', data);

      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: data.assistantMessage }]);
    } catch (error) {
      console.error('[BrainstormConversation] Failed to send message:', error);
      // Show error message
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <View className="bg-purple-600 px-6 py-4 border-b border-purple-700">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold text-xl">Brainstorming</Text>
              <Text className="text-purple-200 text-sm">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Pressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
              <X size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <View
              key={index}
              className={`mb-3 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-500'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {message.role === 'assistant' && (
                  <View className="flex-row items-center gap-2 mb-1">
                    <Sparkles size={14} color="#8b5cf6" />
                    <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
                      AI Assistant
                    </Text>
                  </View>
                )}
                <Text
                  className={`text-base leading-relaxed ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <View className="items-start mb-3">
              <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex-row items-center gap-2">
                <Loader size={16} color="#8b5cf6" />
                <Text className="text-slate-600 dark:text-slate-400 text-sm">
                  Thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
          {/* Synthesize Button */}
          {messages.length >= 4 && !isLoading && (
            <Pressable
              onPress={onSynthesize}
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 mb-3 flex-row items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} color="#8b5cf6" />
              <Text className="text-purple-700 dark:text-purple-300 font-semibold">
                Generate Objectives & Tasks
              </Text>
            </Pressable>
          )}

          {/* Message Input */}
          <View className="flex-row items-end gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your response..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={500}
              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white max-h-[100px]"
              editable={!isLoading}
            />
            <Pressable
              onPress={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="bg-purple-500 p-3 rounded-full"
              style={{ opacity: input.trim() && !isLoading ? 1 : 0.5 }}
            >
              <Send size={20} color="white" />
            </Pressable>
          </View>

          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2 text-center">
            Answer the questions to help define your objectives
          </Text>
        </View>
      </View>
    </Modal>
  );
}
