/**
 * Chat Bubble Component
 * Message display component with support for attachments and read receipts
 */

import { View, Text, Pressable, Image } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import { Message } from '@/lib/state/messages-store';
import { format } from 'date-fns';

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender?: boolean;
}

export function ChatBubble({ message, isOwnMessage, showSender = false }: ChatBubbleProps) {
  const getRoleColor = (role: Message['senderRole']) => {
    switch (role) {
      case 'Founder':
        return '#8b5cf6';
      case 'FractionalExec':
        return '#3b82f6';
      case 'Apprentice':
        return '#10b981';
    }
  };

  return (
    <View className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      {/* Sender name (for group chats) */}
      {showSender && !isOwnMessage && (
        <View className="flex-row items-center mb-1 px-2">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: getRoleColor(message.senderRole) }}
          />
          <Text className="text-gray-600 dark:text-slate-400 text-xs font-medium">
            {message.senderName}
          </Text>
        </View>
      )}

      {/* Message bubble */}
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isOwnMessage
            ? 'bg-blue-500'
            : 'bg-gray-100 dark:bg-slate-900'
        }`}
      >
        {/* Message content */}
        <Text
          className={`text-base leading-5 ${
            isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}
        >
          {message.content}
        </Text>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <View className="mt-3 gap-2">
            {message.attachments.map((attachment) => (
              <Pressable
                key={attachment.id}
                className={`flex-row items-center p-3 rounded-xl active:opacity-70 ${
                  isOwnMessage
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-slate-700'
                }`}
              >
                {attachment.type.startsWith('image/') ? (
                  <Image
                    source={{ uri: attachment.url }}
                    className="w-12 h-12 rounded-lg mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className={`w-12 h-12 rounded-lg mr-3 items-center justify-center ${
                      isOwnMessage ? 'bg-blue-700' : 'bg-gray-300 dark:bg-slate-600'
                    }`}
                  >
                    <FileText size={24} color={isOwnMessage ? '#fff' : '#64748b'} />
                  </View>
                )}

                <View className="flex-1">
                  <Text
                    className={`font-medium text-sm ${
                      isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}
                    numberOfLines={1}
                  >
                    {attachment.name}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    {(attachment.size / 1024).toFixed(1)} KB
                  </Text>
                </View>

                <Download size={16} color={isOwnMessage ? '#fff' : '#64748b'} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Timestamp */}
        <Text
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-slate-500'
          }`}
        >
          {format(new Date(message.timestamp), 'h:mm a')}
          {isOwnMessage && message.read && ' • Read'}
        </Text>
      </View>
    </View>
  );
}
