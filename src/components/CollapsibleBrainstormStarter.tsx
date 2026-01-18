/**
 * Collapsible Brainstorm Starter
 * Drawer component for starting brainstorming sessions via voice or text
 */

import { View, Text, Pressable, TextInput, Dimensions } from 'react-native';
import { useState } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Lightbulb, Mic, Type, Sparkles } from 'lucide-react-native';
import { VoiceInputButton } from './VoiceInputButton';

interface CollapsibleBrainstormStarterProps {
  onVoiceInput: (transcript: string) => void;
  onTextInput: (text: string) => void;
  activeSessions?: number;
}

type InputMode = 'voice' | 'text' | null;

export function CollapsibleBrainstormStarter({
  onVoiceInput,
  onTextInput,
  activeSessions = 0,
}: CollapsibleBrainstormStarterProps) {
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
      onTextInput(textInput.trim());
      setTextInput('');
      setInputMode(null);
      toggleExpanded();
    }
  };

  const handleVoiceComplete = (transcript: string) => {
    onVoiceInput(transcript);
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
          borderTopColor: '#8b5cf6',
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
          <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center">
            <Lightbulb size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text className="text-slate-900 dark:text-white text-base font-bold">
              Start Brainstorm
            </Text>
            {activeSessions > 0 && (
              <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                {activeSessions} active session{activeSessions !== 1 ? 's' : ''}
              </Text>
            )}
            {!isExpanded && activeSessions === 0 && (
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                Share your ideas
              </Text>
            )}
          </View>
        </View>

        {/* Expand/Collapse Indicator */}
        <View className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
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
                  className="flex-1 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 items-center active:opacity-70"
                >
                  <View className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full items-center justify-center mb-2">
                    <Mic size={24} color="#8b5cf6" />
                  </View>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Voice
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs text-center mt-1">
                    Speak your ideas
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
                    Write them down
                  </Text>
                </Pressable>
              </View>

              {/* Info Box */}
              <View className="flex-row items-start gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
                <Sparkles size={16} color="#8b5cf6" />
                <View className="flex-1">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    The AI will ask you questions to help define strategic objectives and create actionable tasks.
                  </Text>
                </View>
              </View>
            </View>
          ) : inputMode === 'voice' ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-6">
                Tap to share your ideas
              </Text>

              <VoiceInputButton
                onTranscriptComplete={handleVoiceComplete}
                onError={(error) => console.error('[BrainstormStarter] Voice error:', error)}
                color="#8b5cf6"
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
                Share your ideas
              </Text>

              <TextInput
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Example: I want to build a feature that helps users track their fitness goals. We need to integrate with health apps and provide personalized recommendations."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white mb-3 min-h-[150px]"
                style={{ textAlignVertical: 'top' }}
              />

              <View className="flex-row items-start gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 mb-4">
                <Sparkles size={16} color="#8b5cf6" />
                <Text className="flex-1 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  <Text className="font-semibold">Tip:</Text> Describe what you want to achieve, why it matters, and any constraints or ideas you have.
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
                  className="flex-1 bg-purple-500 py-3 rounded-xl items-center"
                  style={{ opacity: textInput.trim() ? 1 : 0.5 }}
                >
                  <Text className="text-white font-semibold">
                    Start Session
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
