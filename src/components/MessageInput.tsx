/**
 * Message Input Component
 * Composable message input with file attachment support
 */

import { View, Text, TextInput, Pressable, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { Send, Paperclip, X, Mic, Square } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';
import { lightImpact, heavyImpact } from '@/lib/haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

interface MessageInputProps {
  onSend: (content: string, attachments?: any[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSend = async () => {
    if (message.trim() || attachments.length > 0) {
      await lightImpact();
      onSend(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      inputRef.current?.focus();
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachments([...attachments, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleAttachImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachments([...attachments, result.assets[0]]);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        alert('Permission to access microphone is required!');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      heavyImpact();

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      heavyImpact();

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Get the URI
      const uri = recordingRef.current.getURI();

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (uri) {
        // Add audio as attachment
        setAttachments([...attachments, {
          uri,
          name: `Voice Message ${recordingDuration}s`,
          type: 'audio/m4a',
          size: 0, // We don't have the size yet
        }]);
      }

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to save recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;

    try {
      lightImpact();

      // Stop and discard recording
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-white dark:bg-slate-950 border-t border-gray-300 dark:border-slate-700 px-4 py-3">
      {/* Recording indicator */}
      {isRecording && (
        <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse" />
            <Text className="text-red-600 dark:text-red-400 font-bold text-base">
              Recording...
            </Text>
          </View>
          <Text className="text-red-600 dark:text-red-400 font-mono text-lg font-bold">
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {attachments.map((attachment, index) => (
            <View
              key={index}
              className="bg-gray-100 dark:bg-slate-900 rounded-lg px-3 py-2 flex-row items-center"
            >
              <Text className="text-gray-900 dark:text-white text-xs mr-2" numberOfLines={1}>
                {attachment.name || 'Image'}
              </Text>
              <Pressable onPress={() => removeAttachment(index)}>
                <X size={14} color="#64748b" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Input row */}
      {isRecording ? (
        // Recording controls
        <View className="flex-row items-center gap-3">
          <HapticPressable
            onPress={cancelRecording}
            className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-full py-4 items-center active:opacity-70"
          >
            <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">
              Cancel
            </Text>
          </HapticPressable>
          <HapticPressable
            onPress={stopRecording}
            hapticType="heavy"
            className="flex-1 bg-red-500 rounded-full py-4 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <Square size={20} color="#fff" fill="#fff" />
            <Text className="text-white font-bold text-base">
              Stop & Send
            </Text>
          </HapticPressable>
        </View>
      ) : (
        // Normal input controls
        <View className="flex-row items-center gap-2">
          {/* Attachment button */}
          <HapticPressable
            onPress={handleAttachFile}
            disabled={disabled}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
          >
            <Paperclip size={20} color="#64748b" />
          </HapticPressable>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            editable={!disabled}
            multiline
            maxLength={1000}
            className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-full px-4 py-3 text-gray-900 dark:text-white text-base max-h-24"
            style={{ paddingTop: Platform.OS === 'ios' ? 12 : 8 }}
          />

          {/* Microphone button (show when no message) */}
          {!message.trim() && attachments.length === 0 ? (
            <HapticPressable
              onPress={startRecording}
              disabled={disabled}
              hapticType="medium"
              className="w-10 h-10 items-center justify-center rounded-full bg-blue-500 active:opacity-80"
            >
              <Mic size={20} color="#fff" />
            </HapticPressable>
          ) : (
            // Send button (show when there's a message or attachments)
            <HapticPressable
              onPress={handleSend}
              disabled={disabled}
              hapticType="medium"
              className="w-10 h-10 items-center justify-center rounded-full bg-blue-500 active:opacity-80"
            >
              <Send size={20} color="#fff" />
            </HapticPressable>
          )}
        </View>
      )}
    </View>
  );
}
