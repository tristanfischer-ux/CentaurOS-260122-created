/**
 * Message Input Component
 * Composable message input with file attachment support
 */

import { View, Text, TextInput, Pressable, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';
import { lightImpact } from '@/lib/haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

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
  const inputRef = useRef<TextInput>(null);

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

  return (
    <View className="bg-white dark:bg-slate-950 border-t border-gray-300 dark:border-slate-700 px-4 py-3">
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

        {/* Send button */}
        <HapticPressable
          onPress={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          hapticType="medium"
          className={`w-10 h-10 items-center justify-center rounded-full ${
            message.trim() || attachments.length > 0
              ? 'bg-blue-500'
              : 'bg-gray-100 dark:bg-slate-900'
          } active:opacity-80`}
        >
          <Send
            size={20}
            color={message.trim() || attachments.length > 0 ? '#fff' : '#94a3b8'}
          />
        </HapticPressable>
      </View>
    </View>
  );
}
