/**
 * Collapsible Task Creator
 * Drawer component for creating tasks via voice or text input
 */

import { View, Text, Pressable, TextInput, Dimensions } from 'react-native';
import { useState } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Plus, Mic, Type, Lightbulb } from 'lucide-react-native';
import { VoiceInputButton } from './VoiceInputButton';

interface CollapsibleTaskCreatorProps {
  onVoiceTranscript: (transcript: string) => void;
  onTextSubmit: (text: string) => void;
  pendingDraftsCount?: number;
}

type InputMode = 'voice' | 'text' | null;

export function CollapsibleTaskCreator({
  onVoiceTranscript,
  onTextSubmit,
  pendingDraftsCount = 0,
}: CollapsibleTaskCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [textInput, setTextInput] = useState('');

  const screenHeight = Dimensions.get('window').height;

  // Calculate heights
  const COLLAPSED_HEIGHT = 60;
  const EXPANDED_HEIGHT = screenHeight * 0.6;

  // Animated height
  const height = useSharedValue(COLLAPSED_HEIGHT);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(height.value, {
        damping: 20,
        stiffness: 90,
      }),
    };
  });

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    height.value = newExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

    // Reset mode when collapsing
    if (!newExpanded) {
      setInputMode(null);
      setTextInput('');
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput.trim());
      setTextInput('');
      setInputMode(null);
      toggleExpanded();
    }
  };

  const handleVoiceComplete = (transcript: string) => {
    onVoiceTranscript(transcript);
    setInputMode(null);
    toggleExpanded();
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: '#10b981',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
      ]}
      className="dark:bg-slate-900"
    >
      {/* Tab Header - Always Visible */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center">
            <Plus size={20} color="#10b981" />
          </View>
          <View>
            <Text className="text-slate-900 dark:text-white text-base font-bold">
              New Task
            </Text>
            {pendingDraftsCount > 0 && (
              <Text className="text-green-600 dark:text-green-400 text-xs font-medium">
                {pendingDraftsCount} draft{pendingDraftsCount !== 1 ? 's' : ''} pending
              </Text>
            )}
            {!isExpanded && pendingDraftsCount === 0 && (
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                Voice or type to create
              </Text>
            )}
          </View>
        </View>

        {/* Expand/Collapse Indicator */}
        <View className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-full items-center justify-center">
          {isExpanded ? (
            <ChevronDown size={18} color="#64748b" />
          ) : (
            <ChevronUp size={18} color="#64748b" />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="flex-1 px-5 pb-6">
          {/* Mode Selection or Active Input */}
          {inputMode === null ? (
            <View>
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-3">
                Choose input method:
              </Text>

              <View className="flex-row gap-3 mb-4">
                {/* Voice Button */}
                <Pressable
                  onPress={() => setInputMode('voice')}
                  className="flex-1 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 items-center active:opacity-70"
                >
                  <View className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full items-center justify-center mb-2">
                    <Mic size={24} color="#10b981" />
                  </View>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Voice
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs text-center mt-1">
                    Speak naturally
                  </Text>
                </Pressable>

                {/* Text Button */}
                <Pressable
                  onPress={() => setInputMode('text')}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 items-center active:opacity-70"
                >
                  <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full items-center justify-center mb-2">
                    <Type size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Type
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs text-center mt-1">
                    Describe tasks
                  </Text>
                </Pressable>
              </View>

              {/* Info Box */}
              <View className="flex-row items-start gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                <Lightbulb size={16} color="#64748b" />
                <View className="flex-1">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    The AI will extract tasks from your input including title, assignee, and time estimate.
                  </Text>
                </View>
              </View>
            </View>
          ) : inputMode === 'voice' ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-6">
                Tap to record your tasks
              </Text>

              <VoiceInputButton
                onTranscriptComplete={handleVoiceComplete}
                onError={(error) => console.error('[TaskCreator] Voice error:', error)}
                color="#10b981"
                size={80}
              />

              <Pressable
                onPress={() => setInputMode(null)}
                className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-medium">
                  Back
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-3">
                Describe your tasks
              </Text>

              <TextInput
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Example: Create a task to fix the login bug, assign it to engineering, and set it for next Friday. Estimated 2 time units."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                className="bg-slate-100 dark:bg-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white mb-3 min-h-[150px]"
                style={{ textAlignVertical: 'top' }}
              />

              <View className="flex-row items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mb-4">
                <Lightbulb size={16} color="#10b981" />
                <Text className="flex-1 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  <Text className="font-semibold">Tip:</Text> Mention who should do it, when it's due, and how long it will take for best results.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setInputMode(null)}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl items-center"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                    Back
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="flex-1 bg-green-500 py-3 rounded-xl items-center"
                  style={{ opacity: textInput.trim() ? 1 : 0.5 }}
                >
                  <Text className="text-white font-semibold">
                    Extract Tasks
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}
