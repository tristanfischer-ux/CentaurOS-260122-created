import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, CheckCircle2, X } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { CopilotService } from '@/lib/copilot';
import type { CopilotMessage, ProposedAction } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export default function CopilotScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      role: 'system',
      content: "Hi! I'm your Centaur OS Copilot. I can help you:\n\n• Summarize the state of your business\n• Propose next actions\n• Generate weekly pack narratives\n• Identify risks and blockers\n\nTry asking: \"What's the state of the business?\" or \"What should I focus on next?\"",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const copilotRef = useRef<CopilotService | null>(null);

  useEffect(() => {
    if (currentWorkspace && currentMembership && currentUser) {
      copilotRef.current = new CopilotService({
        workspaceId: currentWorkspace.id,
        userId: currentUser.id,
        role: currentMembership.role,
      });
    }
  }, [currentWorkspace, currentMembership, currentUser]);

  const handleSend = async () => {
    if (!inputText.trim() || !copilotRef.current || isProcessing) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await copilotRef.current.sendMessage(inputText.trim());
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Copilot error:', error);
      const errorMessage: CopilotMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAction = async (action: ProposedAction) => {
    if (!copilotRef.current || !currentWorkspace || !currentUser || !currentMembership) return;

    try {
      await copilotRef.current.approveAction(
        action.id,
        currentWorkspace.id,
        currentUser.id,
        currentMembership.role
      );

      // Update the action status in messages
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          proposedActions: msg.proposedActions?.map((a) =>
            a.id === action.id ? { ...a, status: 'approved' as const } : a
          ),
        }))
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks', currentWorkspace.id] });

      // Add confirmation message
      const confirmationMessage: CopilotMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Action approved! I've created the task "${action.payload.title}".`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmationMessage]);
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  const handleRejectAction = (action: ProposedAction) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        proposedActions: msg.proposedActions?.map((a) =>
          a.id === action.id ? { ...a, status: 'rejected' as const } : a
        ),
      }))
    );
  };

  const quickPrompts = [
    "What's the state of the business?",
    "What should I focus on next?",
    "What are the biggest risks?",
    "Generate weekly pack narrative",
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className="p-6 pb-4 border-b border-slate-800">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl items-center justify-center">
            <Bot size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">AI Copilot</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="w-2 h-2 bg-green-500 rounded-full" />
              <Text className="text-slate-400 text-sm">Stub Mode</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View className="py-6 gap-4">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isSystem = message.role === 'system';

            return (
              <View key={message.id} className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <View
                    className={`rounded-2xl p-4 ${
                      isUser
                        ? 'bg-blue-500'
                        : isSystem
                          ? 'bg-slate-800 border border-slate-700'
                          : 'bg-slate-800'
                    }`}
                  >
                    <Text className={`text-base ${isUser || isSystem ? 'text-white' : 'text-slate-100'}`}>
                      {message.content}
                    </Text>
                  </View>

                  {/* Proposed Actions */}
                  {message.proposedActions && message.proposedActions.length > 0 && (
                    <View className="mt-3 gap-2 w-full">
                      {message.proposedActions.map((action) => (
                        <View
                          key={action.id}
                          className="bg-slate-800 border border-blue-500/30 rounded-xl p-3"
                        >
                          <View className="flex-row items-start gap-2 mb-2">
                            <Sparkles size={16} color="#3b82f6" />
                            <Text className="text-white font-medium flex-1">{action.description}</Text>
                          </View>

                          {action.status === 'pending' && (
                            <View className="flex-row gap-2 mt-2">
                              <Pressable
                                onPress={() => handleApproveAction(action)}
                                className="flex-1 bg-green-500 rounded-lg py-2 items-center active:opacity-80"
                              >
                                <Text className="text-white text-sm font-semibold">Approve</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleRejectAction(action)}
                                className="flex-1 bg-slate-700 rounded-lg py-2 items-center active:opacity-80"
                              >
                                <Text className="text-slate-400 text-sm font-semibold">Reject</Text>
                              </Pressable>
                            </View>
                          )}

                          {action.status === 'approved' && (
                            <View className="flex-row items-center gap-1 mt-2">
                              <CheckCircle2 size={14} color="#10b981" />
                              <Text className="text-green-400 text-xs">Approved</Text>
                            </View>
                          )}

                          {action.status === 'rejected' && (
                            <View className="flex-row items-center gap-1 mt-2">
                              <X size={14} color="#64748b" />
                              <Text className="text-slate-400 text-xs">Rejected</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  <Text className="text-slate-500 text-xs mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          })}

          {isProcessing && (
            <View className="flex-row justify-start">
              <View className="bg-slate-800 rounded-2xl p-4">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <View className="px-6 pb-4">
          <Text className="text-slate-400 text-xs mb-2">Quick prompts:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {quickPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => setInputText(prompt)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 active:opacity-70"
                >
                  <Text className="text-slate-300 text-sm">{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View className="p-6 pt-4 border-t border-slate-800">
        <View className="flex-row items-center gap-3 bg-slate-900 rounded-2xl px-4 py-3">
          <TextInput
            className="flex-1 text-white text-base"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor="#64748b"
            multiline
            maxLength={500}
            editable={!isProcessing}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className={`w-10 h-10 rounded-xl items-center justify-center ${
              inputText.trim() && !isProcessing ? 'bg-blue-500' : 'bg-slate-800'
            } active:opacity-80`}
          >
            <Send size={20} color={inputText.trim() && !isProcessing ? 'white' : '#64748b'} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
